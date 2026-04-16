// =====================================================================
// VULN-025  BOLA / IDOR (Broken Object Level Authorization)
// CWE-639  |  OWASP A01:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// GET /api/users/:id retorna dados de qualquer usuário sem verificar
// se o token JWT pertence ao mesmo user. Basta iterar IDs 1..N.
//
// VULN-026  MASS ASSIGNMENT / Privilege Escalation via Registration
// CWE-915  |  OWASP A08:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// POST /api/users/register aceita "role" no body. Um atacante envia
// { "username":"evil", "password":"x", "role":"superadmin" } e vira admin.
// =====================================================================
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const router = express.Router();

// VULN-025: IDOR — sem checagem de ownership
router.get('/users/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, password_plain, password_md5, role, api_token, balance FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  // Devolve tudo: senha em texto plano, token, saldo
  res.json(user);
});

// VULN-026: Mass Assignment — role controlada pelo cliente
router.post('/users/register', (req, res) => {
  const { username, email, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const md5 = crypto.createHash('md5').update(password).digest('hex');
  const token = 'TKN-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const info = db.prepare(
    'INSERT INTO users (username, email, password_plain, password_md5, role, api_token, balance) VALUES (?, ?, ?, ?, ?, ?, 0)'
  ).run(username, email || '', password, md5, role || 'user', token);
  res.json({ ok: true, id: info.lastInsertRowid, role: role || 'user', api_token: token });
});

// VULN-033: IDOR em transações — retorna transação de qualquer user
router.get('/users/:id/transactions', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC'
  ).all(req.params.id);
  res.json(rows);
});

module.exports = router;
