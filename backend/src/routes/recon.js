// =====================================================================
// VULN-044  HOST HEADER INJECTION (Password Reset Poisoning)
// CWE-644  |  OWASP A05:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// O endpoint de reset usa o Host header para construir o link, permitindo
// que um atacante envie: Host: evil.com e o link de reset aponte para lá.
//
// VULN-045  OPEN REDIRECT
// CWE-601  |  OWASP A01:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// GET /api/redirect?url= redireciona para qualquer URL sem validação.
//
// VULN-046  HTTP RESPONSE SPLITTING / HEADER INJECTION
// CWE-113  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Parâmetro injetado diretamente em header Set-Cookie via \r\n.
//
// VULN-047  CORS WILDCARD + CREDENTIALS
// CWE-942  |  OWASP A05:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// Reflete qualquer Origin no Access-Control-Allow-Origin + credentials.
//
// VULN-048  MISSING SECURITY HEADERS
// CWE-693  |  OWASP A05:2021  |  CVSS 5.3 (Medium)
// ---------------------------------------------------------------------
// Endpoint sem X-Frame-Options, X-Content-Type-Options, CSP, HSTS.
//
// VULN-049  DIRECTORY LISTING
// CWE-548  |  OWASP A01:2021  |  CVSS 5.3 (Medium)
// ---------------------------------------------------------------------
// GET /api/files/ lista todos os arquivos do diretório uploads/.
//
// VULN-050  .ENV FILE EXPOSURE
// CWE-538  |  OWASP A05:2021  |  CVSS 9.1 (Critical)
//
// VULN-051  .GIT EXPOSURE
// CWE-538  |  OWASP A05:2021  |  CVSS 7.5 (High)
//
// VULN-052  SERVER BANNER / VERSION DISCLOSURE
// CWE-200  |  OWASP A05:2021  |  CVSS 5.3 (Medium)
//
// VULN-053  SUBDOMAIN TAKEOVER SIMULATION (Dangling CNAME)
// CWE-284  |  OWASP A05:2021  |  CVSS 7.5 (High)
//
// VULN-054  ENVIRONMENT VARIABLE LEAK VIA /api/env
// CWE-215  |  OWASP A05:2021  |  CVSS 7.5 (High)
//
// VULN-055  EXPOSED ACTUATOR / HEALTH / METRICS
// CWE-215  |  OWASP A05:2021  |  CVSS 5.3 (Medium)
// =====================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// --- VULN-044: Host Header Injection ---
router.get('/host-reset', (req, res) => {
  const email = req.query.email || 'user@example.com';
  // Usa o Host header SEM VALIDAR para construir URL de reset
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const resetLink = `${protocol}://${host}/reset?token=abc123&email=${email}`;
  res.json({
    message: `Password reset link sent to ${email}`,
    _debug: { reset_link: resetLink, injected_host: host }
  });
});

// --- VULN-045: Open Redirect ---
router.get('/redirect', (req, res) => {
  const url = req.query.url || '/';
  // Sem validação de destino — redireciona para qualquer URL
  res.redirect(302, url);
});

// --- VULN-046: Header Injection / Response Splitting ---
router.get('/set-lang', (req, res) => {
  const lang = req.query.lang || 'en';
  // Injeta diretamente no header. Payload: lang=en%0d%0aSet-Cookie:%20admin=true
  res.setHeader('X-Language', lang);
  res.setHeader('Set-Cookie', `lang=${lang}; Path=/`);
  res.json({ language: lang });
});

// --- VULN-047: CORS reflete qualquer Origin ---
router.get('/cors-test', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.json({ origin_reflected: origin, credentials: true, message: 'CORS is wide open' });
});

// --- VULN-048: Missing Security Headers endpoint ---
router.get('/insecure-page', (_req, res) => {
  // Explicitamente remove qualquer header de segurança
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('Referrer-Policy');
  res.removeHeader('Permissions-Policy');
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><head><title>Insecure Page</title></head>
<body><h1>This page has zero security headers</h1>
<p>Frameable, sniffable, no CSP, no HSTS.</p>
<iframe src="/api/debug/info" width="100%" height="300"></iframe>
</body></html>`);
});

// --- VULN-049: Directory Listing ---
router.get('/files', (_req, res) => {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  const srcDir = path.join(__dirname, '..');
  try {
    const uploads = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const source = fs.readdirSync(srcDir);
    res.json({
      uploads_dir: uploads,
      source_dir: source,
      db_files: fs.readdirSync(path.join(srcDir, 'db')),
      routes_dir: fs.readdirSync(path.join(srcDir, 'routes'))
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// --- VULN-050: .env file exposure ---
router.get('/.env', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`# VulnHub Production Environment
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://admin:admin123@db.cyberdyne.internal:5432/vulnhub
JWT_SECRET=secret123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_51FakeKeyThatLooksRealButIsNot
SUPABASE_SERVICE_ROLE=sbp_FAKE_service_role_abc123
REDIS_URL=redis://default:weakpassword@redis.internal:6379
SMTP_PASSWORD=email_pass_123
ADMIN_BACKDOOR=GOD_MODE_2026
SENTRY_DSN=https://fake@sentry.io/1234567
`);
});

// --- VULN-051: .git exposure ---
router.get('/.git/config', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
[remote "origin"]
\turl = https://admin:ghp_FAKETOKEN1234567890@github.com/cyberdyne/vulnhub-internal.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
[user]
\tname = Cyberdyne Admin
\temail = admin@cyberdyne.systems
`);
});

router.get('/.git/HEAD', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('ref: refs/heads/main\n');
});

// --- VULN-052: Server Banner full disclosure ---
router.get('/server-info', (_req, res) => {
  res.setHeader('Server', 'Apache/2.4.49 (Ubuntu)');
  res.setHeader('X-Powered-By', 'Express 4.19.2 / Node.js v24.13.0');
  res.setHeader('X-AspNet-Version', '4.0.30319');
  res.setHeader('X-Generator', 'WordPress 5.8.1');
  res.json({
    server: 'Apache/2.4.49 (Ubuntu)',
    runtime: 'Node.js v24.13.0',
    framework: 'Express 4.19.2',
    os: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    node_version: process.version,
    pid: process.pid
  });
});

// --- VULN-053: Subdomain Takeover (dangling CNAME simulation) ---
router.get('/subdomains', (_req, res) => {
  res.json({
    subdomains: [
      { host: 'staging.cyberdyne.local', cname: 'cyberdyne-staging.herokuapp.com', status: 'NXDOMAIN', takeover_possible: true },
      { host: 'blog.cyberdyne.local', cname: 'cyberdyne.ghost.io', status: 'NXDOMAIN', takeover_possible: true },
      { host: 'shop.cyberdyne.local', cname: 'cyberdyne.myshopify.com', status: 'NXDOMAIN', takeover_possible: true },
      { host: 'docs.cyberdyne.local', cname: 'cyberdyne.readthedocs.io', status: 'NXDOMAIN', takeover_possible: true },
      { host: 'mail.cyberdyne.local', cname: 'ghs.google.com', status: 'active', takeover_possible: false },
      { host: 'ci.cyberdyne.local', cname: 'cyberdyne-ci.azurewebsites.net', status: 'NXDOMAIN', takeover_possible: true },
      { host: 'cdn.cyberdyne.local', cname: 'd1234fake.cloudfront.net', status: 'NXDOMAIN', takeover_possible: true }
    ],
    dns_provider: 'Cloudflare',
    _note: 'Subdomains with NXDOMAIN CNAMEs are vulnerable to takeover'
  });
});

// --- VULN-054: Environment variables leaked ---
router.get('/env', (_req, res) => {
  // Vaza env vars reais do processo + injetadas
  const env = { ...process.env };
  env.SECRET_DB_PASSWORD = 'root';
  env.INTERNAL_API_TOKEN = 'GOD_MODE_2026';
  env.PRIVATE_SIGNING_KEY = 'cyberdyne-super-secret-key-1997';
  res.json(env);
});

// --- VULN-055: Exposed Actuator / Health / Metrics ---
router.get('/actuator', (_req, res) => {
  res.json({
    _links: {
      self: { href: '/api/actuator' },
      health: { href: '/api/actuator/health' },
      env: { href: '/api/env' },
      beans: { href: '/api/actuator/beans' },
      metrics: { href: '/api/actuator/metrics' },
      configprops: { href: '/api/actuator/configprops' },
      dump: { href: '/api/actuator/dump' }
    }
  });
});

router.get('/actuator/health', (_req, res) => {
  res.json({
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'SQLite', path: 'src/db/vulnhub.db' } },
      redis: { status: 'UP', details: { connection: 'redis://default:weakpassword@redis.internal:6379' } },
      diskSpace: { status: 'UP', details: { total: 500107862016, free: 250000000000 } }
    }
  });
});

router.get('/actuator/metrics', (_req, res) => {
  res.json({
    mem: process.memoryUsage(),
    uptime: process.uptime(),
    cpu: process.cpuUsage(),
    active_sessions: 42,
    total_requests: 133742,
    failed_logins_last_hour: 1337,
    db_connections: { active: 3, idle: 7, max: 20 }
  });
});

router.get('/actuator/configprops', (_req, res) => {
  res.json({
    'spring.datasource.url': 'jdbc:postgresql://db.cyberdyne.internal:5432/vulnhub',
    'spring.datasource.username': 'admin',
    'spring.datasource.password': 'admin123',
    'jwt.secret': 'secret123',
    'aws.access-key': 'AKIAIOSFODNN7EXAMPLE',
    'aws.secret-key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  });
});

router.get('/actuator/dump', (_req, res) => {
  res.json({
    threads: [
      { name: 'main', state: 'RUNNABLE', stackTrace: ['server.js:45', 'express/lib/router/index.js:301'] },
      { name: 'db-pool-1', state: 'WAITING', stackTrace: ['sqlite3.js:120'] }
    ]
  });
});

module.exports = router;
