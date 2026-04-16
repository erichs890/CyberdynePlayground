// =====================================================================
// VULN-081  FILE UPLOAD — EXTENSION WHITELIST BYPASS (.php, .sh, .jsp)
// CWE-434  |  OWASP A04:2021  |  CVSS 9.8 (Critical)
// Aceita QUALQUER extensão. Simula servidor que executa .php/.sh/.jsp.
//
// VULN-082  FILE UPLOAD — MIME TYPE MISMATCH (Content-Type ignorado)
// CWE-434  |  OWASP A04:2021  |  CVSS 9.1 (Critical)
// Não valida Content-Type vs extensão real. image/png com .php aceito.
//
// VULN-083  FILE UPLOAD — POLYGLOT (imagem com JS embutido)
// CWE-434  |  OWASP A04:2021  |  CVSS 8.1 (High)
// Endpoint de "image preview" renderiza o upload como HTML.
//
// VULN-084  FILE UPLOAD — NULL BYTE INJECTION no filename
// CWE-158  |  OWASP A03:2021  |  CVSS 8.6 (High)
// shell.php%00.png → salva como shell.php (simula null byte truncation).
//
// VULN-085  FILE UPLOAD — DOUBLE EXTENSION (shell.php.jpg)
// CWE-434  |  OWASP A04:2021  |  CVSS 8.6 (High)
// =====================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

const UPLOADS = path.join(__dirname, '..', '..', 'uploads');

const uploadedFiles = [];

// Middleware para receber raw body de qualquer tipo
const rawBody = express.raw({ type: '*/*', limit: '50mb' });

// VULN-081/082/084/085: Upload irrestrito com tracking
router.post('/upload/v2', rawBody, (req, res) => {
  let filename = req.headers['x-filename'] || req.query.filename || `file_${Date.now()}`;
  const contentType = req.headers['content-type'] || 'application/octet-stream';

  // VULN-084: Simula null byte truncation — remove tudo após %00 ou \x00
  if (filename.includes('%00')) {
    filename = filename.split('%00')[0];
  }
  if (filename.includes('\x00')) {
    filename = filename.split('\x00')[0];
  }

  const ext = path.extname(filename).toLowerCase();
  const dangerousExts = ['.php', '.php5', '.phtml', '.sh', '.bash', '.jsp', '.jspx', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.ps1', '.py', '.rb', '.pl', '.cgi'];
  const isDangerous = dangerousExts.includes(ext);

  // Nenhuma validação — salva tudo
  const dest = path.join(UPLOADS, filename);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, req.body || '');

  const fileInfo = {
    id: uploadedFiles.length + 1,
    filename,
    original_content_type: contentType,
    extension: ext,
    is_dangerous: isDangerous,
    size: req.body ? req.body.length : 0,
    md5: req.body ? crypto.createHash('md5').update(req.body).digest('hex') : null,
    path: dest,
    url: `/api/uploads/v2/${filename}`,
    preview_url: `/api/uploads/v2/preview/${filename}`,
    uploaded_at: new Date().toISOString()
  };
  uploadedFiles.push(fileInfo);

  res.json({
    ok: true,
    file: fileInfo,
    _vulns: {
      'VULN-081': `Extension '${ext}' accepted without restriction`,
      'VULN-082': `Content-Type '${contentType}' not validated against extension '${ext}'`,
      'VULN-084': filename.length < (req.headers['x-filename'] || '').length ? 'Null byte truncation applied' : 'N/A',
      'VULN-085': ext !== filename.slice(filename.indexOf('.')) ? 'Double extension detected but accepted' : 'N/A'
    }
  });
});

// Servir uploads sem sanitização
router.get('/uploads/v2/:name(*)', (req, res) => {
  const filePath = path.join(UPLOADS, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
  res.sendFile(filePath);
});

// VULN-083: Preview endpoint que renderiza como HTML (polyglot trigger)
router.get('/uploads/v2/preview/:name(*)', (req, res) => {
  const filePath = path.join(UPLOADS, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
  const content = fs.readFileSync(filePath, 'utf8');
  // Renderiza como HTML sem sanitização — polyglot com JS embutido executa
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body><h3>Preview: ${req.params.name}</h3><div>${content}</div></body></html>`);
});

// Listar uploads (info leak)
router.get('/upload/v2/list', (_req, res) => {
  res.json({ count: uploadedFiles.length, files: uploadedFiles });
});

// VULN simulado: "executa" o upload como se fosse um servidor CGI
router.get('/upload/v2/execute/:name(*)', (req, res) => {
  const filePath = path.join(UPLOADS, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
  const ext = path.extname(req.params.name).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');

  if (['.php', '.php5', '.phtml'].includes(ext)) {
    return res.json({ simulated_execution: 'PHP', output: `Simulated PHP execution of ${req.params.name}`, source: content });
  }
  if (['.sh', '.bash'].includes(ext)) {
    return res.json({ simulated_execution: 'Shell', output: `Simulated shell execution of ${req.params.name}`, source: content });
  }
  if (['.jsp', '.jspx'].includes(ext)) {
    return res.json({ simulated_execution: 'JSP', output: `Simulated JSP execution of ${req.params.name}`, source: content });
  }
  res.json({ simulated_execution: 'none', note: `Extension ${ext} not configured for execution` });
});

module.exports = router;
