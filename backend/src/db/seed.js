const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'vulnhub.db');
const SQL_PATH = path.join(__dirname, 'schema.sql');

if (fs.existsSync(DB_PATH)) {
  try {
    fs.unlinkSync(DB_PATH);
  } catch (e) {
    if (e.code === 'EBUSY') {
      console.error('[seed] ERRO: vulnhub.db está travado. Pare o server (Ctrl+C) antes de rodar o seed.');
      process.exit(1);
    }
    throw e;
  }
}

const db = new Database(DB_PATH);
const sql = fs.readFileSync(SQL_PATH, 'utf8');
db.exec(sql);

console.log('[seed] banco criado em:', DB_PATH);
console.log('[seed] usuarios:', db.prepare('SELECT COUNT(*) c FROM users').get().c);
console.log('[seed] produtos:', db.prepare('SELECT COUNT(*) c FROM products').get().c);
db.close();
