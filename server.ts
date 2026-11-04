import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MARE123';

const DATA_DIR = path.resolve(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SEQUENCE_FILE = path.join(DATA_DIR, 'daily_sequence.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed orders for realistic testing
const INITIAL_SEED_ORDERS = [
  {
    id: 'ord-seed-01',
    orderNumber: '#001',
    customerName: 'Carlos Silva',
    orderType: 'local',
    tableNumber: '03',
    items: [
      {
        cartItemId: 'item-seed-1',
        product: {
          id: 'bacon_caramelizado',
          name: 'Bacon Caramelizado',
          categoryId: 'artesanais',
          categoryLabel: 'Alto-Mar',
          price: 34.9,
          description: 'Blend bovino 180g na brasa...',
          image: '/src/assets/images/hero_idle_burger_1793068213371.jpg',
          isBurger: true,
          defaultIngredients: ['Pão brioche', 'Blend 180g', 'Bacon caramelizado'],
          suggestedAddons: [],
        },
        quantity: 1,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Cebola roxa'],
          selectedAddons: { queijo_extra: 1 },
          specialNotes: 'Bacon bem tostadinho por favor',
        },
        unitPrice: 39.4,
        totalPrice: 39.4,
      },
      {
        cartItemId: 'item-seed-2',
        product: {
          id: 'batata_mare',
          name: 'Batata da Maré',
          categoryId: 'entradas',
          categoryLabel: 'Primeira Onda',
          price: 24.9,
          description: '',
          image: '/src/assets/images/mare_porcoes_batata_1793068213557.jpg',
          isBurger: false,
          defaultIngredients: ['Batatas rústicas'],
          suggestedAddons: [],
        },
        quantity: 1,
        unitPrice: 24.9,
        totalPrice: 24.9,
      },
    ],
    observations: 'Sem guardanapos plásticos, por favor.',
    subtotal: 64.3,
    total: 64.3,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'preparo',
    createdAt: Date.now() - 1000 * 60 * 7,
    formattedTime: '13:45',
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-02',
    orderNumber: '#002',
    customerName: 'Mariana Costa',
    orderType: 'viagem',
    items: [
      {
        cartItemId: 'item-seed-3',
        product: {
          id: 'costela_queijo_regional',
          name: 'Costela com Queijo Regional',
          categoryId: 'prime',
          categoryLabel: 'Maré Nobre',
          price: 39.9,
          description: '',
          image: '/src/assets/images/mare_nobre_burger_1793068212982.jpg',
          isBurger: true,
          defaultIngredients: ['Pão australiano', 'Blend nobre 200g'],
          suggestedAddons: [],
        },
        quantity: 1,
        customization: {
          meatDoneness: 'Bem passado',
          removedIngredients: [],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 39.9,
        totalPrice: 39.9,
      },
    ],
    observations: 'Embalar bem para viagem de moto.',
    subtotal: 39.9,
    total: 39.9,
    paymentMethod: 'cartao_balcao',
    paymentStatus: 'pago',
    status: 'recebido',
    createdAt: Date.now() - 1000 * 60 * 2,
    formattedTime: '13:50',
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-03',
    orderNumber: '#003',
    customerName: 'Lucas Lima',
    orderType: 'local',
    tableNumber: '07',
    items: [
      {
        cartItemId: 'item-seed-4',
        product: {
          id: 'smash_duas_ondas',
          name: 'Smash Duas Ondas',
          categoryId: 'smash',
          categoryLabel: 'Onda Smash',
          price: 23.9,
          description: '',
          image: '/src/assets/images/mare_smash_burger_1793068213279.jpg',
          isBurger: true,
          defaultIngredients: [],
          suggestedAddons: [],
        },
        quantity: 2,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Picles artesanal'],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 23.9,
        totalPrice: 47.8,
      },
    ],
    observations: '',
    subtotal: 47.8,
    total: 47.8,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'pronto',
    createdAt: Date.now() - 1000 * 60 * 18,
    formattedTime: '13:34',
    estimatedMinutes: 15,
  },
];

// Helper to read orders from file
function readOrdersFromFile(): any[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(INITIAL_SEED_ORDERS, null, 2), 'utf-8');
      return INITIAL_SEED_ORDERS;
    }
    const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading orders from file:', err);
    return INITIAL_SEED_ORDERS;
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
    let seqData = { date: today, counter: 3 };

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
  app.use(express.json());

  // SSE Real-Time Stream Endpoint
  app.get('/api/orders/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
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
    const orders = readOrdersFromFile();
    res.json(orders);
  });

  // POST create new order (from Kiosk)
  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const {
        customerName,
        orderType,
        tableNumber,
        items,
        observations,
        subtotal,
        total,
        paymentMethod,
        paymentStatus,
      } = req.body;

      if (!customerName || !customerName.trim()) {
        res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'O carrinho não pode estar vazio.' });
        return;
      }

      const orderNumber = getNextDailyOrderNumber();
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const newOrder = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderNumber,
        customerName: customerName.trim(),
        orderType: orderType || 'local',
        tableNumber: orderType === 'local' ? tableNumber || '01' : undefined,
        items,
        observations: (observations || '').trim(),
        subtotal: subtotal || total,
        total,
        paymentMethod: paymentMethod || 'pix',
        paymentStatus: paymentStatus || 'pago',
        status: 'recebido', // Todo pedido novo começa como "Recebido"
        createdAt: Date.now(),
        formattedTime,
        estimatedMinutes: 15,
      };

      const orders = readOrdersFromFile();
      const updated = [newOrder, ...orders];
      writeOrdersToFile(updated);

      // Notify all connected screens in real time
      broadcastOrdersUpdate(updated);

      res.status(201).json(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Erro interno ao salvar pedido.' });
    }
  });

  // PATCH update order status (from Kitchen)
  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['recebido', 'preparo', 'pronto', 'entregue'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Status inválido.' });
        return;
      }

      const orders = readOrdersFromFile();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Pedido não encontrado.' });
        return;
      }

      orders[index].status = status;
      if (status === 'pronto') {
        orders[index].announcedAt = Date.now();
      }

      writeOrdersToFile(orders);
      broadcastOrdersUpdate(orders);

      res.json(orders[index]);
    } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  });

  // POST admin login verification for Kitchen
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
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

  // Vite development middleware
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Maré PDV Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
