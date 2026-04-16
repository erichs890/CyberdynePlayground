// =====================================================================
// VULN-072  SENSITIVE DATA IN localStorage (JWT Token)
// CWE-922  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
//
// VULN-073  SENSITIVE DATA IN sessionStorage (PII)
// CWE-922  |  OWASP A02:2021  |  CVSS 5.3 (Medium)
//
// VULN-079  CLIENT-SIDE AUTH BYPASS (role stored in localStorage)
// CWE-602  |  OWASP A04:2021  |  CVSS 8.1 (High)
// ---------------------------------------------------------------------
// Salva JWT, credenciais e role no Web Storage. Qualquer XSS pode ler.
// A "proteção" de admin é feita checando localStorage.role no client.
//
// VULN-078  POSTMESSAGE WITHOUT ORIGIN CHECK
// CWE-345  |  OWASP A04:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Escuta window.message sem verificar origin. Executa comandos recebidos.
// =====================================================================
import React, { useEffect, useState } from 'react';

// VULN-080: Segredos em comentários no JS bundle
// TODO: remover antes de produção
// ADMIN_API_KEY = "sk-cyberdyne-internal-FAKEFAKE1234"
// DATABASE_URL = "postgresql://admin:admin123@db.cyberdyne.internal:5432/vulnhub"
// BACKDOOR_TOKEN = "GOD_MODE_2026"

export default function StorageLeak() {
  const [storageData, setStorageData] = useState({});
  const [postMsg, setPostMsg] = useState('');

  useEffect(() => {
    // VULN-072: Salva JWT fake no localStorage
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcmFkbWluIn0.FAKE');
    }
    // VULN-079: Role no client — editável pelo atacante via devtools
    if (!localStorage.getItem('user_role')) {
      localStorage.setItem('user_role', 'user');
    }
    localStorage.setItem('api_base', 'http://localhost:3000/api');
    localStorage.setItem('stripe_pk', 'pk_live_51FakePublishableKeyxxxxxxxxxxxxxxxxxxxxxxxxx');

    // VULN-073: PII no sessionStorage
    sessionStorage.setItem('user_email', 'admin@vulnhub.local');
    sessionStorage.setItem('user_ssn', '123-45-6789');
    sessionStorage.setItem('session_token', 's_abc123_fake_session');
    sessionStorage.setItem('credit_card', '4242-4242-4242-4242');

    // VULN-078: postMessage listener sem origin check
    const handler = (event) => {
      // Nenhuma verificação de event.origin — qualquer iframe/tab pode enviar
      setPostMsg(JSON.stringify(event.data));
      // Se receber comando "eval", executa (RCE client-side)
      if (event.data && event.data.action === 'eval') {
        try { eval(event.data.code); } catch (_) {}
      }
      // Se receber "steal", retorna dados do storage
      if (event.data && event.data.action === 'steal') {
        event.source.postMessage({
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage }
        }, '*');
      }
    };
    window.addEventListener('message', handler);

    refreshDisplay();
    return () => window.removeEventListener('message', handler);
  }, []);

  function refreshDisplay() {
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
    setStorageData({ localStorage: ls, sessionStorage: ss });
  }

  const isAdmin = localStorage.getItem('user_role') === 'superadmin';

  return (
    <div>
      <h2>Storage Leak Lab</h2>

      <h3>VULN-072/073: Dados sensiveis no Web Storage</h3>
      <pre style={{ background: '#1a1a1a', color: '#0f0', padding: 12, overflow: 'auto', fontSize: 12 }}>
        {JSON.stringify(storageData, null, 2)}
      </pre>
      <button onClick={refreshDisplay}>Refresh</button>

      <h3>VULN-079: Client-side Auth Bypass</h3>
      <p>
        Status: {isAdmin
          ? <span style={{ color: 'red' }}>ADMIN ACCESS GRANTED</span>
          : <span>Regular user. Set localStorage.user_role = "superadmin" to bypass.</span>
        }
      </p>

      <h3>VULN-078: postMessage sem origin check</h3>
      <p>Ultima mensagem recebida: <code>{postMsg || 'nenhuma'}</code></p>
      <p style={{ fontSize: 12, color: '#666' }}>
        Teste no console: window.postMessage({'{'} action: "steal" {'}'}, "*")
      </p>
    </div>
  );
}
