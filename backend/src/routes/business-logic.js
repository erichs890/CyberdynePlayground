// =====================================================================
// VULN-062  PRICE MANIPULATION / BUSINESS LOGIC FLAW
// CWE-840  |  OWASP A04:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// POST /api/checkout aceita o preço do front sem revalidar no back.
// Payload: { "product_id": 1, "price": 0.01, "quantity": 1 }
//
// VULN-063  COUPON/DISCOUNT ABUSE (aplicar N vezes)
// CWE-840  |  OWASP A04:2021  |  CVSS 6.5 (Medium)
// ---------------------------------------------------------------------
// POST /api/apply-coupon permite aplicar o mesmo cupom várias vezes,
// reduzindo o preço abaixo de zero.
//
// VULN-064  NEGATIVE QUANTITY / AMOUNT MANIPULATION
// CWE-20  |  OWASP A04:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// POST /api/checkout aceita quantity negativa → reembolso.
//
// VULN-065  INSUFFICIENT ANTI-AUTOMATION (no CAPTCHA, no proof-of-work)
// CWE-799  |  OWASP A07:2021  |  CVSS 5.3 (Medium)
// ---------------------------------------------------------------------
// POST /api/gift-card/redeem sem rate limit e sem CAPTCHA.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

// VULN-062 + 064: Checkout com preço e quantidade controlados pelo client
router.post('/checkout', (req, res) => {
  const { product_id, price, quantity, user_id } = req.body || {};
  // Usa o preço enviado pelo cliente sem revalidar no banco!
  const total = (price || 0) * (quantity || 1);
  // Quantity negativa gera total negativo → crédito para o atacante
  const info = db.prepare(
    'INSERT INTO transactions (user_id, product_id, amount, status, note) VALUES (?, ?, ?, ?, ?)'
  ).run(user_id || 1, product_id, total, 'completed', `checkout: ${quantity}x @ ${price}`);

  if (user_id) {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total, user_id);
  }

  res.json({
    ok: true,
    transaction_id: info.lastInsertRowid,
    total,
    _debug: { client_price: price, client_quantity: quantity, note: 'Price from client, not validated against DB' }
  });
});

// VULN-063: Coupon reuse
const coupons = { 'CYBERDYNE50': 0.50, 'FREESKY': 1.00, 'DISCOUNT20': 0.20 };
const cart = { total: 100.00 };

router.post('/apply-coupon', (req, res) => {
  const { code } = req.body || {};
  const discount = coupons[code];
  if (!discount) return res.status(400).json({ error: 'Invalid coupon' });
  // Sem tracking de uso — pode aplicar o mesmo cupom infinitas vezes
  cart.total = cart.total * (1 - discount);
  res.json({
    coupon: code,
    discount_percent: discount * 100,
    new_total: cart.total,
    _note: 'No single-use enforcement. Apply repeatedly to get price below zero.'
  });
});

// Reset do carrinho para testes
router.post('/cart/reset', (_req, res) => {
  cart.total = 100.00;
  res.json({ ok: true, total: cart.total });
});

// VULN-065: Gift card redeem sem anti-automação
router.post('/gift-card/redeem', (req, res) => {
  const { code } = req.body || {};
  // Código fixo para simulação — brute forceable sem CAPTCHA
  if (code === 'GIFT-2026-XMAS-1337') {
    return res.json({ ok: true, value: 500.00, message: 'Gift card redeemed!' });
  }
  res.status(400).json({ ok: false, message: 'Invalid gift card code' });
});

module.exports = router;
