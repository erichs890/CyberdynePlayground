const path = require('path');
const fs = require('fs');

const IS_VERCEL = !!process.env.VERCEL;
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const LOCAL_DB_PATH = path.join(__dirname, 'vulnhub.db');
const VERCEL_DB_PATH = '/tmp/vulnhub.db';

let db;

// Try better-sqlite3 first (works on Vercel), fallback to node:sqlite (local dev)
try {
  const Database = require('better-sqlite3');
  const dbPath = IS_VERCEL ? VERCEL_DB_PATH : LOCAL_DB_PATH;
  if (IS_VERCEL && !fs.existsSync(dbPath)) {
    db = new Database(dbPath);
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } else {
    db = new Database(dbPath);
  }
} catch {
  // Fallback: node:sqlite (Node >= 22.5 with --experimental-sqlite)
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = IS_VERCEL ? VERCEL_DB_PATH : LOCAL_DB_PATH;
  if (IS_VERCEL && !fs.existsSync(dbPath)) {
    const tmpDb = new DatabaseSync(dbPath);
    tmpDb.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    tmpDb.close();
  }
  const raw = new DatabaseSync(dbPath);
  const origPrepare = raw.prepare.bind(raw);
  raw.prepare = (sql) => {
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
  db = raw;
}

module.exports = db;
