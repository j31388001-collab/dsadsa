// Recebe eventos: payment.approved, payment.refused, payment.canceled.
// TODO: validar a assinatura do webhook conforme a documentação do provedor e liberar o acesso só em payment.approved.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const ev = req.body || {};
  const type = ev.type || ev.event;
  console.log("webhook", type);
  if (type === "payment.approved") { /* TODO: liberar acesso ao curso (e-mail/plataforma de entrega) */ }
  return res.status(200).json({ received: true });
};
