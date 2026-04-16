// =====================================================================
// VULN-041  PUBLIC S3 BUCKET SIMULATION (Listing + Download + Upload)
// CWE-284  |  OWASP A01:2021  |  CVSS 8.6 (High)
// ---------------------------------------------------------------------
// Simula um bucket S3 público em /api/s3/vulnhub-backup-prod/:
//   GET  /         → ListBucket XML (directory listing)
//   GET  /:key     → retorna "arquivo" com dados sensíveis
//   PUT  /:key     → aceita upload sem autenticação
// Formato XML idêntico ao AWS S3 para o scanner reconhecer.
//
// VULN-042  FIREBASE REALTIME DB SEM REGRAS (.json público)
// CWE-284  |  OWASP A01:2021  |  CVSS 9.1 (Critical)
// ---------------------------------------------------------------------
// Simula /.json do Firebase RTDB retornando todos os dados sem auth.
//
// VULN-043  SUPABASE RLS BYPASS (Service Role exposta)
// CWE-863  |  OWASP A01:2021  |  CVSS 9.1 (Critical)
// ---------------------------------------------------------------------
// /api/supabase/bypass aceita a service_role key e retorna dados de
// qualquer tabela sem Row Level Security.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

const FAKE_S3_FILES = {
  'database-backup-2026-04.sql.gz': { size: 52428800, data: 'FAKE_GZIP_CONTENT: Contains full user dump with passwords' },
  'credentials.csv': { size: 1024, data: 'username,password,role\nadmin,admin123,superadmin\nroot,toor,superadmin' },
  '.env.production': { size: 512, data: 'DB_PASSWORD=root\nJWT_SECRET=secret123\nAWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
  'private-keys/ssh-key.pem': { size: 3243, data: '-----BEGIN RSA PRIVATE KEY-----\nFAKE_PRIVATE_KEY_CONTENT\n-----END RSA PRIVATE KEY-----' },
  'logs/access-2026-04.log': { size: 10485760, data: '192.168.1.1 - admin [15/Apr/2026] "POST /login" 200 - password=admin123' },
  'reports/pentest-results.pdf': { size: 2097152, data: 'FAKE_PDF_CONTENT: Internal pentest report with all findings' }
};

// VULN-041: S3 Bucket listing (resposta em XML como AWS)
router.get('/s3/vulnhub-backup-prod', (_req, res) => {
  const keys = Object.keys(FAKE_S3_FILES);
  const contentsXml = keys.map(k => `
    <Contents>
      <Key>${k}</Key>
      <Size>${FAKE_S3_FILES[k].size}</Size>
      <LastModified>2026-04-15T00:00:00.000Z</LastModified>
      <StorageClass>STANDARD</StorageClass>
    </Contents>`).join('');

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Server', 'AmazonS3');
  res.setHeader('x-amz-bucket-region', 'us-east-1');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>vulnhub-backup-prod</Name>
  <Prefix></Prefix>
  <IsTruncated>false</IsTruncated>
  <MaxKeys>1000</MaxKeys>
  ${contentsXml}
</ListBucketResult>`);
});

// S3 download sem auth
router.get('/s3/vulnhub-backup-prod/:key(*)', (req, res) => {
  const file = FAKE_S3_FILES[req.params.key];
  if (!file) return res.status(404).setHeader('Server', 'AmazonS3').json({ error: 'NoSuchKey' });
  res.setHeader('Server', 'AmazonS3');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(file.data);
});

// S3 upload sem auth
router.put('/s3/vulnhub-backup-prod/:key(*)', (req, res) => {
  const key = req.params.key;
  FAKE_S3_FILES[key] = { size: 0, data: 'UPLOADED_BY_ATTACKER' };
  res.setHeader('Server', 'AmazonS3');
  res.json({ message: 'Upload accepted without authentication', key });
});

// VULN-042: Firebase RTDB sem regras
router.get('/firebase/vulnhub-cyberdyne.json', (_req, res) => {
  const users = db.prepare('SELECT id, username, email, password_plain, role, balance FROM users').all();
  const configs = db.prepare('SELECT * FROM hidden_configs').all();
  res.json({
    users: Object.fromEntries(users.map(u => [u.id, u])),
    admin_secrets: Object.fromEntries(configs.map(c => [c.key, c.value])),
    _rules: { '.read': true, '.write': true }
  });
});

// VULN-043: Supabase RLS bypass
router.get('/supabase/bypass', (req, res) => {
  const table = req.query.table || 'users';
  const allowed = ['users', 'products', 'transactions', 'comments', 'hidden_configs'];
  if (!allowed.includes(table)) return res.status(400).json({ error: 'table not found' });
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  res.json({
    data: rows,
    _meta: {
      rls_bypassed: true,
      auth_method: 'service_role_key',
      warning: 'RLS is disabled when using service_role key'
    }
  });
});

module.exports = router;
