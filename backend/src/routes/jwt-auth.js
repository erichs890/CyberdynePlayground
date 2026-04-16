// =====================================================================
// VULN-021  JWT ALGORITHM "NONE" BYPASS
// CWE-347  |  OWASP A02:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// A verificação aceita o algoritmo "none". Um atacante pode forjar um
// token sem assinatura: { "alg": "none", "typ": "JWT" }.{ "sub": 1, "role": "superadmin" }.
// A lib jwt.verify é chamada com algorithms: ['HS256','none'].
//
// VULN-022  JWT WEAK SECRET (Brute-Forceable)
// CWE-521  |  OWASP A02:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// Secret é 'secret123' — quebrável em segundos com hashcat/jwt_tool.
//
// VULN-023  JWT KID SQL INJECTION
// CWE-89  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// O header "kid" do JWT é concatenado em SQL para buscar a chave.
// Payload: kid = "' UNION SELECT 'fake-key' --"
// =====================================================================
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_WEAK_SECRET = 'secret123'; // VULN-022: segredo brute-forceable

// POST /api/auth/login — retorna JWT com secret fraco, sem rate limit
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  // VULN-024 (Broken Auth): query parametrizada mas sem rate limit nem lockout
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_plain = ?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_WEAK_SECRET,
    { algorithm: 'HS256', expiresIn: '24h', header: { kid: 'default-key' } }
  );

  // VULN-035: retorna token no body (frontend vai salvar em localStorage)
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, balance: user.balance } });
});

// Middleware de verificação JWT intencionalmente falho
function vulnerableJwtVerify(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token required' });
  const token = auth.replace(/^Bearer\s+/i, '');

  try {
    // Decodifica header para pegar kid (sem verificar assinatura antes!)
    const decoded_header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString()
    );

    // VULN-023: kid injetado direto em SQL
    let secret = JWT_WEAK_SECRET;
    if (decoded_header.kid) {
      try {
        const row = db.prepare(
          `SELECT value FROM hidden_configs WHERE key = '${decoded_header.kid}'`
        ).get();
        if (row) secret = row.value;
      } catch (_) { /* ignora erro SQL — facilita blind SQLi */ }
    }

    // VULN-021: aceita algoritmo "none" explicitamente
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256', 'HS384', 'HS512', 'none']
    });
    req.user = payload;
    next();
  } catch (e) {
    res.status(403).json({ error: 'Token invalid', details: e.message });
  }
}

// GET /api/auth/profile — requer JWT (vulnerável)
router.get('/auth/profile', vulnerableJwtVerify, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, balance, api_token FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Vaza api_token e dados completos
  res.json(user);
});

// GET /api/auth/admin — VULN-034: Broken Function Level Authorization
// Apenas verifica se o JWT é válido, NÃO verifica role == admin
router.get('/auth/admin', vulnerableJwtVerify, (req, res) => {
  const configs = db.prepare('SELECT * FROM hidden_configs').all();
  const users = db.prepare('SELECT id, username, email, role, api_token, balance FROM users').all();
  res.json({ configs, users, message: 'Welcome to admin panel. No role check applied.' });
});

router.vulnerableJwtVerify = vulnerableJwtVerify;
module.exports = router;
