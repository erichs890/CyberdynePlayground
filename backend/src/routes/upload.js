// =====================================================================
// VULN-056  UNRESTRICTED FILE UPLOAD (Web Shell / RCE)
// CWE-434  |  OWASP A04:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// POST /api/upload aceita qualquer arquivo sem validação de:
//   - Extensão (.php, .jsp, .exe, .sh aceitos)
//   - Content-Type (ignora mimetype)
//   - Tamanho (sem limite)
//   - Conteúdo (pode ser webshell, binário malicioso)
// O arquivo é salvo em /uploads/ e fica acessível via /api/uploads/:name
//
// VULN-057  FILE UPLOAD PATH TRAVERSAL (escrever fora do uploads/)
// CWE-22  |  OWASP A01:2021  |  CVSS 9.1 (Critical)
// ---------------------------------------------------------------------
// O nome do arquivo vem do campo "filename" do body sem sanitização.
// Payload: filename="../src/server.js" sobrescreve código do servidor.
// =====================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const UPLOADS = path.join(__dirname, '..', '..', 'uploads');

router.post('/upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  // Pega filename do header ou query — sem sanitização
  const filename = req.headers['x-filename'] || req.query.filename || 'uploaded_file';
  // VULN-057: concatenação direta sem filtrar ../
  const dest = path.join(UPLOADS, filename);
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, req.body || '');
    res.json({
      ok: true,
      file: filename,
      path: dest,
      size: req.body ? req.body.length : 0,
      accessible_at: `/api/uploads/${filename}`
    });
  } catch (e) {
    res.status(500).json({ error: e.message, attempted_path: dest });
  }
});

// Servir uploads sem validação
router.get('/uploads/:name(*)', (req, res) => {
  const filePath = path.join(UPLOADS, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
  res.sendFile(filePath);
});

module.exports = router;
