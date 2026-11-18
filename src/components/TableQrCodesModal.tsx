import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Printer, Copy, Check, X, ExternalLink } from 'lucide-react';
import { playTouchSound } from '../utils/sound';

interface TableQrCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableQrItem {
  tableNumber: string;
  url: string;
  dataUrl: string;
}

const TABLE_NUMBERS = Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, '0'));

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function printTableQrCards(items: TableQrItem[]): void {
  if (items.length === 0) return;

  const existingIframe = document.getElementById('mare-qr-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'mare-qr-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const cardsHtml = items
    .map(
      (item) => `
      <div class="qr-card">
        <div class="brand">MARÉ HAMBURGUERIA</div>
        <div class="table-badge">MESA ${escapeHtml(item.tableNumber)}</div>
        <div class="qr-box">
          <img src="${item.dataUrl}" alt="QR Code Mesa ${escapeHtml(item.tableNumber)}" />
        </div>
        <div class="cta">APONTE A CÂMERA DO CELULAR</div>
        <div class="sub">Para ver o cardápio e fazer seu pedido direto da Mesa ${escapeHtml(item.tableNumber)}</div>
        <div class="url">${escapeHtml(item.url)}</div>
      </div>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>QR Codes das Mesas - Maré Hambúrgueria</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12mm;
    }
    .qr-card {
      border: 2px solid #09090b;
      border-radius: 14px;
      padding: 14px 12px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #ffffff;
    }
    .brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #52525b;
    }
    .table-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 5px 18px;
      border-radius: 999px;
      background: #09090b;
      color: #f59e0b;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .qr-box {
      margin: 10px auto;
      width: 170px;
      height: 170px;
      padding: 6px;
      border: 1px dashed #d4d4d8;
      border-radius: 10px;
      background: #ffffff;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .cta {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #09090b;
      margin-top: 4px;
    }
    .sub {
      font-size: 10px;
      color: #3f3f46;
      margin-top: 3px;
      line-height: 1.3;
    }
    .url {
      margin-top: 6px;
      font-family: 'Courier New', monospace;
      font-size: 8px;
      color: #71717a;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>
</body>
</html>`;

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  setTimeout(() => {
    const win = iframe.contentWindow;
    if (!win) return;
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
  }, 200);
}

export const TableQrCodesModal: React.FC<TableQrCodesModalProps> = ({ isOpen, onClose }) => {
  const [baseUrl, setBaseUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const cleanBaseUrl = useMemo(() => {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    if (!trimmed) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
    return trimmed;
  }, [baseUrl]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsGenerating(true);

    Promise.all(
      TABLE_NUMBERS.map(async (tableNumber) => {
        const url = `${cleanBaseUrl}/?mesa=${tableNumber}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        return [tableNumber, dataUrl] as const;
      })
    )
      .then((entries) => {
        if (cancelled) return;
        const nextMap: Record<string, string> = {};
        for (const [t, dataUrl] of entries) {
          nextMap[t] = dataUrl;
        }
        setQrMap(nextMap);
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, cleanBaseUrl]);

  if (!isOpen) return null;

  const qrItems: TableQrItem[] = TABLE_NUMBERS.map((tableNumber) => ({
    tableNumber,
    url: `${cleanBaseUrl}/?mesa=${tableNumber}`,
    dataUrl: qrMap[tableNumber] || '',
  }));

  const handleCopy = async (tableNumber: string, url: string) => {
    playTouchSound(540);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTable(tableNumber);
      setTimeout(() => {
        setCopiedTable((prev) => (prev === tableNumber ? null : prev));
      }, 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-100">
                QR Codes das Mesas (01 a 11)
              </h2>
              <p className="text-xs text-zinc-400">
                Cliente escaneia na mesa e faz o pedido travado naquela numeração, sem ver Cozinha ou outras mesas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGenerating || qrItems.some((item) => !item.dataUrl)}
              onClick={() => {
                playTouchSound(580);
                printTableQrCards(qrItems.filter((item) => !!item.dataUrl));
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 min-h-[44px] active:scale-95 transition-all shadow-md"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir Todos (01 a 11)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTouchSound(420);
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center"
              aria-label="Fechar modal de QR Codes"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable Base URL */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 shrink-0">
            Endereço Base do Cardápio:
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://seu-endereco.app"
            className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-zinc-100 focus:outline-none min-h-[40px]"
          />
          {typeof window !== 'undefined' && cleanBaseUrl !== window.location.origin && (
            <button
              type="button"
              onClick={() => {
                playTouchSound(500);
                setBaseUrl(window.location.origin);
              }}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold whitespace-nowrap min-h-[40px]"
            >
              Usar URL Atual
            </button>
          )}
        </div>

        {/* Grid of 11 Table QR Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-safe">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrItems.map((item) => {
              const isCopied = copiedTable === item.tableNumber;
              return (
                <div
                  key={item.tableNumber}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 font-display font-black text-sm tracking-wider">
                      MESA {item.tableNumber}
                    </span>
                    <a
                      href={`/?mesa=${item.tableNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                      title={`Testar link da Mesa ${item.tableNumber}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="w-44 h-44 bg-white rounded-2xl p-2 flex items-center justify-center shadow-inner">
                    {item.dataUrl ? (
                      <img
                        src={item.dataUrl}
                        alt={`QR Code Mesa ${item.tableNumber}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-zinc-500 font-mono">Gerando...</div>
                    )}
                  </div>

                  <div className="w-full text-[11px] font-mono text-zinc-400 break-all bg-zinc-900/80 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    {item.url}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.tableNumber, item.url)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 transition-all ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!item.dataUrl}
                      onClick={() => {
                        playTouchSound(560);
                        printTableQrCards([item]);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 transition-all disabled:opacity-40"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
