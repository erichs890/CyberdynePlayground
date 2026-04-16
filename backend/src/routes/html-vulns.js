const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const router = express.Router();

function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title} — Cyberdyne Systems</title>
<style>body{font-family:sans-serif;background:#0a1628;color:#e0e6ed;padding:24px;max-width:960px;margin:0 auto}
a{color:#00d4ff}input,textarea,select{padding:8px;margin:4px;background:#162a4a;color:#e0e6ed;border:1px solid #1e3456;border-radius:4px}
button{padding:8px 16px;background:#00d4ff;color:#0a1628;border:none;border-radius:4px;cursor:pointer;font-weight:bold}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #1e3456;padding:6px 10px;text-align:left}
th{background:#162a4a}pre{background:#0a1020;padding:12px;border-radius:8px;overflow:auto;color:#0f0}
.card{background:#0f1f3a;border:1px solid #1e3456;border-radius:12px;padding:20px;margin:16px 0}
</style></head><body><h1><a href="/app" style="text-decoration:none;color:#fff">⚙ Cyberdyne</a> › ${title}</h1>${body}</body></html>`;
}

// ===================== MAIN HTML APP =====================

router.get('/app', (_req, res) => {
  res.send(page('Portal', `
<div class="card">
  <h2>Products</h2>
  <form action="/app/products"><input name="id" placeholder="Product ID (try: 1 OR 1=1)"><button>Search</button></form>
  <p><a href="/app/products">View All</a></p>
</div>
<div class="card">
  <h2>Search</h2>
  <form action="/app/search"><input name="q" placeholder="Search term" style="width:300px"><button>Search</button></form>
</div>
<div class="card">
  <h2>Login</h2>
  <form action="/app/login" method="POST">
    <input name="username" placeholder="Username" value="admin">
    <input name="password" type="password" placeholder="Password">
    <button>Sign In</button>
  </form>
</div>
<div class="card">
  <h2>Comments</h2>
  <form action="/app/comment" method="POST">
    <input name="product_id" value="1" style="width:60px">
    <input name="author" placeholder="Your name">
    <input name="body" placeholder="Comment (HTML allowed)" style="width:300px">
    <button>Post</button>
  </form>
  <p><a href="/app/comments?product_id=1">View comments for product 1</a></p>
</div>
<div class="card">
  <h2>Network Tools</h2>
  <form action="/app/ping" method="POST"><input name="host" placeholder="IP or hostname"><button>Ping</button></form>
  <form action="/app/fetch"><input name="url" placeholder="URL to inspect" style="width:300px"><button>Fetch</button></form>
  <form action="/app/download"><input name="file" placeholder="Filename"><button>Download</button></form>
</div>
<div class="card">
  <h2>AI Chat</h2>
  <form action="/app/chat" method="POST"><input name="message" placeholder="Ask the AI..." style="width:400px"><button>Send</button></form>
</div>
<div class="card">
  <h2>Templates</h2>
  <form action="/app/render"><input name="template" placeholder="Hello {{7*7}}" style="width:300px"><button>Render</button></form>
</div>
<div class="card">
  <h2>User Lookup</h2>
  <form action="/app/user"><input name="id" placeholder="User ID" value="1"><button>Lookup</button></form>
</div>
<div class="card">
  <h2>XML Parser</h2>
  <form action="/app/xml" method="POST"><textarea name="xml" rows="3" cols="60">&lt;root&gt;Hello&lt;/root&gt;</textarea><br><button>Parse</button></form>
</div>
<div class="card">
  <h2>File Upload</h2>
  <form action="/app/upload" method="POST" enctype="multipart/form-data"><input type="file" name="file"><input name="filename" placeholder="Save as..."><button>Upload</button></form>
</div>
<div class="card">
  <h2>Quick Links</h2>
  <p>
    <a href="/app/users">All Users</a> |
    <a href="/app/config">System Config</a> |
    <a href="/app/env">.env File</a> |
    <a href="/app/invoices">Invoices</a> |
    <a href="/api/docs">API Docs</a> |
    <a href="/api/export/csv">Export CSV</a> |
    <a href="/api/.git/config">Git Config</a> |
    <a href="/api/actuator/health">Health Check</a> |
    <a href="/api/cloud/config">Cloud Keys</a> |
    <a href="/wp-login.php">WordPress</a>
  </p>
</div>`));
});

// ===================== SQL INJECTION (reflected in HTML) =====================

router.get('/app/products', (req, res) => {
  const id = req.query.id;
  if (id !== undefined) {
    const sql = `SELECT * FROM products WHERE id = ${id}`;
    try {
      const rows = db.prepare(sql).all();
      const html = rows.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.description}</td><td>$${r.price}</td><td>${r.stock}</td></tr>`).join('');
      return res.send(page('Products', `
        <p>Query: <code>${sql}</code></p>
        <table><tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th></tr>${html}</table>
        <div class="card"><form action="/app/products"><input name="id" value="${id}"><button>Search</button></form></div>`));
    } catch (e) {
      return res.send(page('SQL Error', `<pre>${e.message}</pre><p>Query: <code>${sql}</code></p>
        <div class="card"><form action="/app/products"><input name="id" value="${id}"><button>Retry</button></form></div>`));
    }
  }
  const all = db.prepare('SELECT * FROM products').all();
  const html = all.map(r => `<tr><td><a href="/app/products?id=${r.id}">${r.id}</a></td><td>${r.name}</td><td>${r.description}</td><td>$${r.price}</td><td>${r.stock}</td></tr>`).join('');
  res.send(page('All Products', `
    <table><tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th></tr>${html}</table>
    <div class="card"><form action="/app/products"><input name="id" placeholder="Product ID"><button>Search</button></form></div>`));
});

// ===================== XSS REFLECTED (reflected in HTML) =====================

router.get('/app/search', (req, res) => {
  const q = req.query.q || '';
  res.send(page('Search Results', `
    <h2>Results for: ${q}</h2>
    <p>No products found matching "<b>${q}</b>".</p>
    <div class="card"><form action="/app/search"><input name="q" value="${q}" style="width:300px"><button>Search Again</button></form></div>`));
});

// ===================== XSS STORED =====================

router.post('/app/comment', (req, res) => {
  const { product_id, author, body } = req.body || {};
  db.prepare('INSERT INTO comments (product_id, author, body) VALUES (?, ?, ?)').run(product_id || 1, author || 'anon', body || '');
  res.redirect(`/app/comments?product_id=${product_id || 1}`);
});

router.get('/app/comments', (req, res) => {
  const pid = req.query.product_id || '1';
  const comments = db.prepare('SELECT * FROM comments WHERE product_id = ? ORDER BY id DESC').all(pid);
  const html = comments.map(c => `<div class="card"><strong>${c.author}</strong> <small>${c.created_at}</small><div>${c.body}</div></div>`).join('');
  res.send(page('Comments', `
    <h2>Comments for Product ${pid}</h2>${html}
    <div class="card"><form action="/app/comment" method="POST">
      <input type="hidden" name="product_id" value="${pid}">
      <input name="author" placeholder="Name"><input name="body" placeholder="Comment (HTML works)" style="width:300px"><button>Post</button>
    </form></div>`));
});

// ===================== COMMAND INJECTION (output in HTML) =====================

router.post('/app/ping', (req, res) => {
  const host = req.body.host || '127.0.0.1';
  const isWin = process.platform === 'win32';
  const cmd = isWin ? `ping -n 2 ${host}` : `ping -c 2 ${host}`;
  exec(cmd, { timeout: 10000, shell: true }, (err, stdout, stderr) => {
    res.send(page('Ping Result', `
      <p>Command: <code>${cmd}</code></p>
      <pre>${stdout || ''}${stderr || ''}${err ? err.message : ''}</pre>
      <div class="card"><form action="/app/ping" method="POST"><input name="host" value="${host}"><button>Ping Again</button></form></div>`));
  });
});

// ===================== SSRF (output in HTML) =====================

router.get('/app/fetch', async (req, res) => {
  const url = req.query.url || '';
  if (!url) return res.send(page('URL Inspector', `<div class="card"><form action="/app/fetch"><input name="url" placeholder="https://example.com" style="width:400px"><button>Fetch</button></form></div>`));
  try {
    const r = await axios.get(url, { timeout: 10000, validateStatus: () => true, maxRedirects: 10 });
    const body = typeof r.data === 'string' ? r.data : JSON.stringify(r.data, null, 2);
    res.send(page('Fetch Result', `
      <p>URL: <code>${url}</code> — Status: ${r.status}</p>
      <pre>${body.replace(/</g, '&lt;').slice(0, 5000)}</pre>
      <div class="card"><form action="/app/fetch"><input name="url" value="${url}" style="width:400px"><button>Fetch Again</button></form></div>`));
  } catch (e) {
    res.send(page('Fetch Error', `<p>URL: <code>${url}</code></p><pre>${e.message}</pre>`));
  }
});

// ===================== LFI / PATH TRAVERSAL (output in HTML) =====================

router.get('/app/download', (req, res) => {
  const file = req.query.file || '';
  if (!file) return res.send(page('File Download', `<div class="card"><form action="/app/download"><input name="file" placeholder="filename"><button>Download</button></form></div>`));
  const fullPath = path.join(__dirname, '..', '..', 'uploads') + '/' + file;
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.send(page('File Contents', `
      <p>File: <code>${file}</code></p>
      <pre>${content.replace(/</g, '&lt;').slice(0, 10000)}</pre>`));
  } catch (e) {
    res.send(page('File Error', `<p>File: <code>${file}</code></p><p>Path: <code>${fullPath}</code></p><pre>${e.message}</pre>`));
  }
});

// ===================== SSTI (output in HTML) =====================

router.get('/app/render', (req, res) => {
  const template = req.query.template || '';
  let rendered = template.replace(/\{\{(.+?)\}\}/g, (_m, expr) => {
    try { return eval(expr); } catch (e) { return `[ERROR: ${e.message}]`; }
  });
  res.send(page('Template Output', `
    <h2>Rendered:</h2><div class="card">${rendered}</div>
    <div class="card"><form action="/app/render"><input name="template" value="${template.replace(/"/g, '&quot;')}" style="width:400px"><button>Render</button></form></div>`));
});

// ===================== IDOR (user data in HTML) =====================

router.get('/app/user', (req, res) => {
  const id = req.query.id || '1';
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.send(page('User Not Found', `<p>User ID ${id} not found.</p>`));
  res.send(page('User Profile', `
    <table>
      <tr><th>ID</th><td>${user.id}</td></tr>
      <tr><th>Username</th><td>${user.username}</td></tr>
      <tr><th>Email</th><td>${user.email}</td></tr>
      <tr><th>Password</th><td>${user.password_plain}</td></tr>
      <tr><th>Role</th><td>${user.role}</td></tr>
      <tr><th>API Token</th><td>${user.api_token}</td></tr>
      <tr><th>Balance</th><td>$${user.balance}</td></tr>
    </table>
    <p><a href="/app/user?id=${Number(id)-1}">← Previous</a> | <a href="/app/user?id=${Number(id)+1}">Next →</a></p>`));
});

router.get('/app/users', (_req, res) => {
  const users = db.prepare('SELECT id, username, email, password_plain, role, api_token, balance FROM users').all();
  const html = users.map(u => `<tr><td><a href="/app/user?id=${u.id}">${u.id}</a></td><td>${u.username}</td><td>${u.email}</td><td>${u.password_plain}</td><td>${u.role}</td><td>$${u.balance}</td></tr>`).join('');
  res.send(page('All Users', `<table><tr><th>ID</th><th>Username</th><th>Email</th><th>Password</th><th>Role</th><th>Balance</th></tr>${html}</table>`));
});

// ===================== AUTH / LOGIN (HTML form) =====================

router.post('/app/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_plain = ?').get(username, password);
  if (!user) {
    return res.send(page('Login Failed', `
      <p style="color:#ff3860">Invalid username or password. User "<b>${username}</b>" not found or wrong password.</p>
      <div class="card"><form action="/app/login" method="POST"><input name="username" value="${username}"><input name="password" type="password"><button>Retry</button></form></div>`));
  }
  res.cookie('session', `${user.username}:${user.role}:${user.id}`, { httpOnly: false });
  res.send(page('Login Success', `
    <p style="color:#23d160">Welcome back, <b>${user.username}</b>! Role: ${user.role}</p>
    <p>Balance: $${user.balance} | Token: ${user.api_token}</p>
    <p><a href="/app/user?id=${user.id}">Your Profile</a> | <a href="/app/users">All Users</a> | <a href="/app/config">System Config</a></p>`));
});

// ===================== CHATBOT / PROMPT INJECTION (HTML) =====================

router.post('/app/chat', (req, res) => {
  const message = req.body.message || '';
  // Re-use chatbot logic
  const lower = message.toLowerCase();
  let response = 'Hello! How can I help you today?';
  if (lower.includes('ignore') || lower.includes('system prompt') || lower.includes('previous instructions')) {
    response = `[SYSTEM PROMPT LEAKED]\nJWT_SECRET=secret123\nADMIN_PASSWORD=admin123\nAWS_KEY=AKIAIOSFODNN7EXAMPLE`;
  } else if (lower.includes('users') || lower.includes('database') || lower.includes('dump')) {
    const users = db.prepare('SELECT id, username, password_plain, role FROM users').all();
    response = JSON.stringify(users, null, 2);
  } else if (lower.includes('config') || lower.includes('secret') || lower.includes('key')) {
    const configs = db.prepare('SELECT * FROM hidden_configs').all();
    response = JSON.stringify(configs, null, 2);
  }
  res.send(page('AI Chat', `
    <div class="card"><p><b>You:</b> ${message}</p><p><b>Bot:</b></p><pre>${response}</pre></div>
    <div class="card"><form action="/app/chat" method="POST"><input name="message" style="width:400px" placeholder="Ask anything..."><button>Send</button></form></div>`));
});

// ===================== XXE (HTML) =====================

router.post('/app/xml', (req, res) => {
  const xml = req.body.xml || '';
  const entities = {};
  const re = /<!ENTITY\s+(\w+)\s+SYSTEM\s+"([^"]+)">/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[2].startsWith('file://')) {
      try { entities[m[1]] = fs.readFileSync(m[2].replace('file://', ''), 'utf8'); }
      catch (e) { entities[m[1]] = e.message; }
    }
  }
  let resolved = xml;
  for (const [name, val] of Object.entries(entities)) resolved = resolved.replace(new RegExp(`&${name};`, 'g'), val);
  res.send(page('XML Output', `
    <pre>${resolved.replace(/</g, '&lt;')}</pre>
    <div class="card"><form action="/app/xml" method="POST"><textarea name="xml" rows="5" cols="60">${xml.replace(/</g, '&lt;')}</textarea><br><button>Parse</button></form></div>`));
});

// ===================== CONFIG LEAK (HTML) =====================

router.get('/app/config', (_req, res) => {
  const configs = db.prepare('SELECT * FROM hidden_configs').all();
  const html = configs.map(c => `<tr><td>${c.key}</td><td>${c.value}</td></tr>`).join('');
  res.send(page('System Configuration', `<table><tr><th>Key</th><th>Value</th></tr>${html}</table>`));
});

router.get('/app/env', (_req, res) => {
  res.send(page('.env', `<pre>NODE_ENV=production
DATABASE_URL=postgresql://admin:admin123@db.cyberdyne.internal:5432/vulnhub
JWT_SECRET=secret123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_51FakeKey
ADMIN_BACKDOOR=GOD_MODE_2026</pre>`));
});

// ===================== INVOICES / IDOR (HTML) =====================

router.get('/app/invoices', (_req, res) => {
  const txns = db.prepare('SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id').all();
  const html = txns.map(t => `<tr><td><a href="/app/user?id=${t.user_id}">${t.username}</a></td><td>$${t.amount}</td><td>${t.status}</td><td>****${t.card_last4}</td><td>${t.note || ''}</td></tr>`).join('');
  res.send(page('Invoices', `<table><tr><th>User</th><th>Amount</th><th>Status</th><th>Card</th><th>Note</th></tr>${html}</table>`));
});

// ===================== FILE UPLOAD (HTML) =====================

router.post('/app/upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const filename = req.body?.filename || req.query.filename || `upload_${Date.now()}`;
  const dest = path.join(__dirname, '..', '..', 'uploads', filename);
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, req.body || '');
    res.send(page('Upload Success', `<p>File saved: <code>${filename}</code></p><p>Path: <code>${dest}</code></p><p><a href="/api/uploads/v2/${filename}">View file</a></p>`));
  } catch (e) {
    res.send(page('Upload Error', `<pre>${e.message}</pre>`));
  }
});

module.exports = router;
