// =====================================================================
// VULN-060  XML EXTERNAL ENTITY (XXE) INJECTION
// CWE-611  |  OWASP A05:2021  |  CVSS 9.1 (Critical)
// ---------------------------------------------------------------------
// POST /api/xml/parse aceita XML com Content-Type application/xml.
// Parser simples com regex que resolve entidades SYSTEM manualmente.
// Payload clássico:
//   <?xml version="1.0"?>
//   <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
//   <root>&xxe;</root>
//
// VULN-061  XPATH INJECTION
// CWE-643  |  OWASP A03:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// GET /api/xml/query?xpath= simula query XPath sem sanitização.
// =====================================================================
const express = require('express');
const fs = require('fs');
const router = express.Router();

// Parser XXE simulado que resolve ENTITY SYSTEM (lê arquivos locais)
function parseXmlWithXxe(xml) {
  const entities = {};
  const entityRegex = /<!ENTITY\s+(\w+)\s+SYSTEM\s+"([^"]+)">/g;
  let match;
  while ((match = entityRegex.exec(xml)) !== null) {
    const [, name, uri] = match;
    if (uri.startsWith('file://')) {
      const filePath = uri.replace('file://', '');
      try {
        entities[name] = fs.readFileSync(filePath, 'utf8');
      } catch (e) {
        entities[name] = `[XXE ERROR: ${e.message}]`;
      }
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      entities[name] = `[SSRF via XXE: would fetch ${uri}]`;
    } else {
      entities[name] = `[Unsupported scheme: ${uri}]`;
    }
  }

  let resolved = xml;
  for (const [name, value] of Object.entries(entities)) {
    resolved = resolved.replace(new RegExp(`&${name};`, 'g'), value);
  }

  const rootMatch = resolved.match(/<root>([\s\S]*?)<\/root>/);
  return {
    original_xml: xml,
    entities_found: entities,
    resolved_content: rootMatch ? rootMatch[1] : resolved
  };
}

router.post('/xml/parse', express.text({ type: ['application/xml', 'text/xml', '*/*'], limit: '5mb' }), (req, res) => {
  const xml = typeof req.body === 'string' ? req.body : '';
  if (!xml) return res.status(400).json({ error: 'Send XML body with Content-Type: application/xml' });
  const result = parseXmlWithXxe(xml);
  res.json(result);
});

// VULN-061: XPath Injection simulado
const FAKE_XML_DB = `
<users>
  <user id="1"><name>admin</name><password>admin123</password><role>superadmin</role></user>
  <user id="2"><name>john.connor</name><password>skynet_must_die</password><role>admin</role></user>
  <user id="3"><name>neo</name><password>followthewhiterabbit</password><role>admin</role></user>
  <user id="4"><name>homer.j</name><password>donuts4life</password><role>user</role></user>
</users>`;

router.get('/xml/query', (req, res) => {
  const xpath = req.query.xpath || '';
  // Simula XPath injection mostrando que o input é processado sem filtro
  const nameMatch = xpath.match(/name='([^']*)'/);
  const passMatch = xpath.match(/password='([^']*)'/);

  // Se parece com auth bypass: ' or '1'='1
  if (xpath.includes("'1'='1'") || xpath.includes('or 1=1') || xpath.includes("''='")) {
    const allUsers = FAKE_XML_DB;
    return res.json({ xpath, result: allUsers, _note: 'XPath injection: auth bypass returned all users' });
  }

  res.json({
    xpath_received: xpath,
    xml_database: FAKE_XML_DB,
    _note: 'Try: /api/xml/query?xpath=//user[name=\'admin\' or \'1\'=\'1\']'
  });
});

module.exports = router;
