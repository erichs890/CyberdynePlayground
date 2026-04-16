// =====================================================================
// VULN-027  GRAPHQL INTROSPECTION + QUERY INJECTION
// CWE-200 + CWE-943  |  OWASP A01:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// Simula um endpoint GraphQL (/api/graphql) que:
//   1) Permite introspection irrestrita (__schema, __type)
//   2) Aceita queries sem depth-limit (DoS via nested queries)
//   3) Não exige autenticação para queries sensíveis
//   4) Concatena argumentos em SQL (SQLi dentro de GraphQL resolver)
// Implementação simples: parser manual de queries, sem lib GraphQL real,
// para manter o projeto leve e as vulns 100% detectáveis pelo scanner.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

const SCHEMA_INFO = {
  types: [
    { name: 'User', fields: ['id', 'username', 'email', 'password_plain', 'role', 'api_token', 'balance'] },
    { name: 'Product', fields: ['id', 'name', 'description', 'price', 'stock', 'category'] },
    { name: 'Transaction', fields: ['id', 'user_id', 'product_id', 'amount', 'status', 'card_last4', 'note'] },
    { name: 'HiddenConfig', fields: ['key', 'value'] },
    { name: 'Query', fields: ['user(id)', 'users', 'product(id)', 'products', 'transactions', 'configs', '__schema', '__type(name)'] }
  ],
  queryType: { name: 'Query' },
  mutationType: null
};

function resolveGraphQL(query) {
  const q = (query || '').trim();

  // Introspection — retorna schema completo sem restrição
  if (q.includes('__schema')) return { data: { __schema: SCHEMA_INFO } };
  if (q.includes('__type')) {
    const m = q.match(/__type\s*\(\s*name\s*:\s*"([^"]+)"\s*\)/);
    const t = SCHEMA_INFO.types.find(t => t.name === (m && m[1]));
    return { data: { __type: t || null } };
  }

  // user(id: N) — SQLi no argumento id
  if (q.includes('user(') || q.includes('user (')) {
    const m = q.match(/user\s*\(\s*id\s*:\s*"?([^)"]+)"?\s*\)/);
    const id = m ? m[1] : '1';
    // Concatenação direta = SQLi dentro do "resolver"
    const sql = `SELECT id, username, email, password_plain, role, api_token, balance FROM users WHERE id = ${id}`;
    try {
      const rows = db.prepare(sql).all();
      return { data: { user: rows[0] || null }, _debug_sql: sql };
    } catch (e) {
      return { errors: [{ message: e.message, sql }] };
    }
  }

  // users — lista todos sem auth
  if (q.includes('users')) {
    return { data: { users: db.prepare('SELECT id, username, email, password_plain, role, api_token, balance FROM users').all() } };
  }

  // products
  if (q.includes('product')) {
    return { data: { products: db.prepare('SELECT * FROM products').all() } };
  }

  // transactions (sensível, sem auth)
  if (q.includes('transaction')) {
    return { data: { transactions: db.prepare('SELECT * FROM transactions').all() } };
  }

  // configs (segredos!)
  if (q.includes('config')) {
    return { data: { configs: db.prepare('SELECT * FROM hidden_configs').all() } };
  }

  return { errors: [{ message: 'Unrecognized query. Try introspection: { __schema { types { name fields } } }' }] };
}

// Aceita GET e POST para máxima superfície de ataque
router.all('/graphql', (req, res) => {
  const query = req.body?.query || req.query?.query || '';
  const result = resolveGraphQL(query);
  res.json(result);
});

module.exports = router;
