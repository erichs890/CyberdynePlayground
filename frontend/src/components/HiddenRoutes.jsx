// =====================================================================
// VULN-212  SPA HIDDEN ADMIN ROUTES (sem auth guard, sem link visivel)
// CWE-284  |  OWASP A01:2021  |  CVSS 7.5 (High)
// Rotas sensiveis existem no bundle JS mas nao possuem link na UI.
// Qualquer pessoa que inspecionar o bundle ou adivinhar URLs encontra:
//   /admin/users, /admin/secrets, /admin/sql-console, /debug/state
// Nenhuma validacao de sessao ou role e feita no frontend.
// =====================================================================
import React, { useEffect, useState } from 'react';

// --- Painel /admin/users ---
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/nosql/users').then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /admin/users</h2>
      <p>Rota oculta no SPA — sem auth guard. Todos os usuarios com senhas:</p>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
        <thead><tr style={{ background: '#333', color: '#fff' }}>
          <th style={td}>ID</th><th style={td}>Username</th><th style={td}>Email</th>
          <th style={td}>Password</th><th style={td}>Role</th><th style={td}>Token</th><th style={td}>Balance</th>
        </tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ background: u.role === 'superadmin' ? '#ffeaea' : '#fff' }}>
              <td style={td}>{u.id}</td><td style={td}>{u.username}</td><td style={td}>{u.email}</td>
              <td style={{ ...td, color: 'red' }}>{u.password_plain}</td><td style={td}>{u.role}</td>
              <td style={{ ...td, fontSize: 10 }}>{u.api_token}</td><td style={td}>${u.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Painel /admin/secrets ---
export function AdminSecrets() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/debug/info').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /admin/secrets</h2>
      <p>Configuracoes internas, chaves de API e segredos do sistema:</p>
      <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
      <h3>Tambem acessivel em:</h3>
      <ul style={{ fontSize: 12 }}>
        <li><a href="/api/cloud/config">/api/cloud/config</a> (AWS, Stripe, Firebase, GCP)</li>
        <li><a href="/api/.env">/api/.env</a></li>
        <li><a href="/api/.git/config">/api/.git/config</a></li>
        <li><a href="/api/actuator/configprops">/api/actuator/configprops</a></li>
        <li><a href="/api/docs/openapi.json">/api/docs/openapi.json</a></li>
        <li><a href="/wp-config.php.bak">/wp-config.php.bak</a></li>
      </ul>
    </div>
  );
}

// --- Console SQL /admin/sql-console ---
export function SqlConsole() {
  const [sql, setSql] = useState("1 UNION SELECT username,password_plain,email,role,4,5 FROM users--");
  const [result, setResult] = useState(null);

  async function runQuery() {
    const r = await fetch(`/api/products?id=${encodeURIComponent(sql)}`);
    setResult(await r.json());
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /admin/sql-console</h2>
      <p>Console SQL direto — injeta via endpoint de produtos (VULN-001):</p>
      <textarea value={sql} onChange={e => setSql(e.target.value)}
        style={{ width: '100%', height: 80, fontFamily: 'monospace', padding: 8 }} />
      <button onClick={runQuery} style={{ padding: '10px 24px', marginTop: 8, background: '#d32f2f', color: '#fff', border: 'none' }}>
        Executar SQL
      </button>
      {result && <pre style={pre}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

// --- Debug State /debug/state ---
export function DebugState() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /debug/state</h2>
      <p>Estado completo da aplicacao client-side:</p>

      <h3>window.__APP_CONFIG__</h3>
      <pre style={pre}>{JSON.stringify(window.__APP_CONFIG__, null, 2)}</pre>

      <h3>localStorage</h3>
      <pre style={pre}>{JSON.stringify(Object.fromEntries(
        Array.from({ length: localStorage.length }, (_, i) => {
          const k = localStorage.key(i); return [k, localStorage.getItem(k)];
        })
      ), null, 2)}</pre>

      <h3>sessionStorage</h3>
      <pre style={pre}>{JSON.stringify(Object.fromEntries(
        Array.from({ length: sessionStorage.length }, (_, i) => {
          const k = sessionStorage.key(i); return [k, sessionStorage.getItem(k)];
        })
      ), null, 2)}</pre>

      <h3>document.cookie</h3>
      <pre style={pre}>{document.cookie || '(vazio)'}</pre>

      <h3>navigator</h3>
      <pre style={pre}>{JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }, null, 2)}</pre>
    </div>
  );
}

const td = { border: '1px solid #ccc', padding: '4px 8px', textAlign: 'left' };
const pre = { background: '#1a1a2e', color: '#0f0', padding: 16, overflow: 'auto', fontSize: 11, maxHeight: 400 };
