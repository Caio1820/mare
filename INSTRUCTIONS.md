# 📋 INSTRUÇÕES DE OPERAÇÃO E MANUTENÇÃO — MARÉ HAMBURGUERIA

## 1. ACESSO ÀS TELAS
- **Totem de Autoatendimento**: Acesse a raiz (`/` ou `#/`)
- **Montador de Hambúrguer 3D**: Acesse `#/montador-3d` ou clique no banner do cardápio / botão "3D" no cabeçalho
- **Cozinha KDS**: Acesse `/cozinha` ou `#/cozinha`
  - **Senha de Administrador**: `MARE123`
- **Painel de Chamadas TV**: Acesse `/painel` ou `#/painel` (coloque o navegador da TV em tela cheia pressionando `F11`).

---

## 2. DICAS IMPORTANTES PARA DEPLOY NA VERCEL
1. **Erro 404 ao recarregar `/painel`**:
   - Esse erro acontece quando a Vercel tenta encontrar um arquivo `/painel.html`.
   - **Solução 1**: Garanta que o arquivo `vercel.json` presente na raiz do projeto está commitado no seu GitHub.
   - **Solução 2**: Utilize os links com hash (`#/painel` e `#/cozinha`). Eles funcionam em qualquer servidor sem precisar de configuração extra.

2. **Áudio do Painel de TV e Cozinha**:
   - Navegadores modernos (Chrome, Edge, Safari) exigem pelo menos **um clique** na tela após abrir a página para liberar a reprodução de sons e fala em voz alta.
   - No Painel de TV, clique no botão **"Ativar Áudio da TV"** no topo da tela.

---

## 3. IMPRESSÃO DE COMANDAS TÉRMICAS
- O sistema é pré-formatado para bobinas térmicas de **80mm** (padrão EPSON TM-T20X, Elgin i9, Bematech).
- Nas opções de impressão do navegador:
  - Selecione a impressora térmica.
  - Defina as margens como **"Nenhuma"** (*None*).
  - Marque a opção **"Gráficos de segundo plano"** (*Background graphics*).
- O comprovante inclui a discriminação detalhada dos hambúrgueres montados no visualizador 3D (pão, ponto da carne, queijos, bacon e adicionais).
