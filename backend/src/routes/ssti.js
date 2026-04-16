// =====================================================================
// VULN-093  SERVER-SIDE TEMPLATE INJECTION (SSTI)
// CWE-1336  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// POST /api/render aceita template string com interpolação via eval.
// Payloads: {{7*7}} → 49, {{process.env}} → leak env vars
//
// VULN-094  LOG INJECTION / CRLF IN LOGS
// CWE-117  |  OWASP A09:2021  |  CVSS 5.3 (Medium)
// GET /api/log?msg= escreve diretamente no log sem sanitizar \r\n.
//
// VULN-095  EMAIL HEADER INJECTION
// CWE-93  |  OWASP A03:2021  |  CVSS 7.5 (High)
// POST /api/contact aceita \r\n no campo "email" para injetar headers.
//
// VULN-096  HTTP PARAMETER POLLUTION (HPP)
// CWE-235  |  OWASP A04:2021  |  CVSS 5.3 (Medium)
// GET /api/hpp?role=user&role=admin — último valor ganha silenciosamente.
//
// VULN-097  HTTP VERB TAMPERING
// CWE-650  |  OWASP A04:2021  |  CVSS 5.3 (Medium)
// DELETE /api/admin-only acessível apesar de "bloqueio" em GET/POST.
//
// VULN-098  REGEX DOS (ReDoS)
// CWE-1333  |  OWASP A06:2021  |  CVSS 7.5 (High)
// POST /api/validate com regex catastrófico: /^(a+)+$/ contra "aaa...b"
// =====================================================================
const express = require('express');
const router = express.Router();

const logEntries = [];

// VULN-093: SSTI via eval de templates
router.post('/render', (req, res) => {
  const template = (req.body && req.body.template) || '';
  let rendered = template;

  // Substitui {{ expr }} por eval(expr) — SSTI completo
  rendered = rendered.replace(/\{\{(.+?)\}\}/g, (_match, expr) => {
    try {
      return eval(expr);
    } catch (e) {
      return `[ERROR: ${e.message}]`;
    }
  });

  res.json({
    input: template,
    rendered,
    _vuln: 'SSTI: try {{7*7}}, {{process.env.PATH}}, {{require("child_process").execSync("whoami").toString()}}'
  });
});

// Variante GET para scanners
router.get('/render', (req, res) => {
  const template = req.query.template || '';
  let rendered = template.replace(/\{\{(.+?)\}\}/g, (_m, expr) => {
    try { return eval(expr); } catch (e) { return `[ERROR: ${e.message}]`; }
  });
  res.setHeader('Content-Type', 'text/html');
  res.send(`<html><body><h1>Template Output</h1><div>${rendered}</div></body></html>`);
});

// VULN-094: Log injection
router.get('/log', (req, res) => {
  const msg = req.query.msg || 'info';
  const entry = `[${new Date().toISOString()}] ${msg}`;
  // Sem sanitizar \r\n — permite forjar entradas de log
  logEntries.push(entry);
  console.log('[app-log]', entry);
  res.json({ logged: entry, _vuln: 'Try: msg=OK%0d%0a[FORGED] Admin logged in successfully' });
});

router.get('/log/view', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(logEntries.join('\n'));
});

// VULN-095: Email header injection
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  // Simula construção de email headers sem filtrar CRLF
  const headers = `From: ${email}\r\nTo: support@cyberdyne.systems\r\nSubject: Contact from ${name}\r\n`;
  // Se email contém \r\n, headers adicionais são injetados
  const simulatedEmail = `${headers}\r\n${message}`;
  res.json({
    sent: true,
    simulated_raw_email: simulatedEmail,
    _vuln: 'Inject headers via email: test@x.com\\r\\nBcc: attacker@evil.com'
  });
});

// VULN-096: HTTP Parameter Pollution
router.get('/hpp', (req, res) => {
  // Express: req.query.role com múltiplos valores → array, mas código usa último
  let role = req.query.role;
  if (Array.isArray(role)) role = role[role.length - 1]; // último ganha
  const isAdmin = role === 'admin' || role === 'superadmin';

  res.json({
    role_received: req.query.role,
    role_used: role,
    is_admin: isAdmin,
    _vuln: 'HPP: /api/hpp?role=user&role=admin — último "role" ganha, bypass de WAF que só checa o primeiro'
  });
});

// VULN-097: Verb Tampering — endpoint "bloqueado" para GET/POST, mas aberto para outros verbos
router.get('/admin-only', (_req, res) => {
  res.status(403).json({ error: 'Forbidden: admin access only (GET blocked)' });
});
router.post('/admin-only', (_req, res) => {
  res.status(403).json({ error: 'Forbidden: admin access only (POST blocked)' });
});
// DELETE, PUT, PATCH não bloqueados!
router.delete('/admin-only', (_req, res) => {
  res.json({ access: 'granted', method: 'DELETE', message: 'Verb tampering bypassed the restriction', secrets: { admin_password: 'admin123', jwt_secret: 'secret123' } });
});
router.put('/admin-only', (_req, res) => {
  res.json({ access: 'granted', method: 'PUT', message: 'Verb tampering bypassed the restriction' });
});
router.patch('/admin-only', (_req, res) => {
  res.json({ access: 'granted', method: 'PATCH', message: 'Verb tampering bypassed the restriction' });
});

// VULN-098: ReDoS
router.post('/validate', (req, res) => {
  const { input, pattern } = req.body || {};
  const defaultPattern = '^(a+)+$'; // Catastrófico: exponencial em "aaa...aab"
  const regexStr = pattern || defaultPattern;

  const start = process.hrtime.bigint();
  let matched = false;
  try {
    const re = new RegExp(regexStr);
    matched = re.test(input || '');
  } catch (e) {
    return res.json({ error: e.message });
  }
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

  res.json({
    pattern: regexStr,
    input: (input || '').slice(0, 100),
    matched,
    timing_ms: elapsed,
    _vuln: 'ReDoS: try {"input":"aaaaaaaaaaaaaaaaaaaaaaab","pattern":"^(a+)+$"} — exponential backtracking'
  });
});

module.exports = router;
