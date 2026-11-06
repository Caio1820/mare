export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { valor, pedidoId } = req.body;

  const appKey = process.env.BB_APP_KEY;
  const basicAuth = process.env.BB_BASIC;

  if (!appKey || !basicAuth) {
    return res.status(500).json({ error: 'Credenciais do Banco do Brasil não configuradas na Vercel.' });
  }

  try {
    // Aqui entra a chamada oficial para a API do Banco do Brasil (Homologação/Produção)
    // Exemplo de payload simulado/estruturado para testes iniciais
    console.log(`Gerando Pix para o pedido ${pedidoId} no valor de R$ ${valor}`);

    // Retorno simulado bem-sucedido para validar a conexão front <-> backend
    return res.status(200).json({
      success: true,
      txid: `mare_${pedidoId}_${Date.now()}`,
      qrCode: '00020126580014br.gov.bcb.pix...', // String copia e cola do Pix
      rawResponse: { mensagem: 'Integração pronta para homologação BB' }
    });
  } catch (error) {
    console.error('Erro ao gerar Pix no BB:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com a API do Banco do Brasil' });
  }
}
