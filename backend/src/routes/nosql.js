// =====================================================================
// VULN-086  NOSQL INJECTION ($ne / $gt operator injection)
// CWE-943  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// POST /api/nosql/login aceita operadores MongoDB no body JSON.
// Payload: { "username": {"$ne":""}, "password": {"$ne":""} } → auth bypass
//
// VULN-087  NOSQL INJECTION — TIMING ATTACK ($regex com ReDoS)
// CWE-943 + CWE-1333  |  OWASP A03:2021  |  CVSS 7.5 (High)
// POST /api/nosql/search aceita $regex, permitindo timing side-channel
// e ReDoS: {"query":{"$regex":"^a{1000000}b"}}
//
// VULN-088  NOSQL INJECTION — $WHERE (JavaScript execution)
// CWE-943  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// POST /api/nosql/query aceita $where com JS code execution.
//
// VULN-089  NOSQL — DATA EXFILTRATION VIA $regex ENUMERATION
// CWE-943  |  OWASP A03:2021  |  CVSS 8.6 (High)
// Permite extrair dados char-por-char: $regex: "^adm" → match admin
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

// "Banco" in-memory simulando MongoDB para as vulnerabilidades NoSQL
const usersCollection = [];

function loadUsers() {
  if (usersCollection.length > 0) return;
  const rows = db.prepare('SELECT id, username, email, password_plain, role, api_token, balance FROM users').all();
  rows.forEach(r => usersCollection.push(r));
}

// Simula operadores MongoDB
function matchesFilter(doc, filter) {
  for (const [key, condition] of Object.entries(filter)) {
    const val = doc[key];
    if (key === '$where') {
      try {
        const fn = new Function('obj', `with(obj) { return ${condition}; }`);
        if (!fn(doc)) return false;
      } catch (_) { return false; }
      continue;
    }
    if (typeof condition === 'object' && condition !== null) {
      if ('$ne' in condition && val === condition.$ne) return false;
      if ('$gt' in condition && !(val > condition.$gt)) return false;
      if ('$lt' in condition && !(val < condition.$lt)) return false;
      if ('$gte' in condition && !(val >= condition.$gte)) return false;
      if ('$eq' in condition && val !== condition.$eq) return false;
      if ('$regex' in condition) {
        try {
          const re = new RegExp(condition.$regex, condition.$options || '');
          if (!re.test(String(val))) return false;
        } catch (_) { return false; }
      }
      if ('$in' in condition && !condition.$in.includes(val)) return false;
      if ('$exists' in condition) {
        if (condition.$exists && val === undefined) return false;
        if (!condition.$exists && val !== undefined) return false;
      }
    } else {
      if (val !== condition) return false;
    }
  }
  return true;
}

// VULN-086: Login com NoSQL injection
router.post('/nosql/login', (req, res) => {
  loadUsers();
  const { username, password } = req.body || {};
  // Aceita operadores MongoDB direto do body
  const filter = {};
  if (username) filter.username = username;
  if (password) filter.password_plain = password;

  const matches = usersCollection.filter(u => matchesFilter(u, filter));
  if (matches.length > 0) {
    return res.json({
      authenticated: true,
      users_matched: matches.length,
      user: matches[0],
      _vuln: 'NoSQL operator injection: try {"username":{"$ne":""},"password":{"$ne":""}}'
    });
  }
  res.status(401).json({ authenticated: false, _hint: 'Try MongoDB operators like $ne, $gt, $regex' });
});

// VULN-087/089: Search com $regex (timing + enumeration)
router.post('/nosql/search', (req, res) => {
  loadUsers();
  const { query } = req.body || {};
  if (!query || typeof query !== 'object') {
    return res.status(400).json({ error: 'Send {"query": {"field": {"$regex": "pattern"}}}' });
  }

  const start = process.hrtime.bigint();
  const results = usersCollection.filter(u => matchesFilter(u, query));
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

  res.json({
    count: results.length,
    results,
    timing_ms: elapsed,
    _vuln: 'VULN-087: timing side-channel via $regex. VULN-089: char enumeration via ^prefix'
  });
});

// VULN-088: $where com execução JS
router.post('/nosql/query', (req, res) => {
  loadUsers();
  const { filter } = req.body || {};
  if (!filter || typeof filter !== 'object') {
    return res.status(400).json({ error: 'Send {"filter":{"$where":"this.role==\'superadmin\'"}}' });
  }

  try {
    const results = usersCollection.filter(u => matchesFilter(u, filter));
    res.json({
      count: results.length,
      results,
      _vuln: 'VULN-088: $where executes arbitrary JavaScript via new Function()'
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// Endpoint para ver toda a "collection" (info leak complementar)
router.get('/nosql/users', (_req, res) => {
  loadUsers();
  res.json({ count: usersCollection.length, users: usersCollection });
});

module.exports = router;
