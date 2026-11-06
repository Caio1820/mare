export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const dadosWebhook = req.body;

  try {
    console.log('Webhook Pix recebido com sucesso:', JSON.stringify(dadosWebhook));

    // Aqui o teu sistema processa a confirmação enviada pelo Banco do Brasil
    // ex: const pagamento = dadosWebhook.pix[0];

    return res.status(200).json({ recebido: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
}
