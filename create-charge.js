// Função de servidor (Vercel). A chave secreta fica em variável de ambiente, nunca no navegador.
const PRICES = { basico: 799, completo: 1595 }; // centavos — o valor é definido AQUI, não pelo navegador
const EXTRAS = {};
const find = (o, t, k = "") => { if (typeof o === "string") return t(k, o) ? o : null; if (o && typeof o === "object") for (const x in o) { const r = find(o[x], t, x); if (r) return r; } return null; };                              // ex.: { b1: 990 } se cadastrar ofertas extras

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const { name, email, phone, plan, extras = [] } = req.body || {};
  if (!PRICES[plan] || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || "") || !/^55\d{10,11}$/.test(phone || ""))
    return res.status(400).json({ error: "dados inválidos" });
  let amount = PRICES[plan];
  for (const id of Array.isArray(extras) ? extras : []) { if (!EXTRAS[id]) return res.status(400).json({ error: "extra inválido" }); amount += EXTRAS[id]; }
  if (!process.env.PAY_API_KEY) { console.error("PAY_API_KEY ausente nas variáveis de ambiente"); return res.status(500).json({ error: "config" }); }
  try {
    const base = (process.env.PAY_BASE_URL || "https://www.wmspay.com.br").replace(/\/$/, "");
    const r = await fetch(base + "/v1/charges", {
      method: "POST",
      headers: { "x-api-key": process.env.PAY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payment_method: "pix" }),
    });
    const d = await r.json().catch(() => ({}));
    const url = find(d, (k, v) => /^https?:\/\//.test(v) && /checkout|link|url/i.test(k));
    const pix = find(d, (k, v) => /^000201/.test(v));
    if (!r.ok || (!url && !pix)) { console.error("charge falhou", r.status, "campos:", Object.keys(d), "msg:", d.error || d.message || ""); return res.status(502).json({ error: "falha ao criar cobrança" }); }
    console.log("cobrança criada", { plan, email, amount });
    return res.status(200).json(url ? { checkoutUrl: url } : { pixCode: pix });
  } catch (e) { console.error(e); return res.status(502).json({ error: "falha ao criar cobrança" }); }
};
