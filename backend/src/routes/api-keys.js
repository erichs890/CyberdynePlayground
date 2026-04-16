// =====================================================================
// VULN-032  API KEY LEAK IN RESPONSE HEADERS
// CWE-200  |  OWASP A02:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// Toda resposta de /api/debug/info inclui headers customizados com:
//   X-API-Key, X-Internal-Secret, X-Debug-Token.
// Um scanner DAST deve detectar segredos em headers de resposta.
//
// VULN-035  JWT/CREDENTIALS IN VERBOSE ERROR MESSAGES
// CWE-209  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
// ---------------------------------------------------------------------
// Endpoint de debug vaza configurações internas no body.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/debug/info', (_req, res) => {
  // VULN-032: Segredos em headers de resposta
  res.setHeader('X-API-Key', 'sk-cyberdyne-prod-FAKEFAKEFAKE1234567890');
  res.setHeader('X-Internal-Secret', 'cyberdyne-super-secret-key-1997');
  res.setHeader('X-Debug-Token', 'GOD_MODE_2026');
  res.setHeader('X-Powered-By', 'Express 4.19 / Node 24 / SQLite3');
  res.setHeader('Server', 'Apache/2.4.49 (Fake)'); // Banner falso para confundir

  const configs = db.prepare('SELECT * FROM hidden_configs').all();
  res.json({
    environment: 'production',
    debug: true,
    database: 'SQLite @ src/db/vulnhub.db',
    secrets: configs,
    note: 'This endpoint should not exist in production.'
  });
});

// Endpoint que vaza stack trace e variáveis internas
router.get('/debug/error', (_req, res) => {
  try {
    // Força um erro para vazar stack trace completo
    throw new Error('Simulated internal error for CyberDyne calibration');
  } catch (e) {
    res.status(500).json({
      error: e.message,
      stack: e.stack,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        JWT_SECRET: 'secret123',
        DB_PATH: require('path').join(__dirname, '..', 'db', 'vulnhub.db')
      }
    });
  }
});

module.exports = router;
