# Ajustes no Fluxo de Pedido, Pagamento no Balcão e Impressão de Comanda KDS

Plano arquitetural e de experiência do usuário para permitir alternar entre "Comer no Local" e "Para Viagem" a qualquer momento, simplificar a finalização com pagamento exclusivamente no balcão (sem opções de pagamento online/máquina no totem), e adicionar impressão de comanda térmica de 80mm no painel da cozinha.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> **Decisões alinhadas na Etapa 1:**
> 1. **Alternância Local / Viagem**: Presente tanto no topo do cardápio quanto dentro da sacola/gaveta do pedido, permitindo alternar ou alterar o número da mesa sem perder os itens selecionados.
> 2. **Pagamento Exclusivo no Balcão**: Ao clicar em "Avançar" no carrinho, o totem pula telas intermediárias de pagamento (Pix / Cartão) e cria o pedido imediatamente como `pagamento_pendente` / `cartao_balcao`, exibindo a tela de confirmação com a senha e instruindo o cliente a pagar diretamente no caixa.
> 3. **Impressão na Cozinha KDS**: Cada card de pedido no KDS contará com botão "Imprimir Comanda" que aciona a impressão de cupom térmico padronizado (80mm) formatado especificamente para impressoras de cozinha (com corte, itens destacados, observações e sem custos financeiros desnecessários).

---

## 1. Visão Geral e Experiência do Usuário

### A. Alternância de Modalidade ("Comer no Local" vs. "Para Viagem")
- **No Topo do Cardápio (`Step3Catalog`)**: Um seletor visual e intuitivo no cabeçalho do cardápio exibe o modo atual (ex.: `🍽️ Comer no Local · Mesa 03` ou `🥡 Para Viagem`) com botão de alteração rápida ("Alterar").
- **Dentro da Sacola (`CartDrawer`)**: Banner superior na gaveta do carrinho permitindo trocar com um toque entre "Comer no Local" (com teclado numérico rápido de mesa) e "Para Viagem", mantendo intactos todos os hambúrgueres e acompanhamentos já adicionados.
- **Botão Voltar**: A opção de retornar à tela de escolha de modalidade (`Step2OrderType`) caso o cliente deseje redefinir tudo do zero.

### B. Fluxo Direto de Pagamento no Balcão
- Removidas as opções de pagamento integrado no totem (Pix com QR Code dinâmico e simulação de leitor de cartão).
- Ao clicar em **"Finalizar Pedido"** na sacola ou no rodapé do catálogo:
  1. O sistema valida os itens e registra o pedido diretamente na API/banco da cozinha (`server.ts` e `kdsStore.ts`) com status `status: 'recebido'`, `paymentMethod: 'balcao'` e `paymentStatus: 'pendente'`.
  2. Toca o sino sonoro da cozinha e notifica o painel de TV em tempo real.
  3. Redireciona imediatamente para a tela de confirmação (`Step6Confirmation`), exibindo a senha em destaque (ex.: `#042`), o número da mesa (se local) e a instrução clara: **"Dirija-se ao caixa para efetuar o pagamento e retirar sua senha"**.

### C. Impressão de Comanda na Cozinha (`KdsView`)
- Cada card de pedido nas colunas da cozinha (Recebido, Preparo, Pronto) recebe um botão de ação rápida com ícone de impressora: **"Imprimir Comanda"**.
- Ao clicar, uma folha de estilo de impressão `@media print` gera um cupom térmico limpo de 80mm com:
  - Cabeçalho: **MARÉ HAMBÚRGUERIA · COZINHA**
  - Senha do pedido em tamanho gigante (ex.: `#042`)
  - Tipo: `CONSUMO NO LOCAL (MESA 04)` ou `PARA VIAGEM`
  - Horário e tempo decorrido
  - Lista de itens em fonte grande e legível para o chapeiro, com **ingredientes removidos** e **adicionais** destacados em negrito
  - Observações especiais do cliente em destaque com moldura pontilhada
  - Sem informações financeiras confidenciais desnecessárias para a chapa

---

## 2. Design Visual & Estilo

- **Seletor de Modalidade**: Design elegante com fundo escuro `bg-zinc-900/90`, borda dourada suave `border-amber-500/30` e tipografia nítida sem poluição de pílulas estáticas.
- **Card da Cozinha KDS**: Botão de impressão com ícone `Printer`, texto legível e toque confortável para uso com luvas ou mãos ocupadas na cozinha.
- **Layout de Impressão Térmica**: Formatado com largura máxima de 80mm (ou 58mm), tipografia monoespaçada condensada de alto contraste (preto puro no papel térmico), linhas divisórias pontilhadas e quebra de página automática.

---

## 3. Arquitetura de Componentes e Fluxo de Dados

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  State: orderType ('local'|'viagem'), tableNumber,    │
│         cartItems, activeScreen, currentStep           │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│   Step3Catalog.tsx    │        │    CartDrawer.tsx     │
│ - Seletor de modo     │        │ - Seletor de modo     │
│   (Local / Viagem)    │        │ - Botão "Finalizar"   │
│ - "Alterar Modalidade"│        │   direto para Balcão  │
└───────────┬───────────┘        └───────────┬───────────┘
            │                                │
            └────────────────┬───────────────┘
                             ▼
                 ┌───────────────────────┐
                 │    kdsStore / API     │
                 │ createOrder(order)    │
                 │ paymentMethod: balcao │
                 └───────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ Step6Confirmation.tsx │         │      KdsView.tsx      │
│ - Senha em destaque   │         │ - Card do pedido      │
│ - Instrução: Pague no │         │ - Botão "Imprimir"    │
│   Balcão              │         │ - Thermal Ticket 80mm │
└───────────────────────┘         └───────────────────────┘
```

---

## 4. Plano de Implementação Passo a Passo

1. **Atualizar `src/types.ts`**:
   - Garantir suporte ao método de pagamento exclusivo `'balcao'` / `'cartao_balcao'` e tipagem de impressão.
2. **Atualizar `src/components/Step3Catalog.tsx`**:
   - Adicionar barra/badge interativo de modalidade no topo (`🍽️ No Local · Mesa X` ou `🥡 Para Viagem`) com botão de clique para trocar ou voltar.
   - Conectar o botão "Avançar" diretamente para a criação do pedido no balcão e confirmação.
3. **Atualizar `src/components/CartDrawer.tsx`**:
   - Adicionar seletor de modalidade no cabeçalho do carrinho (Comer no Local com seletor de mesa vs. Para Viagem).
   - Atualizar botão principal de ação para "Finalizar Pedido no Balcão".
4. **Simplificar `App.tsx`**:
   - Criar fluxo direto: carrinho -> `handleCreateOrderWithCounterPayment()` -> `setLastConfirmedOrder()` -> `Step6Confirmation`.
   - Manter `Step5Payment.tsx` arquivado/removido do fluxo principal, sem exibir Pix ou cartão online.
5. **Implementar Impressão Térmica em `src/components/KdsView.tsx`**:
   - Adicionar botão com ícone de impressora nos cards de pedido.
   - Criar componente de impressão térmica de comanda (`KitchenTicketPrint`) com estilos `@media print` otimizados para papel de 80mm.
6. **Verificação & Testes**:
   - Testar alternância entre Local e Viagem sem perder itens do carrinho.
   - Testar finalização direta e visualização da comanda no balcão.
   - Testar o acionamento da impressão na Cozinha KDS.
   - Executar `compile_applet` e `lint_applet`.
