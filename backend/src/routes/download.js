// =====================================================================
// VULN-005  LFI / PATH TRAVERSAL
// CWE-22  |  OWASP A01:2021  |  CVSS 8.6 (High)
// ---------------------------------------------------------------------
// Concatena o parâmetro `file` à pasta uploads/ sem normalização.
// Permite escapar com ../ e ler arquivos arbitrários do host:
//   /api/download?file=../../../../etc/passwd
//   /api/download?file=../src/db/vulnhub.db
//   /api/download?file=../../../../Windows/win.ini
// =====================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const UPLOADS = path.join(__dirname, '..', '..', 'uploads');

router.get('/download', (req, res) => {
  const file = req.query.file || '';
  // Concatenação direta (CWE-22). Sem path.resolve + verificação de prefixo.
  const fullPath = UPLOADS + '/' + file;
  try {
    const data = fs.readFileSync(fullPath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(file)}"`);
    return res.send(data);
  } catch (e) {
    // Mensagem completa devolvida (facilita fingerprint do caminho real)
    res.status(404).json({ error: e.message, attempted: fullPath });
  }
});

module.exports = router;
