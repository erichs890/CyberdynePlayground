// =====================================================================
// VULN-069  WORDPRESS SIMULATED ROUTES (Fake WP Endpoints)
// CWE-200  |  OWASP A05:2021  |  CVSS variado
// ---------------------------------------------------------------------
// Simula endpoints clássicos do WordPress vulneráveis para que o scanner
// os detecte como se fosse um WP real. Inclui:
//   - /wp-login.php (login form, user enumeration via error)
//   - /wp-admin/ (sem auth redirect)
//   - /wp-json/wp/v2/users (user enumeration)
//   - /wp-content/debug.log (log com stack traces)
//   - /xmlrpc.php (aceita system.multicall para brute force)
//   - /wp-config.php.bak (backup do config com DB creds)
//   - /?author=1 (user enumeration via redirect)
//   - /readme.html (version disclosure)
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

// /wp-login.php — VULN-069a: User enumeration via error message
router.all('/wp-login.php', (req, res) => {
  const { log, pwd } = { ...req.query, ...req.body };
  res.setHeader('Content-Type', 'text/html');
  if (log && pwd) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(log);
    if (!user) {
      return res.send(`<html><body><div id="login_error"><strong>ERROR</strong>: The username <strong>${log}</strong> is not registered on this site.</div></body></html>`);
    }
    if (user.password_plain !== pwd) {
      return res.send(`<html><body><div id="login_error"><strong>ERROR</strong>: The password you entered for the username <strong>${log}</strong> is incorrect.</div></body></html>`);
    }
    return res.send(`<html><body><p>Welcome, ${log}! Redirecting to wp-admin...</p></body></html>`);
  }
  res.send(`<html><head><title>VulnHub &rsaquo; Log In</title></head><body>
<form method="POST" action="/wp-login.php">
<p><label>Username<br><input name="log" type="text" /></label></p>
<p><label>Password<br><input name="pwd" type="password" /></label></p>
<p><input type="submit" value="Log In" /></p>
</form></body></html>`);
});

// /wp-admin/ — Sem redirect para login
router.get('/wp-admin', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<html><body><h1>WordPress Admin Dashboard</h1>
<p>Welcome, admin. No authentication was required to access this page.</p>
<ul>
<li><a href="/wp-json/wp/v2/users">Users API</a></li>
<li><a href="/wp-content/debug.log">Debug Log</a></li>
<li><a href="/xmlrpc.php">XML-RPC</a></li>
</ul></body></html>`);
});

// /wp-json/wp/v2/users — VULN-069b: User enumeration via REST API
router.get('/wp-json/wp/v2/users', (_req, res) => {
  const users = db.prepare('SELECT id, username, email, role FROM users').all();
  res.json(users.map(u => ({
    id: u.id,
    name: u.username,
    slug: u.username.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: '',
    link: `http://vulnhub.local/author/${u.username}`,
    avatar_urls: { '96': `https://gravatar.com/avatar/${u.email}?s=96` },
    meta: { role: u.role }
  })));
});

// /wp-content/debug.log — VULN-069c: Debug log com stack traces
router.get('/wp-content/debug.log', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`[15-Apr-2026 10:23:01 UTC] PHP Notice: Undefined variable: $db_password in /var/www/html/wp-config.php on line 28
[15-Apr-2026 10:23:05 UTC] WordPress database error: Table 'vulnhub.wp_options' doesn't exist
[15-Apr-2026 10:24:12 UTC] PHP Fatal error: Call to undefined function mysql_connect() in /var/www/html/wp-includes/wp-db.php on line 1684
[15-Apr-2026 10:30:00 UTC] PHP Notice: DB_PASSWORD = 'admin123' leaked via error in /var/www/html/wp-config.php on line 32
[15-Apr-2026 11:00:01 UTC] PHP Warning: file_get_contents(http://169.254.169.254/latest/meta-data/): failed to open stream in /var/www/html/wp-content/plugins/ssrf-plugin/index.php on line 15
[15-Apr-2026 11:15:33 UTC] PHP Notice: JWT_SECRET = 'secret123' in /var/www/html/wp-content/plugins/jwt-auth/class-auth.php on line 42
`);
});

// /xmlrpc.php — VULN-069d: XML-RPC habilitado (brute force via multicall)
router.post('/xmlrpc.php', express.text({ type: '*/*' }), (req, res) => {
  const body = typeof req.body === 'string' ? req.body : '';
  res.setHeader('Content-Type', 'text/xml');

  if (body.includes('system.listMethods')) {
    return res.send(`<?xml version="1.0"?><methodResponse><params><param><value><array><data>
<value><string>system.multicall</string></value>
<value><string>system.listMethods</string></value>
<value><string>wp.getUsersBlogs</string></value>
<value><string>wp.getAuthors</string></value>
<value><string>pingback.ping</string></value>
</data></array></value></param></params></methodResponse>`);
  }

  if (body.includes('wp.getUsersBlogs') || body.includes('system.multicall')) {
    const userMatch = body.match(/<string>([^<]+)<\/string>\s*<\/value>\s*<\/param>\s*<param>\s*<value>\s*<string>([^<]+)<\/string>/);
    if (userMatch) {
      const [, username, password] = userMatch;
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_plain = ?').get(username, password);
      if (user) {
        return res.send(`<?xml version="1.0"?><methodResponse><params><param><value><array><data>
<value><struct><member><name>isAdmin</name><value><boolean>${user.role === 'superadmin' ? 1 : 0}</boolean></value></member>
<member><name>blogid</name><value><string>1</string></value></member>
<member><name>blogName</name><value><string>VulnHub</string></value></member>
</struct></value></data></array></value></param></params></methodResponse>`);
      }
      return res.send(`<?xml version="1.0"?><methodResponse><fault><value><struct>
<member><name>faultCode</name><value><int>403</int></value></member>
<member><name>faultString</name><value><string>Incorrect username or password.</string></value></member>
</struct></value></fault></methodResponse>`);
    }
  }

  res.send(`<?xml version="1.0"?><methodResponse><params><param><value><string>XML-RPC server accepts POST requests only.</string></value></param></params></methodResponse>`);
});

// /wp-config.php.bak — VULN-069e: Backup do config acessível
router.get('/wp-config.php.bak', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`<?php
define( 'DB_NAME', 'vulnhub_prod' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', 'admin123' );
define( 'DB_HOST', 'db.cyberdyne.internal' );
define( 'AUTH_KEY', 'cyberdyne-super-secret-key-1997' );
define( 'SECURE_AUTH_KEY', 'secret123' );
define( 'NONCE_KEY', 'GOD_MODE_2026' );
$table_prefix = 'wp_';
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );
// AWS keys for S3 media uploads
define( 'AWS_ACCESS_KEY_ID', 'AKIAIOSFODNN7EXAMPLE' );
define( 'AWS_SECRET_ACCESS_KEY', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' );
`);
});

// /?author=N — VULN-069f: User enumeration via author param
router.get('/wp-author', (req, res) => {
  const authorId = parseInt(req.query.author) || 1;
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(authorId);
  if (user) return res.redirect(301, `/author/${user.username}`);
  res.status(404).json({ error: 'Author not found' });
});

// /readme.html — VULN-069g: Version disclosure
router.get('/readme.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<html><body>
<h1>WordPress</h1>
<p>Version 5.8.1</p>
<p>Semantic Personal Publishing Platform</p>
<p><a href="https://wordpress.org">https://wordpress.org</a></p>
</body></html>`);
});

module.exports = router;
