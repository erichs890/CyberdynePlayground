const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const db = require('../db');
const router = express.Router();

// "Employee directory" — accepts LDAP-style filter in query, returns all fields
router.get('/directory/search', (req, res) => {
  const q = req.query.q || '';
  const sql = `SELECT id, username, email, role, balance FROM users WHERE username LIKE '%${q}%' OR email LIKE '%${q}%'`;
  try { res.json(db.prepare(sql).all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// "Export" endpoint — SSTI disguised as PDF template
router.post('/reports/generate', (req, res) => {
  const { title, body, footer } = req.body || {};
  let output = (body || '').replace(/\{\{(.+?)\}\}/g, (_m, expr) => {
    try { return eval(expr); } catch { return ''; }
  });
  res.json({ title, content: output, footer, generated_at: new Date().toISOString() });
});

// "Webhook verification" — SSRF hidden behind legit-sounding feature
router.post('/integrations/verify', async (req, res) => {
  const { callback_url } = req.body || {};
  if (!callback_url) return res.status(400).json({ error: 'callback_url required' });
  try {
    const axios = require('axios');
    const r = await axios.get(callback_url, { timeout: 5000, validateStatus: () => true });
    res.json({ verified: true, status: r.status });
  } catch (e) {
    res.json({ verified: false, reason: e.message });
  }
});

// "System diagnostics" — command injection behind admin-looking endpoint
router.post('/admin/diagnostics', (req, res) => {
  const { target } = req.body || {};
  const cmd = process.platform === 'win32'
    ? `tracert -d -h 5 ${target || '127.0.0.1'}`
    : `traceroute -m 5 ${target || '127.0.0.1'}`;
  exec(cmd, { timeout: 15000, shell: true }, (err, stdout, stderr) => {
    res.json({ result: stdout?.toString(), errors: stderr?.toString() });
  });
});

// "Backup download" — path traversal behind admin feature
router.get('/admin/backup/:filename', (req, res) => {
  const base = require('path').join(__dirname, '..', 'db');
  const file = require('path').join(base, req.params.filename);
  try {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(require('fs').readFileSync(file));
  } catch (e) {
    res.status(404).json({ error: 'Backup not found' });
  }
});

// "User preferences" — prototype pollution via deep merge
router.put('/account/preferences', (req, res) => {
  const prefs = { theme: 'light', language: 'pt-BR', notifications: true };
  function merge(t, s) {
    for (const k in s) {
      if (typeof s[k] === 'object' && s[k] !== null) {
        if (!t[k]) t[k] = {};
        merge(t[k], s[k]);
      } else {
        t[k] = s[k];
      }
    }
    return t;
  }
  res.json({ preferences: merge(prefs, req.body || {}) });
});

// "Newsletter subscribe" — email header injection disguised as marketing
router.post('/newsletter/subscribe', (req, res) => {
  const { email, name } = req.body || {};
  const headers = `To: newsletter@cyberdyne.systems\r\nFrom: ${email}\r\nSubject: New subscriber: ${name}\r\n`;
  res.json({ subscribed: true, email });
});

// "Password recovery" — account enumeration via distinct error messages
router.post('/account/recover', (req, res) => {
  const { email } = req.body || {};
  const user = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'No account found with this email address' });
  const token = crypto.createHash('md5').update(email + Math.floor(Date.now() / 1000)).digest('hex');
  res.json({ message: 'Recovery email sent', recovery_token: token, uid: user.id });
});

// "Internal status" page — leaks infra info disguised as health check
router.get('/status', (_req, res) => {
  res.json({
    api: 'healthy',
    database: 'connected',
    version: '2.4.1',
    node: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// "Config" endpoint — looks like feature config, leaks real secrets
router.get('/config/client', (_req, res) => {
  res.json({
    features: { darkMode: true, betaChat: true, analytics: true },
    endpoints: {
      auth: '/api/auth/login',
      graphql: '/api/graphql',
      upload: '/api/upload/v2',
      ws: 'ws://localhost:3000/ws'
    },
    keys: {
      maps: 'AIzaSyFAKE-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      analytics: 'UA-000000-1',
      sentry: 'https://fakekey@sentry.io/1234567',
      stripe: 'pk_live_51FakePublishableKeyxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  });
});

// "Markdown preview" — stored XSS via rendered HTML
router.post('/content/preview', (req, res) => {
  const { markdown } = req.body || {};
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body>${markdown || ''}</body></html>`);
});

// "Debug" cookie — sets an auth cookie with predictable value
router.get('/auth/remember', (req, res) => {
  const uid = req.query.uid || '1';
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const token = Buffer.from(`${user.username}:${uid}:${Date.now()}`).toString('base64');
  res.cookie('remember_token', token, { httpOnly: false, sameSite: 'none', secure: false });
  res.json({ message: 'Remember me cookie set' });
});

// "Search suggestions" — reflected content in JSON (XSS if parsed by client)
router.get('/search/suggest', (req, res) => {
  const q = req.query.q || '';
  res.json({
    query: q,
    suggestions: [`${q} accessories`, `${q} replacement parts`, `${q} manual`]
  });
});

// "Analytics event" — accepts arbitrary JSON, logs to console (info leak + injection)
router.post('/analytics/event', (req, res) => {
  console.log('[analytics]', JSON.stringify(req.body));
  res.status(204).end();
});

// "File converter" — XXE disguised as document conversion
router.post('/documents/convert', express.text({ type: '*/*', limit: '10mb' }), (req, res) => {
  const xml = typeof req.body === 'string' ? req.body : '';
  const entities = {};
  const re = /<!ENTITY\s+(\w+)\s+SYSTEM\s+"([^"]+)">/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const [, name, uri] = m;
    if (uri.startsWith('file://')) {
      try { entities[name] = require('fs').readFileSync(uri.replace('file://', ''), 'utf8'); }
      catch (e) { entities[name] = `Error: ${e.message}`; }
    }
  }
  let resolved = xml;
  for (const [name, val] of Object.entries(entities)) {
    resolved = resolved.replace(new RegExp(`&${name};`, 'g'), val);
  }
  res.json({ converted: true, output: resolved });
});

// "Batch user import" — SQL injection via CSV-like input
router.post('/admin/import-users', (req, res) => {
  const { users } = req.body || {};
  if (!Array.isArray(users)) return res.status(400).json({ error: 'users array required' });
  const results = [];
  for (const u of users) {
    try {
      const sql = `INSERT INTO users (username, email, password_plain, password_md5, role, api_token) VALUES ('${u.username}', '${u.email}', '${u.password}', '${crypto.createHash('md5').update(u.password || '').digest('hex')}', '${u.role || 'user'}', 'TKN-${Math.random().toString(36).slice(2,8).toUpperCase()}')`;
      db.prepare(sql).run();
      results.push({ username: u.username, status: 'created' });
    } catch (e) {
      results.push({ username: u.username, status: 'error', message: e.message });
    }
  }
  res.json({ imported: results });
});

module.exports = router;
