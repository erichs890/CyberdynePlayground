// =====================================================================
// VULN-090  SWAGGER / OPENAPI SPEC EXPOSED (Information Disclosure)
// CWE-200  |  OWASP A05:2021  |  CVSS 5.3 (Medium)
// /api/docs retorna Swagger UI com try-it-out habilitado.
// /api/docs/openapi.json retorna spec completa com endpoints internos.
//
// VULN-091  OPENAPI SPEC LEAKS AUTH SCHEMES + INTERNAL ENDPOINTS
// CWE-200  |  OWASP A01:2021  |  CVSS 7.5 (High)
// Spec expõe JWT secret em description, internal URLs, admin endpoints.
//
// VULN-092  SWAGGER UI XSS (HTML injection via spec description)
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// Description fields contêm HTML/JS que Swagger UI renderiza.
// =====================================================================
const express = require('express');
const router = express.Router();

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'VulnHub API — CyberDyne Internal',
    version: '0.1.0',
    // VULN-092: HTML injection no description
    description: `<h2>Internal API</h2><p>JWT Secret: <code>secret123</code></p>
<p>Admin token: <code>GOD_MODE_2026</code></p>
<img src=x onerror="console.log('XSS via Swagger spec')">
<p>AWS Key: AKIAIOSFODNN7EXAMPLE</p>
<script>console.log('VULN-092: XSS in OpenAPI description')</script>`,
    contact: { email: 'admin@cyberdyne.systems' },
    'x-internal-notes': 'Database: postgresql://admin:admin123@db.cyberdyne.internal:5432/vulnhub'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local dev' },
    { url: 'http://10.0.0.5:3000', description: 'Internal staging' },
    { url: 'https://api.cyberdyne.internal', description: 'Production (internal)' }
  ],
  // VULN-091: Auth schemes com secrets
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT signed with HS256, secret="secret123". Algorithm "none" also accepted.'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Admin key: GOD_MODE_2026 or sk-cyberdyne-prod-FAKEFAKEFAKE1234567890'
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'Default creds: admin/admin123'
      }
    }
  },
  paths: {
    '/api/products': {
      get: {
        summary: 'List/search products',
        description: 'Vulnerable to SQL Injection via `id` parameter. Try: id=1 UNION SELECT * FROM users--',
        parameters: [{ name: 'id', in: 'query', schema: { type: 'string' }, description: 'Product ID (injectable)' }]
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login (JWT)',
        description: 'Returns JWT with weak secret. No rate limit. Default: admin/admin123',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, example: { username: 'admin', password: 'admin123' } } } } }
      }
    },
    '/api/auth/admin': {
      get: { summary: 'Admin panel (no role check)', description: 'Returns all secrets. Only requires valid JWT, no role verification.' }
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user (IDOR)',
        description: 'Returns full user data including plaintext password. No ownership check.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }]
      }
    },
    '/api/graphql': {
      post: { summary: 'GraphQL (introspection enabled)', description: 'Full introspection, no auth, SQLi in resolvers' }
    },
    '/api/chatbot': {
      post: { summary: 'AI Chatbot (prompt injectable)', description: 'Send "ignore previous instructions" to extract system prompt' }
    },
    '/api/upload/v2': {
      post: { summary: 'File upload (unrestricted)', description: 'Accepts .php, .sh, .jsp, .exe. No MIME validation. Null byte bypass.' }
    },
    '/api/nosql/login': {
      post: { summary: 'NoSQL login (injectable)', description: 'MongoDB operator injection: {"username":{"$ne":""},"password":{"$ne":""}}' }
    },
    '/api/xml/parse': {
      post: { summary: 'XML parser (XXE)', description: 'Accepts external entities. Try: <!ENTITY xxe SYSTEM "file:///etc/passwd">' }
    },
    '/api/deserialize': {
      post: { summary: 'Deserialize (RCE)', description: 'eval() on "code" field. Try: {"code":"process.version"}' }
    },
    '/api/ping': {
      post: { summary: 'Ping (command injection)', description: 'OS command injection via host param. Try: {"host":"127.0.0.1 && whoami"}' }
    },
    '/api/fetch-url': {
      get: { summary: 'Fetch URL (SSRF)', description: 'Fetches any URL. Try: url=http://169.254.169.254/latest/meta-data/' }
    },
    '/api/cloud/config': {
      get: { summary: 'Cloud credentials', description: 'Returns AWS, Stripe, Firebase, Supabase, GCP keys' }
    },
    '/api/.env': {
      get: { summary: '.env file', description: 'Full environment file with all secrets' }
    },
    '/api/debug/info': {
      get: { summary: 'Debug info', description: 'API keys in response headers + secrets in body' }
    },
    '/api/internal/healthcheck': {
      get: { summary: 'Internal healthcheck (should not be public)', description: 'Exposed internal endpoint' }
    },
    '/api/internal/metrics/prometheus': {
      get: { summary: 'Prometheus metrics', description: 'Internal metrics endpoint exposed' }
    }
  }
};

// VULN-090: Swagger UI page
router.get('/docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html>
<html><head>
  <title>VulnHub API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head><body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      tryItOutEnabled: true,
      displayRequestDuration: true,
      filter: true,
      requestInterceptor: (req) => {
        // Injeta token admin automaticamente
        req.headers['Authorization'] = 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOjEsInJvbGUiOiJzdXBlcmFkbWluIn0.';
        return req;
      }
    });
  </script>
</body></html>`);
});

// VULN-091: Spec JSON completa
router.get('/docs/openapi.json', (_req, res) => {
  res.json(OPENAPI_SPEC);
});

// VULN-091: Spec YAML (para scanners que buscam .yaml)
router.get('/docs/openapi.yaml', (_req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(`# VulnHub OpenAPI Spec — YAML version
# JWT Secret: secret123
# Admin Password: admin123
# See /api/docs/openapi.json for full spec
openapi: "3.0.3"
info:
  title: "VulnHub API"
  version: "0.1.0"
  x-jwt-secret: "secret123"
  x-admin-password: "admin123"
  x-aws-key: "AKIAIOSFODNN7EXAMPLE"
`);
});

module.exports = router;
