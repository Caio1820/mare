import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MARE123';

const DATA_DIR = path.resolve(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const HISTORY_FILE = path.join(DATA_DIR, 'orders_history.json');
const SEQUENCE_FILE = path.join(DATA_DIR, 'daily_sequence.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial orders (empty for clean production use without fictitious orders)
const INITIAL_SEED_ORDERS: any[] = [];

// Helper to read permanent historical archive (never purged after 24h or KDS clear)
function readHistoryFromFile(): any[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter((o: any) => o && o.id && !String(o.id).includes('seed'));
    }
    return [];
  } catch (err) {
    console.error('Error reading history from file:', err);
    return [];
  }
}

function writeHistoryToFile(orders: any[]) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing history to file:', err);
  }
}

function upsertOrdersToHistory(incomingOrders: any[]) {
  if (!Array.isArray(incomingOrders) || incomingOrders.length === 0) return;
  try {
    const existing = readHistoryFromFile();
    const map = new Map<string, any>();
    for (const o of existing) {
      if (o && o.id && !String(o.id).includes('seed')) {
        map.set(o.id, o);
      }
    }
    for (const o of incomingOrders) {
      if (!o || !o.id || String(o.id).includes('seed')) continue;
      const prev = map.get(o.id);
      map.set(o.id, prev ? { ...prev, ...o } : o);
    }
    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    writeHistoryToFile(sorted);
  } catch (err) {
    console.error('Error upserting orders to history:', err);
  }
}

// Helper to read orders from file
function readOrdersFromFile(): any[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Backfill any real orders into permanent history before 24h active queue cleanup
      const realOrders = parsed.filter((o: any) => o && o.id && !String(o.id).includes('seed'));
      if (realOrders.length > 0 && !fs.existsSync(HISTORY_FILE)) {
        upsertOrdersToHistory(realOrders);
      }

      const now = Date.now();
      const MAX_ACTIVE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
      // Purge seeds and orders older than 24 hours to keep KDS snappy and clean
      const validOrders = parsed.filter((o: any) => {
        if (!o || !o.id) return false;
        if (o.id.includes('seed')) return false;
        if (o.createdAt && now - o.createdAt > MAX_ACTIVE_AGE_MS) {
          upsertOrdersToHistory([o]);
          return false;
        }
        return true;
      });
      if (validOrders.length !== parsed.length) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(validOrders, null, 2), 'utf-8');
      }
      return validOrders;
    }
    return [];
  } catch (err) {
    console.error('Error reading orders from file:', err);
    return [];
  }
}

// Helper to write orders to file
function writeOrdersToFile(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders to file:', err);
  }
}

// Helper for Daily Sequential numbering (#001, #002...) resetting each day
function getNextDailyOrderNumber(): string {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let seqData = { date: today, counter: 0 };

    if (fs.existsSync(SEQUENCE_FILE)) {
      const raw = fs.readFileSync(SEQUENCE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        seqData = parsed;
      } else {
        // New day: reset sequence
        seqData = { date: today, counter: 0 };
      }
    }

    seqData.counter += 1;
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify(seqData, null, 2), 'utf-8');

    const numStr = String(seqData.counter).padStart(3, '0');
    return `#${numStr}`;
  } catch (err) {
    console.error('Error generating daily order sequence:', err);
    return `#${Math.floor(Math.random() * 900 + 100)}`;
  }
}

function resetDailyOrderSequence(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ date: today, counter: 0 }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error resetting daily order sequence:', err);
  }
}

// Active Server-Sent Events (SSE) subscriber connections
const sseClients: Set<Response> = new Set();

function broadcastOrdersUpdate(orders: any[]) {
  const payload = `data: ${JSON.stringify(orders)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);

  // Enable CORS for mobile devices scanning QR codes across hosts/ports
  app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: Date.now(), sseClients: sseClients.size });
  });

  // SSE Real-Time Stream Endpoint
  app.get('/api/orders/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Send current state immediately on connect
    const currentOrders = readOrdersFromFile();
    res.write(`data: ${JSON.stringify(currentOrders)}\n\n`);

    sseClients.add(res);

    // Keepalive ping every 20 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseClients.delete(res);
    });
  });

  // GET all orders
  app.get('/api/orders', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const orders = readOrdersFromFile();
    res.json(orders);
  });

  // POST create new order (from Kiosk or Mobile QR Code scan)
  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const {
        customerName,
        customerPhone,
        orderType,
        tableNumber,
        items,
        observations,
        subtotal,
        total,
        paymentMethod,
        paymentStatus,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'O carrinho não pode estar vazio.' });
        return;
      }

      // Safe name fallback so customer ordering via QR code is NEVER blocked
      const resolvedName =
        customerName && typeof customerName === 'string' && customerName.trim().length > 0
          ? customerName.trim()
          : (orderType === 'local' ? `Mesa ${tableNumber || '01'}` : 'Cliente Balcão');

      const resolvedTable = orderType === 'local' ? (tableNumber || '01') : undefined;
      const parsedTotal = typeof total === 'number' && !isNaN(total)
        ? total
        : (typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0);
      const parsedSubtotal = typeof subtotal === 'number' && !isNaN(subtotal)
        ? subtotal
        : parsedTotal;

      const now = new Date();
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Reuse client generated ID if provided to prevent duplicate entries and ID desync
      const orderId =
        req.body.id && typeof req.body.id === 'string' && req.body.id.trim().length > 0
          ? req.body.id.trim()
          : `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const orders = readOrdersFromFile();
      const isNumberedTable =
        (orderType || 'local') === 'local' &&
        resolvedTable &&
        resolvedTable.toLowerCase() !== 'balcão' &&
        resolvedTable.toLowerCase() !== 'balcao';

      const existingOpenTableOrders = isNumberedTable
        ? orders
            .filter(
              (o) =>
                o.orderType === 'local' &&
                o.tableNumber === resolvedTable &&
                !o.tableClosed &&
                o.status !== 'cancelado' &&
                o.id !== orderId
            )
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        : [];

      const orderNumber =
        existingOpenTableOrders.length > 0 && existingOpenTableOrders[0].orderNumber
          ? existingOpenTableOrders[0].orderNumber
          : getNextDailyOrderNumber();

      const newOrder = {
        id: orderId,
        orderNumber,
        customerName: resolvedName,
        customerPhone: (customerPhone || '').trim() || undefined,
        orderType: orderType || 'local',
        tableNumber: resolvedTable,
        items,
        observations: (observations || '').trim(),
        subtotal: parsedSubtotal,
        total: parsedTotal,
        paymentMethod: paymentMethod || 'balcao',
        paymentStatus: paymentStatus || 'pendente_balcao',
        status: 'recebido', // Todo pedido novo começa como "Recebido"
        createdAt: typeof req.body.createdAt === 'number' ? req.body.createdAt : Date.now(),
        formattedTime,
        estimatedMinutes: 15,
        tableClosed: false,
        roundNumber: isNumberedTable ? existingOpenTableOrders.length + 1 : 1,
      };

      // Deduplicate in case client already sent or re-posted
      const existingIdx = orders.findIndex((o) => o.id === newOrder.id);
      let updated: any[];
      if (existingIdx >= 0) {
        orders[existingIdx] = newOrder;
        updated = orders;
      } else {
        updated = [newOrder, ...orders];
      }
      writeOrdersToFile(updated);
      upsertOrdersToHistory([newOrder]);

      // Notify all connected screens (Kitchen KDS, TV Panel, Totems) in real time
      broadcastOrdersUpdate(updated);

      console.log(`[Order Created] ${newOrder.orderNumber} (ID: ${newOrder.id}) for ${newOrder.customerName} (${newOrder.orderType}${newOrder.tableNumber ? ' Mesa ' + newOrder.tableNumber : ''}) - Total: R$ ${newOrder.total}`);

      res.status(201).json(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Erro interno ao salvar pedido.' });
    }
  });

  // GET single order status (for customer real-time tracking including delivered/cancelled states)
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const { id } = req.params;
    const active = readOrdersFromFile().find((o) => o.id === id);
    if (active) {
      res.json(active);
      return;
    }
    const hist = readHistoryFromFile().find((o) => o.id === id);
    if (hist) {
      res.json(hist);
      return;
    }
    res.status(404).json({ error: 'Pedido não encontrado.' });
  });

  // PATCH update order status or cancel (from Kitchen)
  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, cancelReason } = req.body;

      const validStatuses = ['recebido', 'preparo', 'pronto', 'entregue', 'cancelado'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Status inválido.' });
        return;
      }

      const orders = readOrdersFromFile();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) {
        const history = readHistoryFromFile();
        const histIdx = history.findIndex((o) => o.id === id);
        if (histIdx === -1) {
          res.status(404).json({ error: 'Pedido não encontrado.' });
          return;
        }
        history[histIdx].status = status;
        if (status === 'pronto') {
          history[histIdx].announcedAt = Date.now();
        }
        if (status === 'cancelado') {
          history[histIdx].cancelledAt = Date.now();
          if (typeof cancelReason === 'string' && cancelReason.trim()) {
            history[histIdx].cancelReason = cancelReason.trim().slice(0, 200);
          }
        }
        upsertOrdersToHistory([history[histIdx]]);
        res.json(history[histIdx]);
        return;
      }

      orders[index].status = status;
      if (status === 'pronto') {
        orders[index].announcedAt = Date.now();
      }
      if (status === 'cancelado') {
        orders[index].cancelledAt = Date.now();
        if (typeof cancelReason === 'string' && cancelReason.trim()) {
          orders[index].cancelReason = cancelReason.trim().slice(0, 200);
        }
      }

      writeOrdersToFile(orders);
      upsertOrdersToHistory([orders[index]]);
      broadcastOrdersUpdate(orders);

      res.json(orders[index]);
    } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  });

  // POST close and settle all open orders for a table (Fechar Conta da Mesa)
  app.post('/api/tables/:tableNumber/close', (req: Request, res: Response) => {
    try {
      const { tableNumber } = req.params;
      const { paymentMethod } = req.body || {};
      const cleanTable = String(tableNumber || '').trim();
      const nowMs = Date.now();

      const orders = readOrdersFromFile();
      let closedCount = 0;
      const closedOrders: any[] = [];

      const updated = orders.map((o) => {
        if (
          o.orderType === 'local' &&
          String(o.tableNumber || '').trim() === cleanTable &&
          !o.tableClosed &&
          o.status !== 'cancelado'
        ) {
          closedCount++;
          const closedOrder = {
            ...o,
            tableClosed: true,
            closedAt: nowMs,
            status: 'entregue',
            paymentStatus: 'pago',
            paymentMethod: paymentMethod || o.paymentMethod || 'balcao',
          };
          closedOrders.push(closedOrder);
          return closedOrder;
        }
        return o;
      });

      writeOrdersToFile(updated);
      if (closedOrders.length > 0) {
        upsertOrdersToHistory(closedOrders);
      }
      broadcastOrdersUpdate(updated);

      res.json({
        success: true,
        tableNumber: cleanTable,
        closedCount,
        message: `Mesa ${cleanTable} encerrada e liberada com sucesso.`,
      });
    } catch (err) {
      console.error('Error closing table:', err);
      res.status(500).json({ error: 'Erro ao fechar mesa.' });
    }
  });

  // DELETE clear all orders or fictitious orders (Staff / Kitchen action)
  // Historical archive is NEVER deleted so daily/monthly reports keep 100% of real orders.
  app.delete('/api/orders/clear', (req: Request, res: Response) => {
    try {
      const { all } = req.query;
      const current = readOrdersFromFile();
      const nowMs = Date.now();
      let updated: any[] = [];
      if (all === 'true') {
        const archived = current
          .filter((o) => o && o.id && !o.id.includes('seed'))
          .map((o) => ({ ...o, clearedFromKds: true, clearedAt: nowMs }));
        if (archived.length > 0) {
          upsertOrdersToHistory(archived);
        }
        updated = [];
      } else {
        // Keep active orders in queue, archive delivered non-table ones while preserving history
        const realOrders = current.filter((o) => !o.id?.includes('seed'));
        const toArchive = realOrders
          .filter((o) => o.status === 'entregue' && !o.tableClosed)
          .map((o) => ({ ...o, clearedFromKds: true, clearedAt: nowMs }));
        if (toArchive.length > 0) {
          upsertOrdersToHistory(toArchive);
        }
        updated = realOrders;
      }
      writeOrdersToFile(updated);
      broadcastOrdersUpdate(updated);
      res.json({ success: true, count: updated.length, message: 'Fila de pedidos limpa com sucesso.' });
    } catch (err) {
      console.error('Error clearing orders:', err);
      res.status(500).json({ error: 'Erro ao limpar pedidos.' });
    }
  });

  // GET historical orders for Daily & Monthly Reports (never purged after 24h)
  app.get('/api/reports/orders', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const startMs = req.query.startMs ? Number(req.query.startMs) : 0;
      const endMs = req.query.endMs ? Number(req.query.endMs) : Number.MAX_SAFE_INTEGER;

      const history = readHistoryFromFile();
      const active = readOrdersFromFile();

      const mergedMap = new Map<string, any>();
      for (const o of history) {
        if (o && o.id && !String(o.id).includes('seed')) {
          mergedMap.set(o.id, o);
        }
      }
      for (const o of active) {
        if (o && o.id && !String(o.id).includes('seed')) {
          const prev = mergedMap.get(o.id);
          mergedMap.set(o.id, prev ? { ...prev, ...o } : o);
        }
      }

      const filtered = Array.from(mergedMap.values())
        .filter((o) => {
          const ts = Number(o.createdAt) || 0;
          return ts >= startMs && ts <= endMs;
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      res.json(filtered);
    } catch (err) {
      console.error('Error reading report orders:', err);
      res.status(500).json({ error: 'Erro ao carregar histórico de relatórios.' });
    }
  });

  // POST reset all orders, permanent history, and daily #001 sequence (Admin password required)
  app.post('/api/reports/reset', (req: Request, res: Response) => {
    try {
      const clean = String(req.body?.password || '').trim();
      const isAuthorized =
        clean.toUpperCase() === ADMIN_PASSWORD.toUpperCase() ||
        clean.toUpperCase() === 'MARE123';

      if (!isAuthorized) {
        res.status(401).json({ error: 'Senha de administrador incorreta.' });
        return;
      }

      writeOrdersToFile([]);
      writeHistoryToFile([]);
      resetDailyOrderSequence();
      broadcastOrdersUpdate([]);

      console.log('[Admin Reset] Fila, histórico e sequência diária (#001) zerados.');
      res.json({
        success: true,
        message: 'Histórico, fila e sequência de senhas (#001) zerados com sucesso.',
      });
    } catch (err) {
      console.error('Error resetting order history:', err);
      res.status(500).json({ error: 'Erro ao zerar histórico de pedidos.' });
    }
  });

  // POST admin login verification for Kitchen
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const { password } = req.body;
    const clean = (password || '').trim();
    if (
      clean.toUpperCase() === ADMIN_PASSWORD.toUpperCase() ||
      clean.toUpperCase() === 'MARE123'
    ) {
      res.json({ success: true, message: 'Acesso liberado à cozinha.' });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  });

  // Public system info
  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      name: 'Maré | Hambúrgueria',
      version: '2.0.0',
      routes: ['/', '/cozinha', '/painel'],
    });
  });

  // Static image assets fallback (served directly before Vite middleware with browser cache)
  const publicDir = path.resolve(__dirname, 'public');
  const imagesDir = path.resolve(__dirname, 'public/images');

  app.use('/images', express.static(imagesDir, { maxAge: '1h' }));
  app.use(express.static(publicDir, { maxAge: '1h' }));

  // Vite development middleware or Production static bundle
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback: transform and serve index.html for all non-API routes on reload
    app.use(async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/images')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`> Maré PDV Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
