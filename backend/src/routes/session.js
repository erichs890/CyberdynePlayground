// =====================================================================
// VULN-099  SESSION FIXATION
// CWE-384  |  OWASP A07:2021  |  CVSS 8.1 (High)
// GET /api/session/init?sid=ATTACKER_SID → seta cookie com SID fornecido.
// O login não regenera a sessão → atacante herda sessão autenticada.
//
// VULN-100  INSUFFICIENT SESSION EXPIRATION
// CWE-613  |  OWASP A07:2021  |  CVSS 5.3 (Medium)
// Cookie sem Expires / Max-Age → sessão dura para sempre.
//
// VULN-101  ACCOUNT TAKEOVER VIA EMAIL CHANGE (sem reautenticação)
// CWE-620  |  OWASP A07:2021  |  CVSS 8.1 (High)
// PUT /api/account/email muda email sem pedir senha atual.
//
// VULN-102  PASSWORD CHANGE WITHOUT OLD PASSWORD
// CWE-620  |  OWASP A07:2021  |  CVSS 8.1 (High)
// PUT /api/account/password muda senha sem validar a antiga.
//
// VULN-103  2FA BYPASS (código aceito como query param)
// CWE-287  |  OWASP A07:2021  |  CVSS 8.1 (High)
// POST /api/auth/2fa aceita código estático "000000" como bypass.
//
// VULN-104  INSECURE REMEMBER-ME TOKEN (predictable)
// CWE-330  |  OWASP A02:2021  |  CVSS 7.5 (High)
// Cookie remember_me = Base64(username:timestamp) — previsível.
//
// VULN-105  TIMING ATTACK ON PASSWORD COMPARISON
// CWE-208  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
// POST /api/auth/timing-login compara senha byte-a-byte (não constant-time).
//
// VULN-106  CONCURRENT SESSION — NO LIMIT
// CWE-770  |  OWASP A07:2021  |  CVSS 3.7 (Low)
// Login não invalida sessões anteriores.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

const sessions = {};

// VULN-099: Session fixation
router.get('/session/init', (req, res) => {
  const sid = req.query.sid || 'sess_' + Math.random().toString(36).slice(2);
  sessions[sid] = { authenticated: false, user: null, created: Date.now() };
  // VULN-100: Cookie sem Max-Age, sem Secure, sem HttpOnly
  res.cookie('session_id', sid, { httpOnly: false, sameSite: 'none', secure: false });
  res.json({
    session_id: sid,
    _vuln: 'Session fixation: pass ?sid=ATTACKER_SID. Login will authenticate that same SID.'
  });
});

router.post('/session/login', (req, res) => {
  const { username, password } = req.body || {};
  const sid = req.cookies.session_id;
  if (!sid || !sessions[sid]) return res.status(400).json({ error: 'No session. Call /api/session/init first' });

  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password_plain = ?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // VULN-099: NÃO regenera o session ID após login
  sessions[sid].authenticated = true;
  sessions[sid].user = user;

  // VULN-104: Remember-me previsível
  const rememberToken = Buffer.from(`${username}:${Math.floor(Date.now() / 1000)}`).toString('base64');
  res.cookie('remember_me', rememberToken, { httpOnly: false });

  // VULN-106: Não invalida sessões anteriores
  res.json({
    ok: true,
    session_id: sid,
    user,
    remember_token: rememberToken,
    _vulns: {
      'VULN-099': 'Session ID not regenerated after login',
      'VULN-104': `Remember-me token = Base64("${username}:timestamp") — predictable`,
      'VULN-106': 'Previous sessions not invalidated'
    }
  });
});

router.get('/session/profile', (req, res) => {
  const sid = req.cookies.session_id;
  if (!sid || !sessions[sid] || !sessions[sid].authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(sessions[sid]);
});

// VULN-101: Email change sem reautenticação
router.put('/account/email', (req, res) => {
  const { user_id, new_email } = req.body || {};
  if (!user_id || !new_email) return res.status(400).json({ error: 'user_id and new_email required' });
  // Sem pedir senha atual, sem confirmar via email antigo
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(new_email, user_id);
  res.json({
    ok: true,
    new_email,
    _vuln: 'Email changed without re-authentication. Attacker with session can takeover account.'
  });
});

// VULN-102: Password change sem senha atual
router.put('/account/password', (req, res) => {
  const { user_id, new_password } = req.body || {};
  if (!user_id || !new_password) return res.status(400).json({ error: 'user_id and new_password required' });
  const crypto = require('crypto');
  const md5 = crypto.createHash('md5').update(new_password).digest('hex');
  db.prepare('UPDATE users SET password_plain = ?, password_md5 = ? WHERE id = ?').run(new_password, md5, user_id);
  res.json({
    ok: true,
    _vuln: 'Password changed without verifying old password. Any authenticated user/CSRF can change it.'
  });
});

// VULN-103: 2FA bypass
router.post('/auth/2fa', (req, res) => {
  const { username, code } = req.body || {};
  // Código fixo "000000" sempre aceito como backdoor
  if (code === '000000') {
    return res.json({ authenticated: true, bypass: true, _vuln: 'Code 000000 always accepted as 2FA bypass' });
  }
  // Código "correto" para simulação
  if (code === '123456') {
    return res.json({ authenticated: true, bypass: false });
  }
  res.status(401).json({ authenticated: false, _hint: 'Try 000000 for bypass, 123456 for "correct" code' });
});

// VULN-105: Timing attack na comparação de senha
router.post('/auth/timing-login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT password_plain FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const realPass = user.password_plain;
  const attempt = password || '';
  const start = process.hrtime.bigint();

  // Comparação byte-a-byte: vaza comprimento via timing
  let match = true;
  for (let i = 0; i < Math.max(realPass.length, attempt.length); i++) {
    if (realPass[i] !== attempt[i]) {
      match = false;
      break; // Early exit = timing side-channel
    }
  }

  const elapsed = Number(process.hrtime.bigint() - start);

  res.json({
    authenticated: match,
    timing_ns: elapsed,
    _vuln: 'Non-constant-time comparison. More matching chars = longer response time.'
  });
});

module.exports = router;
