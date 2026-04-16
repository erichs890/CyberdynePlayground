// =====================================================================
// VULN-066  JAVASCRIPT SECRETS IN API RESPONSES
// CWE-615  |  OWASP A02:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// GET /api/app-config retorna configuração do frontend com secrets que
// deveriam ser server-only: API keys, internal URLs, feature flags.
//
// VULN-067  INSECURE DIRECT OBJECT REFERENCE (IDOR) VIA SEQUENTIAL IDs
// CWE-639  |  OWASP A01:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// GET /api/invoices/:id retorna faturas com IDs sequenciais sem auth.
//
// VULN-068  SENSITIVE DATA IN URL QUERY PARAMS (logged/cached)
// CWE-598  |  OWASP A04:2021  |  CVSS 5.3 (Medium)
// ---------------------------------------------------------------------
// GET /api/auth/sso?token=JWT&password=xxx aceita credenciais na URL.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

// VULN-066: Segredos no "app config" retornado ao frontend
router.get('/app-config', (_req, res) => {
  res.json({
    app_name: 'VulnHub',
    api_base: 'http://localhost:3000/api',
    google_maps_key: 'AIzaSyFAKE_MAPS_KEY_xxxxxxxxxxxxxxxxxx',
    stripe_pk: 'pk_live_51FakePublishableKeyxxxxxxxxxxxxxxxxxxxxxxxxx',
    algolia_admin_key: 'ALGOLIA_ADMIN_FAKE_KEY_1234567890',   // admin key, não search-only!
    sentry_dsn: 'https://fakekey@sentry.io/1234567',
    internal_api: 'http://10.0.0.5:8080/internal',
    feature_flags: {
      admin_panel: true,
      debug_mode: true,
      maintenance_bypass: '/api/auth/admin?bypass=GOD_MODE_2026',
      hidden_signup: '/api/users/register'
    },
    jwt_secret: 'secret123',
    _comment: 'This config is served to the browser. Secrets should not be here.'
  });
});

// VULN-067: Sequential invoice IDs sem auth
const FAKE_INVOICES = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  user_id: (i % 11) + 1,
  amount: Math.round(Math.random() * 10000 * 100) / 100,
  description: `Invoice #${i + 1} - ${['Hardware', 'Software License', 'Consulting', 'Training'][i % 4]}`,
  card_last4: String(1000 + Math.floor(Math.random() * 9000)),
  ssn_last4: String(1000 + Math.floor(Math.random() * 9000)),
  status: ['paid', 'pending', 'overdue'][i % 3]
}));

router.get('/invoices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const invoice = FAKE_INVOICES.find(inv => inv.id === id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  // Retorna PII (card, SSN) sem qualquer auth check
  res.json(invoice);
});

router.get('/invoices', (_req, res) => {
  res.json({ count: FAKE_INVOICES.length, invoices: FAKE_INVOICES });
});

// VULN-068: Credenciais em query params
router.get('/auth/sso', (req, res) => {
  const { token, username, password } = req.query;
  // Credenciais na URL → logadas em access logs, cacheadas em proxies/CDN
  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password_plain = ?').get(username, password);
  res.json({
    authenticated: !!user,
    user: user || null,
    token_received: token,
    _warning: 'Credentials were sent as URL query parameters (visible in logs, browser history, proxies)'
  });
});

module.exports = router;
