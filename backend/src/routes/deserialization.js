// =====================================================================
// VULN-058  INSECURE DESERIALIZATION (eval-based JSON revival)
// CWE-502  |  OWASP A08:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// POST /api/deserialize aceita JSON com campo "__proto__" ou "constructor"
// e faz eval() no campo "code" se presente. Simula deserialization RCE.
// Payload: { "code": "process.exit(1)" } ou prototype pollution.
//
// VULN-059  PROTOTYPE POLLUTION
// CWE-1321  |  OWASP A08:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// POST /api/merge aceita deep merge sem proteção de __proto__.
// Payload: { "__proto__": { "isAdmin": true } }
// =====================================================================
const express = require('express');
const router = express.Router();

// VULN-058: eval() em campo de entrada
router.post('/deserialize', (req, res) => {
  const data = req.body || {};
  let result = null;

  // Se o campo "code" existir, executa via eval (RCE completo)
  if (data.code) {
    try {
      result = eval(data.code);   // CWE-95: eval injection
    } catch (e) {
      result = { error: e.message, stack: e.stack };
    }
  }

  // Se "__proto__" ou "constructor" estiver presente, aplica sem filtro
  if (data.__proto__ && typeof data.__proto__ === 'object') {
    Object.assign(Object.prototype, data.__proto__);
  }

  res.json({
    received: data,
    eval_result: result,
    prototype_check: {
      isAdmin: ({}).isAdmin || false,
      polluted_keys: Object.keys(Object.prototype)
    }
  });
});

// VULN-059: Deep merge sem proteção
function unsafeMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      unsafeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

router.post('/merge', (req, res) => {
  const base = { name: 'guest', role: 'user', isAdmin: false };
  const merged = unsafeMerge(base, req.body || {});
  res.json({
    merged,
    global_pollution_test: {
      isAdmin: ({}).isAdmin || false,
      newEmptyObject: JSON.stringify({})
    }
  });
});

module.exports = router;
