import React, { useState } from 'react';
import {
  BookOpen,
  X,
  ChefHat,
  Tv,
  Touchpad,
  Printer,
  Bell,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  Volume2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Flame,
  Check,
  Hash,
  Store,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react';
import { playTouchSound } from '../utils/sound';

interface StaffGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'geral' | 'totem' | 'cozinha' | 'painel' | 'duvidas';
}

export const StaffGuideModal: React.FC<StaffGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'geral',
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'totem' | 'cozinha' | 'painel' | 'duvidas'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border-b border-zinc-800 p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-2xl font-black uppercase tracking-wider text-zinc-100">
                  Manual de Operação da Equipe
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">
                  Maré 2026
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Guia visual prático para novos atendentes, operadores de caixa e chapeiros
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="Fechar Manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-3 sm:px-6 pt-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              playTouchSound(500);
              setActiveTab('geral');
            }}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'geral'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              setActiveTab('totem');
            }}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'totem'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Touchpad className="w-4 h-4" />
            <span>1. Totem & QR Code</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              setActiveTab('cozinha');
            }}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cozinha'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>2. Cozinha (KDS)</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              setActiveTab('painel');
            }}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'painel'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>3. Painel TV & Chamadas</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              setActiveTab('duvidas');
            }}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'duvidas'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dúvidas Frequentes</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 text-zinc-300 text-sm leading-relaxed">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="font-display text-base sm:text-lg font-bold text-amber-400 uppercase flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  Como funciona o ecossistema Maré Hambúrgueria
                </h3>
                <p className="text-zinc-300 text-xs sm:text-sm">
                  O sistema é composto por <strong>3 telas integradas em tempo real</strong> via nuvem e rede local. Quando um cliente ou atendente faz um pedido, ele aparece instantaneamente na cozinha e é transmitido para a TV do salão.
                </p>
              </div>

              {/* 3 Interactive Mock Visual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Visual 1: Totem */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-850 overflow-hidden mb-3 p-2 flex flex-col justify-between shadow-inner">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                        <span className="text-amber-400 font-bold">MARÉ TOTEM</span>
                        <span>MESA 04</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/classico_casa.jpg"
                          alt="Hambúrguer Clássico"
                          className="w-12 h-10 object-cover rounded-lg border border-amber-500/40"
                        />
                        <div className="text-[10px]">
                          <strong className="text-zinc-100 block">Clássico da Casa</strong>
                          <span className="text-amber-400 font-bold">R$ 29,90</span>
                        </div>
                      </div>
                      <div className="h-4 bg-amber-500 text-zinc-950 text-[9px] font-black rounded flex items-center justify-center uppercase">
                        Avançar para Balcão
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Totem / Celular</h4>
                    </div>
                    <p className="text-xs text-zinc-400">
                      O cliente escolhe <strong>Comer no Local</strong> (Mesa 01 a 11 ou Balcão) ou <strong>Para Viagem</strong>, personaliza hambúrgueres artesanais e finaliza o pedido.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded w-fit border border-amber-500/20">
                    Acesso: / ou #/
                  </span>
                </div>

                {/* Visual 2: Cozinha KDS */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-850 overflow-hidden mb-3 p-2 flex flex-col justify-between shadow-inner">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-orange-400 font-bold">KDS CHAPA</span>
                        <span className="bg-amber-500 text-zinc-950 px-1 rounded font-bold">#004</span>
                      </div>
                      <div className="text-[9px] bg-zinc-950 p-1.5 rounded border border-zinc-800 space-y-0.5">
                        <div className="font-bold text-zinc-100">1x Clássico (Ao ponto)</div>
                        <div className="text-amber-400 text-[8px]">• + Bacon Crocante</div>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-4 bg-zinc-800 text-amber-400 text-[8px] font-bold rounded flex items-center justify-center">
                          🖨️ 80mm
                        </div>
                        <div className="flex-1 h-4 bg-orange-500 text-zinc-950 text-[8px] font-bold rounded flex items-center justify-center">
                          🔥 Chapa
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Cozinha (KDS)</h4>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Tablet/computador da chapa. Recebe o pedido com som de sino, exibe itens e adicionais, imprime comanda térmica de 80mm e avança etapas.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded w-fit border border-orange-500/20">
                    Acesso: /cozinha (Senha: MARE123)
                  </span>
                </div>

                {/* Visual 3: Painel TV */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-850 overflow-hidden mb-3 p-2 flex flex-col justify-between shadow-inner">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                        <span className="text-emerald-400 font-bold">PAINEL TV</span>
                        <span className="text-emerald-400">● AO VIVO</span>
                      </div>
                      <div className="text-center py-1">
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">SENHA PRONTA</span>
                        <span className="text-lg font-black text-emerald-400 font-display">#004</span>
                      </div>
                      <div className="h-4 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded flex items-center justify-center border border-emerald-500/30">
                        🔊 Voz + Sino Ativo
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Painel TV</h4>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Fica na TV do salão em tela cheia (F11). Anuncia o número da senha por voz eletrônica e aviso visual assim que a cozinha marca como Pronto.
                    </p>
                  </div>
                  <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                    Acesso: /painel
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <strong className="text-zinc-100 block">Fila Limpa sem Pedidos Fictícios:</strong>
                  <span>O sistema foi configurado para inicializar <strong>100% limpo</strong>. Todos os pedidos que aparecem nas colunas da cozinha são pedidos reais enviados pelos clientes ou lançados no balcão.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOTEM & QR CODE */}
          {activeTab === 'totem' && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-bold text-zinc-100 uppercase">
                Orientando o Cliente no Autoatendimento
              </h3>

              {/* Visual Card com Imagens do Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Imagem/Card 1: Escolha do Local */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Onde você vai saborear?</h4>
                  </div>
                  
                  {/* Mock Visual do Seletor */}
                  <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/50 text-center space-y-1">
                      <UtensilsCrossed className="w-5 h-5 mx-auto text-amber-400" />
                      <span className="text-[11px] font-bold text-zinc-100 block">Comer no Local</span>
                      <span className="text-[9px] text-amber-400 font-mono block">Mesa 01 a 11 ou Balcão</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-800 text-center space-y-1">
                      <ShoppingBag className="w-5 h-5 mx-auto text-zinc-400" />
                      <span className="text-[11px] font-bold text-zinc-300 block">Para Levar</span>
                      <span className="text-[9px] text-zinc-500 font-mono block">Embalagem Selada</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Ao tocar em <strong>Comer no Local</strong>, abre a grade de mesas para selecionar de 01 a 11 ou a opção <strong>"Atendimento Direto no Balcão"</strong>.
                  </p>
                </div>

                {/* Imagem/Card 2: Personalização e Montagem */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center">2</span>
                    <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Personalização & Toque da Maré</h4>
                  </div>

                  {/* Mock Visual com Foto do Produto */}
                  <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <img
                      src="/images/bacon_caramelizado.jpg"
                      alt="Bacon Caramelizado"
                      className="w-14 h-14 object-cover rounded-lg border border-amber-500/30"
                    />
                    <div className="text-xs space-y-0.5">
                      <strong className="text-zinc-100 block">Bacon Caramelizado</strong>
                      <span className="text-zinc-400 text-[10px] block">• Ponto: Ao ponto</span>
                      <span className="text-amber-400 font-bold text-[10px] block">+ Bacon Extra (+R$ 7,00)</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O cliente escolhe o ponto da carne, retira ingredientes indesejados e adiciona itens do <strong>"Toque da Maré"</strong> (Queijo regional, bacon crocante, etc.).
                  </p>
                </div>

                {/* Imagem/Card 3: Finalização no Balcão */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">Finalização & Senha</h4>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-amber-500/40 text-center space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest block">SUA SENHA</span>
                    <span className="font-display text-2xl font-black text-amber-400">#042</span>
                    <span className="text-[10px] text-zinc-300 block">Pague no Caixa · Balcão</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O cliente não precisa passar cartão no totem. Ele recebe a senha gerada na tela e vai direto ao caixa pagar via Pix, Cartão ou Dinheiro.
                  </p>
                </div>

                {/* Imagem/Card 4: QR Code nas Mesas */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center">4</span>
                    <h4 className="font-display font-bold text-zinc-100 uppercase text-sm">QR Code da Mesa</h4>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                      <Hash className="w-8 h-8 text-black" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <strong className="text-zinc-100 block">QR Code Mesa 05</strong>
                      <span className="text-amber-400 text-[11px] font-mono">cardapio.com/?mesa=05</span>
                      <span className="text-zinc-400 text-[10px] block">Mesa vinculada na hora</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Quando o cliente escaneia o adesivo da mesa, o celular dele já sabe exatamente qual é a mesa sem ele precisar digitar nada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COZINHA KDS */}
          {activeTab === 'cozinha' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-zinc-100 uppercase">
                  Operando a Cozinha (Painel KDS)
                </h3>
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold">
                  Senha: MARE123
                </span>
              </div>

              {/* 3 Colunas Ilustradas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Coluna 1: Recebido */}
                <div className="p-4 rounded-2xl bg-zinc-950 border-l-4 border-l-amber-500 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      1. Recebido
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                      Ding-Dong 🔔
                    </span>
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-100">#005 · MESA 02</span>
                      <span className="text-amber-400">R$ 58,90</span>
                    </div>
                    <div className="text-[11px] text-zinc-300">1x Maré de Sol (Petisco)</div>
                    <div className="text-[10px] text-zinc-400">• Obs: Sem cebola</div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O pedido acabou de chegar. O chapeiro clica em <strong>"Iniciar Preparo"</strong> para enviar à chapa.
                  </p>
                </div>

                {/* Coluna 2: Em Preparo */}
                <div className="p-4 rounded-2xl bg-zinc-950 border-l-4 border-l-orange-500 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      2. Em Preparo
                    </span>
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-100">#005 · MESA 02</span>
                      <span className="text-orange-400">08 min</span>
                    </div>
                    <div className="text-[11px] text-zinc-300">1x Maré de Sol</div>
                    <div className="text-[10px] text-orange-400">Na Chapa / Fritadeira</div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Hambúrguer na chapa. Quando estiver montado na bandeja ou embalagem, clica em <strong>"Marcar Pronto"</strong>.
                  </p>
                </div>

                {/* Coluna 3: Pronto */}
                <div className="p-4 rounded-2xl bg-zinc-950 border-l-4 border-l-emerald-500 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      3. Pronto
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-100">#005 · MESA 02</span>
                      <span className="text-emerald-400 font-bold">CHAMANDO TV</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Aguardando retirada</div>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Chama automaticamente na TV com voz. Quando o cliente retirar, clica em <strong>"Entregue"</strong> para finalizar.
                  </p>
                </div>
              </div>

              {/* Impressão Térmica Ilustrada */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                    <Printer className="w-5 h-5 text-amber-400" />
                    <span>Impressão de Comandas Térmicas (Bobina 80mm)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Epson / Elgin / Bematech
                  </span>
                </div>

                {/* Exemplo visual de bobina */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white text-zinc-950 font-mono text-[10px] rounded-xl border-2 border-dashed border-zinc-400 shadow-sm leading-tight space-y-1">
                    <div className="text-center font-bold border-b border-black pb-1">
                      <span className="bg-black text-white px-1.5 py-0.5 text-[8px] uppercase">VIA COZINHA</span>
                      <div className="text-sm font-black mt-0.5">#005 · MESA 02</div>
                    </div>
                    <div>1x MARÉ DE SOL</div>
                    <div className="text-[9px] text-zinc-700">• Batatas fritas + Farofa + Molhos</div>
                    <div className="text-[9px] font-bold text-red-700">• SEM: Cebola</div>
                  </div>

                  <div className="p-3 bg-white text-zinc-950 font-mono text-[10px] rounded-xl border-2 border-dashed border-zinc-400 shadow-sm leading-tight space-y-1">
                    <div className="text-center font-bold border-b border-black pb-1">
                      <span className="bg-zinc-800 text-white px-1.5 py-0.5 text-[8px] uppercase">VIA BALCÃO / CAIXA</span>
                      <div className="text-sm font-black mt-0.5">#005 · MESA 02</div>
                    </div>
                    <div>CLIENTE: CARLOS SILVA</div>
                    <div>PAGAMENTO: PENDENTE NO CAIXA</div>
                    <div className="border-t border-black pt-1 font-bold flex justify-between text-xs">
                      <span>TOTAL:</span>
                      <span>R$ 58,90</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                    Opção 1: Só Cozinha
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                    Opção 2: Só Balcão
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold">
                    Opção 3: Imprimir Ambas (Destacável ✂)
                  </span>
                </div>
              </div>

              {/* Botão de Limpeza de Fila */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <strong className="text-zinc-100 block">Botão "Limpar Fila" no Fechamento:</strong>
                  <span className="text-zinc-400">
                    Ao final do expediente ou troca de turno, clique no botão <strong>"Limpar Fila"</strong> no topo da cozinha para arquivar todos os pedidos antigos já entregues, mantendo o sistema leve e organizado.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAINEL TV */}
          {activeTab === 'painel' && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-bold text-zinc-100 uppercase">
                Operando a TV do Salão
              </h3>

              {/* Mockup da Tela de TV */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="aspect-[21/9] sm:aspect-[16/7] w-full bg-zinc-900 rounded-xl border border-zinc-800 p-3 sm:p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 p-0.5">
                        <img src="/images/mare_round_logo_trans.png" alt="Maré" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <span className="font-display font-bold text-zinc-100 text-xs sm:text-sm tracking-wider uppercase">
                        Maré Hambúrgueria · Painel de Chamada
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Ao Vivo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-auto py-2">
                    <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-3 text-center">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest block">
                        ÚLTIMA CHAMADA
                      </span>
                      <span className="font-display text-3xl sm:text-5xl font-black text-emerald-300 block">
                        #042
                      </span>
                      <span className="text-[10px] text-zinc-300 font-semibold uppercase">Mesa 03 · Salão</span>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col justify-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                        Retirar no Balcão:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 font-display font-bold text-xs rounded">#040</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 font-display font-bold text-xs rounded">#041</span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-zinc-950 font-display font-black text-xs rounded">#042</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-500 flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span>Aviso sonoro ativado</span>
                    <span>Pressione F11 para Tela Cheia</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <span>1. Ativar Áudio da TV (Muito Importante)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Smart TVs e computadores silenciam o som automático por segurança. Ao abrir <code className="text-amber-400">/painel</code>, clique no botão <strong>"Ativar Áudio da TV"</strong> no topo da tela para liberar o sino e a voz.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm">
                    <Tv className="w-5 h-5 text-amber-400" />
                    <span>2. Modo Tela Cheia (F11)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Pressione a tecla <strong>F11</strong> no teclado para que a TV ocupe 100% da tela sem exibir abas do navegador ou barras de tarefas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DÚVIDAS FREQUENTES */}
          {activeTab === 'duvidas' && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-zinc-100 uppercase">
                Perguntas Rápidas da Equipe
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-400 text-xs uppercase block">
                    Q: O que fazer se um pedido feito no celular não aparecer imediatamente?
                  </span>
                  <p className="text-xs text-zinc-400">
                    O sistema utiliza 3 canais sincronizados (Nuvem Firestore + Backend Node.js + Canal Local). A sincronização ocorre a cada 1,5 segundo. Aguarde 2 segundos ou toque no botão de atualizar no topo da tela.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-400 text-xs uppercase block">
                    Q: O cliente trocou de mesa depois de fazer o pedido?
                  </span>
                  <p className="text-xs text-zinc-400">
                    Como o cliente sempre recebe o <strong>número da senha (#00X)</strong>, a equipe pode chamá-lo diretamente pelo painel de TV ou anotar a nova mesa na comanda impressa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-400 text-xs uppercase block">
                    Q: Como acessar a cozinha pelo tablet ou celular da equipe?
                  </span>
                  <p className="text-xs text-zinc-400">
                    Abra o link do sistema no navegador do dispositivo e adicione <code className="text-amber-400 font-mono">#/cozinha</code> no final. Digite a senha <strong>MARE123</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-400 text-xs uppercase block">
                    Q: Onde vejo os adicionais pedidos pelo cliente?
                  </span>
                  <p className="text-xs text-zinc-400">
                    Todos os adicionais do <strong>Toque da Maré</strong> (Bacon crocante, queijo regional, calabresa, etc.) aparecem destacados em negrito com uma bolinha (<code className="text-amber-400 font-bold">•</code>) logo abaixo do nome do hambúrguer no card da cozinha e na comanda impressa.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-zinc-800 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500 font-medium hidden sm:block">
            Maré Hambúrgueria · Manual Visual da Equipe 2026
          </div>
          <button
            onClick={() => {
              playTouchSound(480);
              onClose();
            }}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            Entendido, fechar manual
          </button>
        </div>

      </div>
    </div>
  );
};
