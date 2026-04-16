// =====================================================================
// VULN-004  SSRF (Server-Side Request Forgery)
// CWE-918  |  OWASP A10:2021  |  CVSS 9.1 (Critical)
// ---------------------------------------------------------------------
// Endpoint faz fetch arbitrário de qualquer URL fornecida. Sem allowlist,
// sem bloqueio de IPs privados, sem validação de esquema, segue redirects.
// Exploração típica contra metadata AWS:
//   /api/fetch-url?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
//   /api/fetch-url?url=file:///etc/passwd          (dependendo do client)
//   /api/fetch-url?url=gopher://127.0.0.1:6379/_INFO
// =====================================================================
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/fetch-url', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url param required' });
  try {
    // Sem filtro de SSRF. maxRedirects alto, aceita qualquer protocolo suportado.
    const r = await axios.get(url, {
      maxRedirects: 10,
      timeout: 15000,
      validateStatus: () => true
    });
    res.status(200).json({
      url,
      status: r.status,
      headers: r.headers,
      body: typeof r.data === 'string' ? r.data : JSON.stringify(r.data)
    });
  } catch (e) {
    // Vazamento de mensagem interna auxilia o scanner a confirmar SSRF blind
    res.status(500).json({ error: e.message, code: e.code });
  }
});

module.exports = router;
