// Usa o módulo nativo node:sqlite (Node >= 22.5). Sem dependências nativas.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'vulnhub.db'));

// Shim compatível com a API usada nas rotas (prepare(...).all/run/get)
const origPrepare = db.prepare.bind(db);
db.prepare = (sql) => {
  const stmt = origPrepare(sql);
  return {
    all: (...args) => stmt.all(...args),
    get: (...args) => stmt.get(...args),
    run: (...args) => {
      const info = stmt.run(...args);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
  };
};

module.exports = db;
