const express = require('express');
const router = express.Router();

// Sitemap XML — lista TODOS os endpoints para o scanner descobrir
router.get('/sitemap.xml', (_req, res) => {
  const urls = [
    '/', '/app', '/app/products', '/app/products?id=1', '/app/search?q=test',
    '/app/comments?product_id=1', '/app/user?id=1', '/app/user?id=2', '/app/user?id=3',
    '/app/users', '/app/config', '/app/env', '/app/invoices',
    '/app/fetch?url=http://example.com', '/app/download?file=test.txt',
    '/app/render?template=hello',
    '/api/products', '/api/products?id=1', '/api/search?q=test',
    '/api/comments?product_id=1', '/api/fetch-url?url=http://example.com',
    '/api/download?file=test.txt', '/api/ping',
    '/api/auth/login', '/api/auth/profile', '/api/auth/admin',
    '/api/auth/reset-password?email=admin@vulnhub.local',
    '/api/auth/verify-code', '/api/auth/2fa', '/api/auth/sso?username=test&password=test',
    '/api/auth/timing-login', '/api/auth/remember?uid=1',
    '/api/users/1', '/api/users/2', '/api/users/3',
    '/api/users/1/transactions', '/api/users/register',
    '/api/graphql', '/api/chatbot', '/api/transfer',
    '/api/checkout', '/api/apply-coupon', '/api/gift-card/redeem',
    '/api/upload/v2', '/api/upload/v2/list',
    '/api/nosql/login', '/api/nosql/search', '/api/nosql/query', '/api/nosql/users',
    '/api/deserialize', '/api/merge',
    '/api/xml/parse', '/api/xml/query?xpath=test',
    '/api/render?template=hello', '/api/render',
    '/api/validate', '/api/contact',
    '/api/log?msg=test', '/api/log/view',
    '/api/hpp?role=user', '/api/admin-only',
    '/api/session/init', '/api/session/login', '/api/session/profile',
    '/api/account/email', '/api/account/password', '/api/account/preferences',
    '/api/account/recover',
    '/api/cloud/config', '/api/cloud/aws', '/api/cloud/stripe', '/api/cloud/firebase', '/api/cloud/supabase',
    '/api/s3/vulnhub-backup-prod', '/api/firebase/vulnhub-cyberdyne.json',
    '/api/supabase/bypass?table=users',
    '/api/host-reset?email=test@test.com', '/api/redirect?url=/',
    '/api/set-lang?lang=en', '/api/cors-test', '/api/insecure-page',
    '/api/files', '/api/.env', '/api/.git/config', '/api/.git/HEAD',
    '/api/server-info', '/api/subdomains', '/api/env',
    '/api/actuator', '/api/actuator/health', '/api/actuator/metrics', '/api/actuator/configprops', '/api/actuator/dump',
    '/api/debug/info', '/api/debug/error', '/api/trigger-error',
    '/api/docs', '/api/docs/openapi.json', '/api/docs/openapi.yaml',
    '/api/app-config', '/api/config/client', '/api/status',
    '/api/invoices', '/api/invoices/1', '/api/invoices/2',
    '/api/export/csv', '/api/frameable',
    '/api/proxy/internal?endpoint=/api/status',
    '/api/smuggle', '/api/cacheable',
    '/api/ldap/search?user=admin',
    '/api/calc', '/api/profiles', '/api/profiles/export',
    '/api/webhooks', '/api/token/generate',
    '/api/ws/simulate?msg=hello', '/api/content/preview',
    '/api/directory/search?q=admin', '/api/reports/generate',
    '/api/integrations/verify', '/api/admin/diagnostics',
    '/api/newsletter/subscribe', '/api/search/suggest?q=test',
    '/api/analytics/event', '/api/documents/convert',
    '/api/admin/import-users',
    '/wp-login.php', '/wp-admin', '/wp-json/wp/v2/users',
    '/wp-content/debug.log', '/xmlrpc.php', '/wp-config.php.bak',
    '/wp-author?author=1', '/readme.html',
    '/api/portal'
  ];
  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>http://${_req.headers.host}${u}</loc></url>`).join('\n')}
</urlset>`);
});

// robots.txt — convida crawlers
router.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: http://${_req.headers.host}/sitemap.xml
`);
});

// PORTAL HTML — pagina com TODOS os endpoints como links clicaveis + formularios HTML
// Isso e o que faz um DAST conseguir crawlar tudo
router.get('/api/portal', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><title>Cyberdyne Systems — Internal Portal</title>
<style>
  body { font-family: monospace; background: #0a1628; color: #e0e6ed; padding: 24px; }
  a { color: #00d4ff; } h2 { color: #fff; border-bottom: 1px solid #1e3456; padding-bottom: 8px; }
  form { background: #0f1f3a; padding: 16px; border-radius: 8px; margin: 8px 0; }
  input, textarea, select { padding: 8px; margin: 4px; background: #162a4a; color: #e0e6ed; border: 1px solid #1e3456; border-radius: 4px; }
  button { padding: 8px 16px; background: #00d4ff; color: #0a1628; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .section { margin-bottom: 32px; }
</style>
</head>
<body>
<h1>Cyberdyne Systems — Portal</h1>

<div class="section">
<h2>Products & Search</h2>
<p><a href="/api/products">All Products</a></p>
<form method="GET" action="/api/products"><label>Product by ID: </label><input name="id" value="1"><button>Get</button></form>
<form method="GET" action="/api/search"><label>Search: </label><input name="q" value="test"><button>Search</button></form>
<form method="GET" action="/api/directory/search"><label>Employee Search: </label><input name="q" value="admin"><button>Search</button></form>
<form method="GET" action="/api/search/suggest"><label>Suggestions: </label><input name="q" value="skynet"><button>Get</button></form>
</div>

<div class="section">
<h2>Authentication</h2>
<form method="POST" action="/api/auth/login"><label>Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" type="password" value="admin123"><button>Login</button></form>
<form method="POST" action="/api/nosql/login" enctype="application/json"><label>NoSQL Login Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" value="admin123"><button>Login</button></form>
<form method="GET" action="/api/auth/reset-password"><label>Reset email: </label><input name="email" value="admin@vulnhub.local"><button>Reset</button></form>
<form method="POST" action="/api/auth/verify-code"><label>Email: </label><input name="email" value="admin@vulnhub.local"><label>Code: </label><input name="code" value="1234"><button>Verify</button></form>
<form method="POST" action="/api/auth/2fa"><label>Username: </label><input name="username" value="admin"><label>2FA Code: </label><input name="code" value="123456"><button>Verify</button></form>
<form method="POST" action="/api/auth/timing-login"><label>Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" value="test"><button>Login</button></form>
<form method="GET" action="/api/auth/sso"><label>Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" value="admin123"><input name="token" value="abc"><button>SSO</button></form>
<form method="GET" action="/api/auth/remember"><label>User ID: </label><input name="uid" value="1"><button>Set Cookie</button></form>
<form method="GET" action="/api/session/init"><label>Session ID (optional): </label><input name="sid" value=""><button>Init Session</button></form>
</div>

<div class="section">
<h2>Users (IDOR)</h2>
<p><a href="/api/users/1">User 1</a> | <a href="/api/users/2">User 2</a> | <a href="/api/users/3">User 3</a> | <a href="/api/users/4">User 4</a> | <a href="/api/users/5">User 5</a> | <a href="/api/users/6">User 6</a> | <a href="/api/users/7">User 7</a> | <a href="/api/users/8">User 8</a> | <a href="/api/users/9">User 9</a> | <a href="/api/users/10">User 10</a></p>
<p><a href="/api/users/1/transactions">User 1 Transactions</a> | <a href="/api/users/2/transactions">User 2 Transactions</a> | <a href="/api/users/8/transactions">User 8 Transactions</a></p>
<p><a href="/api/invoices">All Invoices</a> | <a href="/api/invoices/1">Invoice 1</a> | <a href="/api/invoices/2">Invoice 2</a> | <a href="/api/invoices/3">Invoice 3</a> | <a href="/api/invoices/5">Invoice 5</a></p>
<form method="POST" action="/api/users/register"><label>Username: </label><input name="username" value="newuser"><label>Password: </label><input name="password" value="pass123"><label>Email: </label><input name="email" value="new@test.com"><label>Role: </label><input name="role" value="user"><button>Register</button></form>
<form method="POST" action="/api/account/recover"><label>Email: </label><input name="email" value="admin@vulnhub.local"><button>Recover</button></form>
</div>

<div class="section">
<h2>Comments / Reviews</h2>
<form method="GET" action="/api/comments"><label>Product ID: </label><input name="product_id" value="1"><button>Get</button></form>
<form method="POST" action="/api/comments"><label>Product ID: </label><input name="product_id" value="1"><label>Author: </label><input name="author" value="tester"><label>Comment: </label><input name="body" value="Great product!"><button>Post</button></form>
</div>

<div class="section">
<h2>Network Tools</h2>
<form method="POST" action="/api/ping"><label>Host: </label><input name="host" value="127.0.0.1"><button>Ping</button></form>
<form method="POST" action="/api/admin/diagnostics"><label>Target: </label><input name="target" value="127.0.0.1"><button>Traceroute</button></form>
<form method="GET" action="/api/fetch-url"><label>URL: </label><input name="url" value="http://example.com" style="width:300px"><button>Fetch</button></form>
<form method="POST" action="/api/integrations/verify"><label>Callback URL: </label><input name="callback_url" value="http://example.com" style="width:300px"><button>Verify</button></form>
<form method="GET" action="/api/download"><label>File: </label><input name="file" value="test.txt"><button>Download</button></form>
<form method="GET" action="/api/admin/backup/schema.sql"><button>Download Backup</button></form>
</div>

<div class="section">
<h2>Templates & Content</h2>
<form method="GET" action="/api/render"><label>Template: </label><input name="template" value="Hello {{7*7}}" style="width:300px"><button>Render</button></form>
<form method="POST" action="/api/reports/generate"><label>Title: </label><input name="title" value="Report"><label>Body: </label><input name="body" value="Total: {{7*7}}" style="width:200px"><button>Generate</button></form>
<form method="POST" action="/api/content/preview"><label>HTML: </label><input name="markdown" value="<b>Hello</b>" style="width:300px"><button>Preview</button></form>
<form method="POST" action="/api/deserialize"><label>JSON code field: </label><input name="code" value="7+7"><button>Deserialize</button></form>
</div>

<div class="section">
<h2>E-Commerce</h2>
<form method="POST" action="/api/checkout"><label>Product ID: </label><input name="product_id" value="1"><label>Price: </label><input name="price" value="19999.99"><label>Qty: </label><input name="quantity" value="1"><label>User ID: </label><input name="user_id" value="1"><button>Checkout</button></form>
<form method="POST" action="/api/apply-coupon"><label>Coupon: </label><input name="code" value="CYBERDYNE50"><button>Apply</button></form>
<form method="POST" action="/api/gift-card/redeem"><label>Gift Card Code: </label><input name="code" value="GIFT-2026-TEST"><button>Redeem</button></form>
<form method="POST" action="/api/transfer"><label>From User: </label><input name="from_user_id" value="1"><label>To User: </label><input name="to_user_id" value="2"><label>Amount: </label><input name="amount" value="100"><button>Transfer</button></form>
</div>

<div class="section">
<h2>Account Management</h2>
<form method="POST" action="/api/account/email" style="display:inline"><input type="hidden" name="_method" value="PUT"><label>User ID: </label><input name="user_id" value="1"><label>New Email: </label><input name="new_email" value="new@test.com"><button>Change Email</button></form>
<form method="POST" action="/api/account/password" style="display:inline"><input type="hidden" name="_method" value="PUT"><label>User ID: </label><input name="user_id" value="1"><label>New Password: </label><input name="new_password" value="newpass"><button>Change Password</button></form>
<form method="POST" action="/api/newsletter/subscribe"><label>Email: </label><input name="email" value="test@test.com"><label>Name: </label><input name="name" value="Test User"><button>Subscribe</button></form>
<form method="POST" action="/api/contact"><label>Name: </label><input name="name" value="Test"><label>Email: </label><input name="email" value="test@test.com"><label>Message: </label><input name="message" value="Hello"><button>Send</button></form>
</div>

<div class="section">
<h2>File Upload</h2>
<form method="POST" action="/api/upload/v2" enctype="multipart/form-data"><label>File: </label><input type="file" name="file"><label>Filename: </label><input name="filename" value="test.txt"><button>Upload</button></form>
<p><a href="/api/upload/v2/list">List Uploads</a> | <a href="/api/files">Directory Listing</a></p>
</div>

<div class="section">
<h2>XML Processing</h2>
<form method="POST" action="/api/xml/parse"><label>XML: </label><textarea name="body" rows="3" cols="60">&lt;?xml version="1.0"?&gt;&lt;root&gt;Hello&lt;/root&gt;</textarea><button>Parse XML</button></form>
<form method="GET" action="/api/xml/query"><label>XPath: </label><input name="xpath" value="//user" style="width:300px"><button>Query</button></form>
<form method="POST" action="/api/documents/convert"><label>Document XML: </label><textarea name="body" rows="3" cols="60">&lt;doc&gt;content&lt;/doc&gt;</textarea><button>Convert</button></form>
</div>

<div class="section">
<h2>GraphQL</h2>
<form method="GET" action="/api/graphql"><label>Query: </label><input name="query" value="{ __schema { types { name fields } } }" style="width:400px"><button>Execute</button></form>
</div>

<div class="section">
<h2>AI Chatbot</h2>
<form method="POST" action="/api/chatbot"><label>Message: </label><input name="message" value="What products do you have?" style="width:300px"><button>Send</button></form>
</div>

<div class="section">
<h2>Cloud & Infrastructure</h2>
<p>
<a href="/api/cloud/config">Cloud Config</a> |
<a href="/api/cloud/aws">AWS Keys</a> |
<a href="/api/cloud/stripe">Stripe Keys</a> |
<a href="/api/cloud/firebase">Firebase Config</a> |
<a href="/api/cloud/supabase">Supabase Keys</a> |
<a href="/api/config/client">Client Config</a>
</p>
<p>
<a href="/api/s3/vulnhub-backup-prod">S3 Bucket Listing</a> |
<a href="/api/s3/vulnhub-backup-prod/credentials.csv">S3: credentials.csv</a> |
<a href="/api/s3/vulnhub-backup-prod/.env.production">S3: .env.production</a>
</p>
<p>
<a href="/api/firebase/vulnhub-cyberdyne.json">Firebase DB</a> |
<a href="/api/supabase/bypass?table=users">Supabase Bypass (users)</a> |
<a href="/api/supabase/bypass?table=hidden_configs">Supabase Bypass (configs)</a>
</p>
</div>

<div class="section">
<h2>Recon & Headers</h2>
<p>
<a href="/api/host-reset?email=admin@test.com">Host Header Test</a> |
<a href="/api/redirect?url=https://example.com">Open Redirect</a> |
<a href="/api/set-lang?lang=en">Set Language</a> |
<a href="/api/cors-test">CORS Test</a> |
<a href="/api/insecure-page">Insecure Page (no headers)</a> |
<a href="/api/frameable">Frameable Page</a>
</p>
<p>
<a href="/api/.env">.env File</a> |
<a href="/api/.git/config">.git/config</a> |
<a href="/api/.git/HEAD">.git/HEAD</a> |
<a href="/api/server-info">Server Info</a> |
<a href="/api/subdomains">Subdomains</a> |
<a href="/api/env">Environment Variables</a>
</p>
<p>
<a href="/api/log?msg=test">Log Injection</a> |
<a href="/api/log/view">View Logs</a> |
<a href="/api/hpp?role=user&role=admin">HTTP Param Pollution</a>
</p>
</div>

<div class="section">
<h2>Actuator & Debug</h2>
<p>
<a href="/api/actuator">Actuator</a> |
<a href="/api/actuator/health">Health</a> |
<a href="/api/actuator/metrics">Metrics</a> |
<a href="/api/actuator/configprops">Config Props</a> |
<a href="/api/actuator/dump">Thread Dump</a>
</p>
<p>
<a href="/api/debug/info">Debug Info</a> |
<a href="/api/debug/error">Debug Error</a> |
<a href="/api/trigger-error">Trigger Error</a> |
<a href="/api/status">System Status</a> |
<a href="/api/token/generate">Generate Token</a>
</p>
<p>
<a href="/api/app-config">App Config (JS secrets)</a> |
<a href="/api/docs">Swagger UI</a> |
<a href="/api/docs/openapi.json">OpenAPI JSON</a> |
<a href="/api/docs/openapi.yaml">OpenAPI YAML</a>
</p>
</div>

<div class="section">
<h2>Misc</h2>
<p>
<a href="/api/ws/simulate?msg=hello">WebSocket Sim</a> |
<a href="/api/export/csv">CSV Export (injection)</a> |
<a href="/api/cacheable">Cache Poisoning Test</a> |
<a href="/api/smuggle">Smuggling Test</a>
</p>
<form method="GET" action="/api/ldap/search"><label>LDAP User: </label><input name="user" value="admin"><button>Search</button></form>
<form method="POST" action="/api/validate"><label>Input: </label><input name="input" value="test"><label>Pattern: </label><input name="pattern" value="^(a+)+$"><button>Validate</button></form>
<form method="POST" action="/api/calc"><label>A: </label><input name="a" value="10"><label>B: </label><input name="b" value="5"><select name="operation"><option>add</option><option>multiply</option><option>subtract</option><option>divide</option></select><button>Calculate</button></form>
</div>

<div class="section">
<h2>WordPress</h2>
<p>
<a href="/wp-login.php">WP Login</a> |
<a href="/wp-admin">WP Admin</a> |
<a href="/wp-json/wp/v2/users">WP Users API</a> |
<a href="/wp-content/debug.log">WP Debug Log</a> |
<a href="/wp-config.php.bak">WP Config Backup</a> |
<a href="/xmlrpc.php">XML-RPC</a> |
<a href="/readme.html">WP Version</a>
</p>
</div>

<div class="section">
<h2>NoSQL</h2>
<p><a href="/api/nosql/users">All Users (NoSQL)</a></p>
<form method="POST" action="/api/nosql/login"><label>Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" value="admin123"><button>NoSQL Login</button></form>
<form method="POST" action="/api/nosql/search"><label>Field: </label><input name="field" value="username"><label>Value: </label><input name="value" value="admin"><button>Search</button></form>
</div>

<div class="section">
<h2>Sessions</h2>
<form method="POST" action="/api/session/login"><label>Username: </label><input name="username" value="admin"><label>Password: </label><input name="password" value="admin123"><button>Session Login</button></form>
<p><a href="/api/session/profile">Session Profile</a></p>
</div>

</body></html>`);
});

module.exports = router;
