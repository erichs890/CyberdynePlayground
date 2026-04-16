// =====================================================================
// VulnHub API & Web - Entrypoint
// AVISO: aplicação intencionalmente vulnerável para calibração do
// scanner CyberDyne (DAST/SAST). NÃO EXECUTAR EM REDE PÚBLICA.
// =====================================================================
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// CORS totalmente aberto de propósito (CWE-942). Será endurecido (ou
// melhor, explorado) em lotes futuros de vulnerabilidades CORS.
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Rotas vulneráveis - Lote 001..006
app.use('/api', require('./routes/products'));   // VULN-001 SQLi
app.use('/api', require('./routes/search'));     // VULN-002 XSS Reflected
app.use('/api', require('./routes/comments'));   // VULN-003 XSS Stored + CSRF
app.use('/api', require('./routes/fetch'));      // VULN-004 SSRF
app.use('/api', require('./routes/download'));   // VULN-005 LFI / Path Traversal
app.use('/api', require('./routes/ping'));       // VULN-006 Command Injection

// Rotas vulneráveis - Lote 021..035 (IA / JWT / Auth / API)
app.use('/api', require('./routes/jwt-auth'));   // VULN-021 JWT None + VULN-022 Weak Secret + VULN-023 Kid SQLi + VULN-024 Broken Auth + VULN-034 Broken Function Auth + VULN-035 JWT in body
app.use('/api', require('./routes/users'));      // VULN-025 BOLA/IDOR + VULN-026 Mass Assignment + VULN-033 IDOR Transactions
app.use('/api', require('./routes/graphql'));    // VULN-027 GraphQL Introspection + SQLi
app.use('/api', require('./routes/chatbot'));    // VULN-028 Prompt Injection
app.use('/api', require('./routes/race'));       // VULN-029 Race Condition + VULN-030 No Rate Limit + VULN-031 Predictable Reset Token
app.use('/api', require('./routes/api-keys'));   // VULN-032 API Key Leak + VULN-035 Verbose Errors

// Rotas vulneráveis - Lote 036..055 (BaaS / Cloud / Recon / Infra)
app.use('/api', require('./routes/cloud-keys')); // VULN-036..040 AWS/Stripe/Firebase/Supabase/GCP keys hardcoded
app.use('/api', require('./routes/s3-bucket'));   // VULN-041 S3 público + VULN-042 Firebase RTDB + VULN-043 Supabase RLS bypass
app.use('/api', require('./routes/recon'));       // VULN-044..055 Host Header, Open Redirect, Header Injection, CORS, .env, .git, Subdomain Takeover, Actuator

// Rotas vulneráveis - Lote 056..068 (Business Logic / Advanced)
app.use('/api', require('./routes/upload'));         // VULN-056 Unrestricted Upload + VULN-057 Upload Path Traversal
app.use('/api', require('./routes/deserialization'));// VULN-058 Insecure Deserialization + VULN-059 Prototype Pollution
app.use('/api', require('./routes/xxe'));            // VULN-060 XXE + VULN-061 XPath Injection
app.use('/api', require('./routes/business-logic')); // VULN-062 Price Manipulation + VULN-063 Coupon Abuse + VULN-064 Negative Qty + VULN-065 No CAPTCHA
app.use('/api', require('./routes/js-secrets'));     // VULN-066 JS Secrets + VULN-067 Sequential IDOR + VULN-068 Creds in URL

// Rotas vulneráveis - Lote 069 (WordPress Fake)
app.use('/', require('./routes/wordpress'));          // VULN-069a..g WP simulated endpoints

// Rotas vulneráveis - Lote 081..118 (Advanced Logic / NoSQL / Swagger / Sessions)
app.use('/api', require('./routes/upload-v2'));       // VULN-081..085 File Upload Advanced (extension bypass, MIME, polyglot, null byte)
app.use('/api', require('./routes/nosql'));           // VULN-086..089 NoSQL Injection ($ne, $regex timing, $where, enumeration)
app.use('/api', require('./routes/swagger'));         // VULN-090..092 Swagger/OpenAPI exposed, secrets in spec, XSS in description
app.use('/api', require('./routes/ssti'));            // VULN-093..098 SSTI, Log Injection, Email Header Injection, HPP, Verb Tampering, ReDoS
app.use('/api', require('./routes/session'));         // VULN-099..106 Session Fixation, Expiration, Account Takeover, 2FA Bypass, Timing Attack
app.use('/api', require('./routes/advanced-misc'));   // VULN-107..118 Smuggling, Cache Poison, LDAP, Integer Overflow, 2nd-order SQLi, Webhooks, CSV Injection, Clickjacking

// Servir frontend estático em produção (Docker build copia dist/ para public/)
const path = require('path');
const publicDir = path.join(__dirname, '..', 'public');
const fs = require('fs');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// API root (quando não há frontend estático)
app.get('/api', (_req, res) => {
  res.json({
    name: 'VulnHub API & Web',
    version: '0.5.0',
    warning: 'INTENTIONALLY VULNERABLE - CyberDyne scanner target',
    total_vulns: 135,
    loaded_vulns: [
      'VULN-001..006 (Injections)',
      'VULN-021..035 (JWT/Auth/AI)',
      'VULN-036..055 (Cloud/Recon)',
      'VULN-056..069 (Logic/WP)',
      'VULN-070..080 (Client-side)',
      'VULN-081..118 (Advanced)',
      'VULN-201..217 (Browser Mimic)'
    ]
  });
});

// SPA fallback: rotas do React Router servidas pelo index.html
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath) && !req.path.startsWith('/api')) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[vulnhub] listening on :${PORT}`));
