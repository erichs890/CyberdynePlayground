// =====================================================================
// VULN-029  RACE CONDITION (TOCTOU on Balance Transfer)
// CWE-367  |  OWASP A04:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// POST /api/transfer simula transferência de saldo entre usuários.
// O saldo é lido, verificado, e depois atualizado em statements separados
// SEM transação SQL e com um delay artificial. Um atacante pode disparar
// N requests simultâneos e transferir mais do que possui:
//   for i in {1..20}; do curl -X POST .../api/transfer -d '...' & done
//
// VULN-030  NO RATE LIMIT (Brute Force enabler)
// CWE-307  |  OWASP A07:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// POST /api/auth/verify-code aceita tentativas ilimitadas de código OTP.
// Um atacante bruta-forcea o código de 4 dígitos em <10000 requests.
//
// VULN-031  PREDICTABLE PASSWORD RESET TOKEN
// CWE-330  |  OWASP A02:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// GET /api/auth/reset-password?email= gera token = MD5(email + timestamp truncado).
// Timestamp com resolução de 1 segundo permite predição trivial.
// =====================================================================
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const router = express.Router();

// --- VULN-029: Race Condition no transfer ---
router.post('/transfer', async (req, res) => {
  const { from_user_id, to_user_id, amount } = req.body || {};
  const transferAmount = parseFloat(amount);
  if (!from_user_id || !to_user_id || isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'from_user_id, to_user_id, amount required' });
  }

  // PASSO 1: Ler saldo (READ) — sem lock
  const sender = db.prepare('SELECT id, balance FROM users WHERE id = ?').get(from_user_id);
  if (!sender) return res.status(404).json({ error: 'sender not found' });

  // Delay artificial para amplificar a janela de race condition
  await new Promise(r => setTimeout(r, 100));

  // PASSO 2: Verificar saldo (CHECK) — com dados potencialmente stale
  if (sender.balance < transferAmount) {
    return res.status(400).json({ error: 'Insufficient balance', balance: sender.balance });
  }

  // Delay artificial novamente
  await new Promise(r => setTimeout(r, 50));

  // PASSO 3: Atualizar (WRITE) — sem transação SQL, sem SELECT ... FOR UPDATE
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(transferAmount, from_user_id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(transferAmount, to_user_id);

  const newSender = db.prepare('SELECT balance FROM users WHERE id = ?').get(from_user_id);
  const newReceiver = db.prepare('SELECT balance FROM users WHERE id = ?').get(to_user_id);

  res.json({
    ok: true,
    transferred: transferAmount,
    sender_balance: newSender.balance,
    receiver_balance: newReceiver.balance
  });
});

// --- VULN-030: No Rate Limit on OTP ---
const FAKE_OTP = '1337'; // OTP fixo para simulação

router.post('/auth/verify-code', (req, res) => {
  const { email, code } = req.body || {};
  // Sem rate limit, sem lockout, sem delay exponencial
  if (code === FAKE_OTP) {
    return res.json({ ok: true, message: 'Code verified. Access granted.', email });
  }
  res.status(401).json({ ok: false, message: 'Invalid code', attempt_logged: false });
});

// --- VULN-031: Predictable Reset Token ---
router.get('/auth/reset-password', (req, res) => {
  const email = req.query.email || '';
  const user = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Email not found' });

  // Token = MD5(email + timestamp truncado ao segundo) — totalmente previsível
  const timestamp = Math.floor(Date.now() / 1000);
  const token = crypto.createHash('md5').update(email + timestamp).digest('hex');

  res.json({
    message: 'Password reset link generated',
    reset_url: `/api/auth/do-reset?token=${token}&uid=${user.id}`,
    _debug: { token, timestamp, formula: 'MD5(email + unix_timestamp_seconds)' }
  });
});

router.get('/auth/do-reset', (req, res) => {
  // Aceita qualquer token sem validação real — placeholder para o scanner detectar
  res.json({ message: 'Password reset successful (no actual validation)', uid: req.query.uid, token: req.query.token });
});

module.exports = router;
