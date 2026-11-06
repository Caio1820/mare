import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flame,
  Layers,
  Sparkles,
  Check,
  Plus,
  RotateCw,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { CustomBurger3DConfig, CartItem, Product } from '../types';
import { Burger3DViewer } from './Burger3DViewer';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface Burger3DBuilderProps {
  onBack: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const Burger3DBuilder: React.FC<Burger3DBuilderProps> = ({
  onBack,
  onAddToCart,
}) => {
  const [activeTab, setActiveTab] = useState<'pao' | 'carne' | 'queijo' | 'adicionais' | 'molho'>('pao');
  const [explodedValue, setExplodedValue] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isAddedFeedback, setIsAddedFeedback] = useState<boolean>(false);

  // Configuration state
  const [bunType, setBunType] = useState<'brioche' | 'australiano' | 'gergelim'>('brioche');
  const [pattiesCount, setPattiesCount] = useState<1 | 2 | 3>(1);
  const [meatDoneness, setMeatDoneness] = useState<'Ao ponto' | 'Bem passado' | 'Selado'>('Ao ponto');
  const [cheeseType, setCheeseType] = useState<'cheddar_cremoso' | 'queijo_prato' | 'queijo_regional'>('cheddar_cremoso');
  const [selectedAddons, setSelectedAddons] = useState<{
    bacon: boolean;
    cebola_caram: boolean;
    picles: boolean;
    salada_mare: boolean;
  }>({
    bacon: true,
    cebola_caram: false,
    picles: true,
    salada_mare: true,
  });
  const [sauce, setSauce] = useState<'molho_mare' | 'maionese_verde' | 'barbecue' | 'tartaro'>('molho_mare');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Price calculation
  const calculatedPrice = useMemo(() => {
    let base = 29.90; // Base 1x burger

    // Extra patties
    if (pattiesCount === 2) base += 9.90;
    if (pattiesCount === 3) base += 19.80;

    // Bun extras
    if (bunType === 'gergelim') base += 2.00;

    // Addons
    if (selectedAddons.bacon) base += 5.00;
    if (selectedAddons.cebola_caram) base += 3.50;
    if (selectedAddons.picles) base += 2.50;
    if (selectedAddons.salada_mare) base += 2.00;

    return Number(base.toFixed(2));
  }, [pattiesCount, bunType, selectedAddons]);

  const bunLabels = {
    brioche: 'Pão Brioche Selado na Manteiga',
    australiano: 'Pão Australiano com Mel e Cacau',
    gergelim: 'Pão Brioche com Gergelim Tostado (+ R$ 2,00)',
  };

  const cheeseLabels = {
    cheddar_cremoso: 'Cheddar Cremoso Inglês Derretido',
    queijo_prato: 'Queijo Prato Artesanal Macio',
    queijo_regional: 'Autêntico Queijo Regional do Amapá',
  };

  const sauceLabels = {
    molho_mare: 'Exclusivo Molho Maré',
    maionese_verde: 'Maionese Verde com Ervas Finas',
    barbecue: 'Barbecue Artesanal Defumado',
    tartaro: 'Cremoso Molho Tártaro da Casa',
  };

  const fullConfig: CustomBurger3DConfig = {
    bunType,
    bunLabel: bunLabels[bunType],
    pattiesCount,
    meatDoneness,
    cheeseType,
    cheeseLabel: cheeseLabels[cheeseType],
    selectedAddons,
    sauce,
    sauceLabel: sauceLabels[sauce],
    specialNotes,
    totalPrice: calculatedPrice,
  };

  const handleToggleAddon = (key: keyof typeof selectedAddons) => {
    playTouchSound(560);
    setSelectedAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmAddToCart = () => {
    playAddToCartSound();
    setIsAddedFeedback(true);

    const productRepresentation: Product = {
      id: `custom-3d-burger-${Date.now()}`,
      name: `Maré Personalizado 3D (${pattiesCount}x Carne)`,
      categoryId: 'artesanais',
      categoryLabel: 'Monte o Seu Maré 3D',
      price: calculatedPrice,
      description: `${pattiesCount}x Blends 160g (${meatDoneness}), ${bunLabels[bunType]}, ${cheeseLabels[cheeseType]}, ${sauceLabels[sauce]}${
        selectedAddons.bacon ? ' + Bacon' : ''
      }${selectedAddons.cebola_caram ? ' + Cebola Caramelizada' : ''}${
        selectedAddons.picles ? ' + Picles' : ''
      }${selectedAddons.salada_mare ? ' + Salada' : ''}`,
      image: '/images/classico_casa.jpg',
      isBurger: true,
      defaultIngredients: ['Pão artesanal', `${pattiesCount}x Blends 160g`, 'Queijo derretido'],
      suggestedAddons: [],
      badge: 'Personalizado 3D',
    };

    const cartItem: CartItem = {
      cartItemId: `item-3d-${Date.now()}`,
      product: productRepresentation,
      quantity: 1,
      burger3DConfig: fullConfig,
      unitPrice: calculatedPrice,
      totalPrice: calculatedPrice,
    };

    setTimeout(() => {
      onAddToCart(cartItem);
    }, 400);
  };

  return (
    <div className="relative min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 flex flex-col justify-between overflow-x-hidden pb-safe">
      {/* Top Header / Bar */}
      <div className="relative z-20 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            playTouchSound(480);
            onBack();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs sm:text-sm active:scale-95 transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Voltar ao Cardápio</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h1 className="font-display text-base sm:text-xl font-bold uppercase tracking-wider text-zinc-100">
              Monte o Seu Maré 3D
            </h1>
          </div>
          <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">
            Personalize cada camada em tempo real com rotação 360°
          </span>
        </div>

        {/* Live Price Tag */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Preço Atual</span>
          <span className="font-mono text-base sm:text-xl font-black text-amber-400 tabular-nums">
            R$ {calculatedPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Main 3D Viewport & Controls Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative min-h-[420px] items-stretch">
        {/* LEFT / CENTER: Interactive 3D Canvas (col-span-7) */}
        <div className="lg:col-span-7 relative flex flex-col items-center justify-center bg-radial from-zinc-900/60 to-zinc-950 min-h-[340px] sm:min-h-[460px] overflow-hidden p-2">
          {/* Three.js Canvas */}
          <div className="w-full h-full absolute inset-0">
            <Burger3DViewer
              config={fullConfig}
              explodedValue={explodedValue}
              isRotating={isRotating}
            />
          </div>

          {/* Quick 3D Floating HUD Tools */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            {/* Auto-rotation toggle */}
            <button
              onClick={() => {
                playTouchSound(500);
                setIsRotating(!isRotating);
              }}
              className={`pointer-events-auto px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg ${
                isRotating
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-700'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Giro Automático:</span>
              <span>{isRotating ? 'Ligado' : 'Pausado'}</span>
            </button>

            {/* Exploded View Slider Button */}
            <div className="pointer-events-auto bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-300 hidden xs:inline">
                Vista Explodida:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedValue}
                onChange={(e) => setExplodedValue(parseFloat(e.target.value))}
                className="w-20 sm:w-28 accent-amber-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <span className="text-[10px] font-mono font-bold text-amber-400 w-7 text-right">
                {Math.round(explodedValue * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Customization Stepper Drawer (col-span-5) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-140px)]">
          {/* Step Category Pills */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 mb-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'pao', label: '1. Pão' },
              { id: 'carne', label: '2. Carne' },
              { id: 'queijo', label: '3. Queijo' },
              { id: 'adicionais', label: '4. Extras' },
              { id: 'molho', label: '5. Molho' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playTouchSound(520);
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <div className="space-y-4 flex-1">
            {/* 1. TIPO DE PÃO */}
            {activeTab === 'pao' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                  Escolha o Pão Artesanal:
                </span>
                {[
                  { id: 'brioche', name: 'Pão Brioche Selado', desc: 'Manteiga de garrafa, macio e dourado', price: '+ R$ 0,00' },
                  { id: 'australiano', name: 'Pão Australiano', desc: 'Massa escura com leve toque de cacau e mel', price: '+ R$ 0,00' },
                  { id: 'gergelim', name: 'Pão Brioche com Gergelim', desc: 'Crostinha de sementes tostadas', price: '+ R$ 2,00' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      playTouchSound(550);
                      setBunType(b.id as any);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all min-h-[50px] ${
                      bunType === b.id
                        ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-display text-sm font-bold">{b.name}</div>
                      <div className="text-[11px] text-zinc-400">{b.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400">{b.price}</span>
                      {bunType === b.id && <Check className="w-4 h-4 text-amber-500 ml-auto mt-0.5" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. QUANTIDADE E PONTO DA CARNE */}
            {activeTab === 'carne' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block mb-2">
                    Quantidade de Blends (160g cada):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: 1, label: '1x Blend', sub: '160g', price: 'R$ 29,90' },
                      { count: 2, label: '2x Blends', sub: '320g', price: '+ R$ 9,90' },
                      { count: 3, label: '3x Blends', sub: '480g', price: '+ R$ 19,80' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        onClick={() => {
                          playTouchSound(560);
                          setPattiesCount(item.count as any);
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all min-h-[56px] ${
                          pattiesCount === item.count
                            ? 'bg-amber-500/15 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="font-display text-sm font-bold">{item.label}</div>
                        <div className="text-[10px] text-zinc-500">{item.sub}</div>
                        <div className="text-[11px] font-mono font-bold text-amber-400 mt-1">
                          {item.price}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block mb-2">
                    Ponto da Carne:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Ao ponto', 'Bem passado', 'Selado'] as const).map((doneness) => (
                      <button
                        key={doneness}
                        onClick={() => {
                          playTouchSound(520);
                          setMeatDoneness(doneness);
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          meatDoneness === doneness
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {doneness}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TIPO DE QUEIJO */}
            {activeTab === 'queijo' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                  Escolha o Queijo:
                </span>
                {[
                  { id: 'cheddar_cremoso', name: 'Cheddar Cremoso Inglês', desc: 'Cremoso, sabor marcante e cor viva' },
                  { id: 'queijo_prato', name: 'Queijo Prato Derretido', desc: 'Clássico artesanal, derretimento perfeito' },
                  { id: 'queijo_regional', name: 'Queijo Regional do Amapá', desc: 'Autêntico da região, textura e aroma únicos' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      playTouchSound(550);
                      setCheeseType(q.id as any);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all min-h-[50px] ${
                      cheeseType === q.id
                        ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-display text-sm font-bold">{q.name}</div>
                      <div className="text-[11px] text-zinc-400">{q.desc}</div>
                    </div>
                    {cheeseType === q.id && <Check className="w-5 h-5 text-amber-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* 4. ADICIONAIS DE PESO */}
            {activeTab === 'adicionais' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                  Adicionais de Peso:
                </span>
                {[
                  { key: 'bacon', name: 'Bacon Dourado Crocante', price: '+ R$ 5,00', desc: '3x fatias artesanais' },
                  { key: 'cebola_caram', name: 'Cebola Caramelizada', price: '+ R$ 3,50', desc: 'No açúcar mascavo e manteiga' },
                  { key: 'picles', name: 'Picles Artesanal Crocante', price: '+ R$ 2,50', desc: 'Fatias curadas na casa' },
                  { key: 'salada_mare', name: 'Salada Maré (Alface + Tomate)', price: '+ R$ 2,00', desc: 'Folhas frescas e tomates maduros' },
                ].map((add) => {
                  const isChecked = selectedAddons[add.key as keyof typeof selectedAddons];
                  return (
                    <button
                      key={add.key}
                      onClick={() => handleToggleAddon(add.key as any)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all min-h-[50px] ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/40'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div>
                        <div className="font-display text-sm font-bold">{add.name}</div>
                        <div className="text-[11px] text-zinc-500">{add.desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{add.price}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked ? 'bg-amber-500 border-amber-400 text-zinc-950' : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. MOLHO ESPECIAL DA CASA */}
            {activeTab === 'molho' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                  Escolha o Molho da Casa:
                </span>
                {[
                  { id: 'molho_mare', name: 'Exclusivo Molho Maré', desc: 'Assinatura secreta, cremoso e defumado' },
                  { id: 'maionese_verde', name: 'Maionese Verde Especial', desc: 'Com ervas frescas selecionadas' },
                  { id: 'barbecue', name: 'Barbecue de Rapadura', desc: 'Toque agridoce defumado' },
                  { id: 'tartaro', name: 'Molho Tártaro Artesanal', desc: 'Toque cítrico delicado' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      playTouchSound(550);
                      setSauce(s.id as any);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all min-h-[50px] ${
                      sauce === s.id
                        ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-display text-sm font-bold">{s.name}</div>
                      <div className="text-[11px] text-zinc-400">{s.desc}</div>
                    </div>
                    {sauce === s.id && <Check className="w-5 h-5 text-amber-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Action Footer with Real-time Total */}
          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Composição:</span>
              <span className="font-semibold text-zinc-200 truncate max-w-[240px]">
                {bunLabels[bunType].split(' ')[1]}, {pattiesCount}x Carne, {cheeseLabels[cheeseType].split(' ')[0]}
              </span>
            </div>

            <button
              onClick={handleConfirmAddToCart}
              disabled={isAddedFeedback}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[52px]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>
                {isAddedFeedback ? 'Adicionado ao Pedido! ✨' : `Adicionar por R$ ${calculatedPrice.toFixed(2).replace('.', ',')}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
