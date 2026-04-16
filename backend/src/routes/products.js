// =====================================================================
// VULN-001  SQL INJECTION (Error-based + Time-based)
// CWE-89  |  OWASP A03:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// Endpoint concatena diretamente o parâmetro `id` na query. Permite:
//   * Error-based:  /api/products?id=1' OR 1=CONVERT(int,(SELECT @@version))--
//   * Union-based:  /api/products?id=0 UNION SELECT username,password_plain,3,4,5,6 FROM users--
//   * Boolean-based: /api/products?id=1 AND 1=1  vs  id=1 AND 1=2
//   * Time-based:   /api/products?id=1; SELECT CASE WHEN (1=1) THEN randomblob(100000000) ELSE 1 END--
// Nenhum uso de prepared statements, nenhum escape, nenhum tipo checado.
// =====================================================================
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/products', (req, res) => {
  const id = req.query.id;

  // Sem filtro: permitimos múltiplas statements e erros vazando para o cliente
  if (id !== undefined) {
    const rawSql = `SELECT id, name, description, price, stock, category FROM products WHERE id = ${id}`;
    try {
      const rows = db.prepare(rawSql).all();       // concatenação crua
      return res.json({ sql: rawSql, rows });     // devolve a SQL para debug (!)
    } catch (e) {
      // Stack trace / mensagem do banco é devolvida para facilitar error-based SQLi
      return res.status(500).json({ error: e.message, sql: rawSql, stack: e.stack });
    }
  }

  const all = db.prepare('SELECT * FROM products').all();
  res.json(all);
});

module.exports = router;
