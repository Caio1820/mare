import React, { useState, useEffect } from 'react';
import { Download, Monitor, WifiOff, CheckCircle2, X, HardDrive, Smartphone, Check } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { playTouchSound } from '../utils/sound';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');

  // Set default tab based on user agent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
      setActiveTab(isMobileDevice ? 'mobile' : 'desktop');
    }
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!showGuideModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGuideModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuideModal]);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playTouchSound(550);
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Offline status indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold animate-pulse">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Modo Offline</span>
          </div>
        )}

        {/* If already running in standalone desktop mode */}
        {isInstalled ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-emerald-400"
            title="Aplicativo instalado e executando nativamente no sistema"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">App Instalado</span>
          </div>
        ) : (
          /* Install Button for PC / Desktop / Mobile */
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/40 text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow-sm min-h-[34px] sm:min-h-[38px] cursor-pointer"
            title="Instalar sistema no PC ou celular para usar sem internet (Atalho na Área de Trabalho)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Instalar no PC</span>
            <span className="sm:hidden">Instalar</span>
          </button>
        )}
      </div>

      {/* Manual Installation Guide Modal (Never clipped, fully scrollable, click-outside-to-close) */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 flex items-center justify-center"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase text-zinc-100">
                    Instalar Aplicativo Maré
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Funciona como um programa dedicado e 100% sem internet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Offline guarantee banner */}
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs">
              <HardDrive className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="leading-relaxed">
                <strong className="block text-xs uppercase tracking-wider mb-0.5">
                  Uso 100% Offline Garantido:
                </strong>
                <span>
                  O cardápio, fotos e controle de pedidos ficam salvos no seu computador ou celular, garantindo que o sistema continue funcionando mesmo se a internet cair.
                </span>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  playTouchSound(520);
                  setActiveTab('desktop');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Computador (PC / Windows)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTouchSound(520);
                  setActiveTab('mobile');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'mobile'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Celular (Android / iOS)</span>
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="py-3 text-xs sm:text-sm text-zinc-300">
              {activeTab === 'desktop' ? (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="font-bold text-zinc-100 flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>No Google Chrome, Microsoft Edge ou Opera:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>
                      Clique no ícone de <strong>Instalar</strong> <Download className="w-3.5 h-3.5 inline text-amber-400" /> no canto direito da barra de endereço do navegador.
                    </li>
                    <li>
                      Ou clique nos 3 pontinhos <span className="font-mono text-zinc-200">(⋮)</span> no topo direito &rarr; <strong>Salvar e Compartilhar</strong> &rarr; <strong>Instalar Maré PDV</strong>.
                    </li>
                    <li>
                      O Windows criará um ícone na sua <strong>Área de Trabalho</strong> e o Maré abrirá em janela própria de tela cheia, como um programa nativo.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <div className="font-bold text-zinc-100 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>No Celular Android (Chrome):</span>
                    </div>
                    <ol className="list-decimal pl-5 space-y-1 text-zinc-400 text-xs">
                      <li>Toque nos 3 pontinhos <span className="font-mono text-zinc-200">(⋮)</span> no topo direito.</li>
                      <li>Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <div className="font-bold text-zinc-100 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>No iPhone / iPad (Safari):</span>
                    </div>
                    <ol className="list-decimal pl-5 space-y-1 text-zinc-400 text-xs">
                      <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</li>
                      <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
