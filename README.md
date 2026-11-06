# 🌊 Maré Hambúrgueria — Sistema Integrado de Autoatendimento, Cozinha (KDS) & Painel TV

> **Ecossistema completo de vendas, autoatendimento 3D, KDS de cozinha, painel de chamada de senhas para TV e impressão automática de comanda térmica.**  
> Desenvolvido para a **Maré Hambúrgueria** (Macapá / AP).

---

## 🧭 Visão Geral do Ecossistema

O sistema é dividido em 4 interfaces especializadas compartilhando estado em tempo real:

| Rota Path | Rota Hash | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `/` | `#/` | **Totem de Autoatendimento**: Cardápio em 5 etapas, personalização de adicionais, carrinho e pagamento Pix/Balcão. | Livre (Cliente) |
| `/montador-3d` | `#/montador-3d` | **Montador 3D Interativo**: Customizador camada por camada em 3D Three.js com rotação 360° e vista explodida. | Livre (Cliente) |
| `/cozinha` ou `/painel-kds` | `#/cozinha` | **Kitchen Display System (KDS)**: Kanban de pedidos (Recebido → Em preparo → Pronto → Entregue), aviso sonoro e rechamada com WhatsApp. | **Protegido** (Senha: `MARE123`) |
| `/painel` | `#/painel` | **Painel de Chamada TV**: Interface full-screen para TV do salão com destaque animado, aviso sonoro (*Ding-dong*) e Web Speech API. | Livre (Público / TV) |

---

## ⚙️ 1. Governança e Fluxo de Desenvolvimento no GitHub

Para manter a estabilidade do ecossistema e padrão de Tech Lead:

### 1.1. Gestão de Tarefas (Issues First)
- **Toda e qualquer tarefa** (Correção, Melhoria ou Nova Feature) DEVE ter uma **Issue** correspondente criada previamente no GitHub.
- Exemplo de títulos de Issue:
  - `feat(3d): adicionar suporte a texturas PBR nos pães australianos`
  - `fix(kds): corrigir atraso de 2s na chamada por voz no Safari`
  - `perf(mobile): limitar pixel ratio a 2 em telas retina`

### 1.2. Deploys Exclusivos via Pull Requests (PRs)
- O branch `main` é estritamente **protegido**.
- Nenhum push direto é permitido em `main`.
- O merge de código para produção DEVE ocorrer exclusivamente por Pull Request aprovado e com checks de CI passando.

### 1.3. Rastreabilidade Obrigatória
- É obrigatório referenciar o número da Issue correspondente no corpo ou título do PR:
  - `Closes #18`
  - `Fixes #9`
  - `Resolves #42`

### 1.4. Padronização de Commits (Conventional Commits)
- O projeto segue a convenção do Commitlint:
  - `feat:` Nova funcionalidade
  - `fix:` Correção de bug
  - `perf:` Melhoria de performance
  - `refactor:` Refatoração de código sem alteração de regra
  - `docs:` Atualizações em documentações
  - `test:` Inclusão de testes unitários ou E2E (Playwright)

---

## 🍔 2. Montador de Hambúrguer 3D Interativo ("Monte o Seu Maré 3D")

### 2.1. Arquitetura Three.js Procedural
- **Zero Dependências Externas Quebradas**: Todos os modelos 3D (pão brioche, pão australiano, sementes de gergelim, blends bovinos artesanais 160g, queijo cheddar cremoso derretido, tiras de bacon crocante, anéis de cebola caramelizada, picles artesanal, alface frisée e tomates frescos) são gerados proceduralmente via geometrias e materiais PBR Three.js (`MeshStandardMaterial`).
- **Iluminação de Estúdio Tripla (3-Point Lighting Rig)**:
  - *Key Light* direcional (2.4x) com sombras suaves PCF
  - *Fill Light* suave em tom azulado para contraste das dobras
  - *Rim Light* âmbar no contra-campo para realce da silhueta
  - *Contact Shadow* em disco radial suavizado no solo

### 2.2. Motion Principles & Interatividade
- **Rotação 360° com Pointer Events**: Arraste suave com mouse ou toque na tela em dispositivos móveis, com inércia física.
- **Slider de Vista Explodida (0% a 100%)**: Interpolação suave em tempo real usando `THREE.MathUtils.damp`, elevando cada ingrediente em seu eixo Y respectivo para inspeção de cada camada.
- **Performance Mobile 60 FPS**: Detecção automática de aceleração gráfica por hardware; fallback automático para renderizador leve em smartphones de entrada.
- **Cálculo de Preço Dinâmico**: Cada ingrediente, blend extra (+ R$ 9,90) ou pão especial adicionado recalcula o valor em tempo real com animação tabular.

---

## 🖨️ 3. Impressão Automática de Comanda Térmica (Recepção / Cozinha)

### 3.1. Layout Térmico 80mm & 58mm
- O componente `<ThermalReceipt />` possui regras rigorosas de CSS `@media print`:
  - Largura ajustada para 80mm (padrão EPSON TM-T20, Elgin i9, Bematech MP-4200) e 58mm.
  - Tipografia monoespaçada de alto contraste em preto absoluto (`#000000`).
  - Destaque em fonte gigante para a **Senha do Pedido (#001)** e Nome do Cliente.
  - Discriminação camada por camada de hambúrgueres personalizados montados no visualizador 3D.
  - QR Code térmico e dados completos de pagamento e observações.

### 3.2. Disparo Automático e Manual
- **Automático**: Assim que o pagamento via Pix é confirmado na tela, o sistema dispara a janela de impressão nativa (`window.print()`).
- **Manual / KDS**: A qualquer momento, a equipe da cozinha ou recepção pode clicar em **"Imprimir Comanda"** no cartão do pedido para reimpressão imediata.
- **Serviços Locais Compatíveis**: Pronto para integração com Web Bluetooth, Web USB, QZ Tray e PrintNode.

---

## 🔔 4. KDS de Cozinha & Painel de Chamadas TV

### 4.1. KDS Protegido
- Autenticação com senha admin: `MARE123` (configurável via variável `ADMIN_PASSWORD`).
- Colunas organizadas: **Recebido**, **Em preparo** e **Pronto**.
- Botão em destaque: 🔔 **"Chamar Cliente" / "Chamar Novamente"**.
- Link direto de notificação via **WhatsApp** com mensagem pronta: *"Olá [Cliente]! Seu pedido [Nº] na Maré Hambúrgueria está PRONTO para retirada no balcão!"*.

### 4.2. Painel de TV
- Rota `/painel` (ou `#/painel`) com layout fullscreen escuro de alto contraste.
- Anúncio sonoro duplo: Sinal acústico (*Ding-dong*) seguido de síntese de voz nativa (Web Speech API) em português do Brasil: *"Pedido doze, João, seu pedido está pronto"*.
- Modal de chamada em tela cheia com animação pulsar por 6 segundos.

---

## 🔄 5. Sincronização em Tempo Real & Prevenção do Erro 404 na Vercel

### 5.1. Como evitar o erro 404 na Vercel
Ao recarregar páginas em SPAs na Vercel (ex: `/painel` ou `/cozinha`), se o arquivo `vercel.json` não estiver no repositório, a Vercel busca por uma pasta `/painel/index.html` e retorna `404: NOT_FOUND`.

O projeto resolve isso de duas formas:
1. **Configuração `vercel.json`**: Incluído na raiz do projeto com regra de reescrita global (`rewrites: [{ source: "/(.*)", destination: "/index.html" }]`). Certifique-se de que este arquivo foi commitado e enviado ao repositório GitHub.
2. **Hash Routing Resiliente**: O sistema suporta rotas com hash (`#/painel`, `#/cozinha`, `#/montador-3d`), que **nunca geram erro 404** em nenhum servidor estático, mesmo sem arquivo de configuração de reescrita.

### 5.2. Sincronização Instantânea Multi-Abas
- **BroadcastChannel API**: Comunicação entre abas no mesmo navegador com latência inferior a **5ms**.
- **Server-Sent Events (SSE)**: Rota `/api/orders/stream` no servidor Node/Express para sincronizar múltiplos dispositivos físicos na mesma rede.
- **Polling de Garantia**: Fallback automático a cada 1.5s via `localStorage` e API REST.

---

## 🧪 6. Observabilidade e Testes E2E (Playwright)

### 6.1. Observabilidade (Sentry)
O sistema captura e isola exceções críticas:
- Falhas de inicialização do contexto WebGL / Three.js
- Falhas de áudio do AudioContext ou Web Speech API
- Erros de comunicação com a impressora térmica

### 6.2. Cenário de Teste E2E (Playwright)
```typescript
test('fluxo completo: montagem 3d -> pedido pix -> kds -> chamada tv', async ({ page, context }) => {
  // 1. Cliente acessa o montador 3D
  await page.goto('/#/montador-3d');
  await page.click('text=Pão Australiano');
  await page.click('text=2x Blends');
  await page.click('text=Adicionar ao Pedido');

  // 2. Up-sell estratégico e checkout
  await page.click('text=Avançar');
  await page.click('text=Continuar para Pagamento');
  await page.fill('input[placeholder*="João"]', 'Maria Santos');
  await page.click('text=Confirmar Pagamento Pix');

  // 3. Verificação no KDS da cozinha
  const kitchenPage = await context.newPage();
  await kitchenPage.goto('/#/cozinha');
  await kitchenPage.fill('input[type="password"]', 'MARE123');
  await kitchenPage.click('text=Acessar Cozinha');
  await expect(kitchenPage.locator('text=Maria Santos')).toBeVisible();

  // 4. Mudar status para Pronto e verificar TV
  await kitchenPage.click('text=Pedido Pronto');
  const tvPage = await context.newPage();
  await tvPage.goto('/#/painel');
  await expect(tvPage.locator('text=MARIA SANTOS')).toBeVisible();
});
```

---

## 🚀 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (Porta 3000)
npm run dev
```

Acesse em seu navegador:
- Totem: `http://localhost:3000/#/`
- Montador 3D: `http://localhost:3000/#/montador-3d`
- Cozinha KDS: `http://localhost:3000/#/cozinha`
- Painel TV: `http://localhost:3000/#/painel`
