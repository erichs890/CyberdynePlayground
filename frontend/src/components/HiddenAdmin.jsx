// =====================================================================
// VULN-075  SPA HIDDEN ROUTES (No Auth Guard)
// CWE-284  |  OWASP A01:2021  |  CVSS 7.5 (High)
// ---------------------------------------------------------------------
// Rotas /admin-debug, /internal/config, /super-secret-panel existem no
// bundle JS mas não possuem link visível nem auth guard. Qualquer um que
// inspecione o JS bundle ou force URLs encontra o painel.
// =====================================================================
import React, { useEffect, useState } from 'react';

export default function HiddenAdmin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/debug/info')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ error: 'Could not load' }));
  }, []);

  return (
    <div>
      <h2 style={{ color: 'red' }}>Hidden Admin Panel</h2>
      <p>This route has no auth guard. Found by inspecting the JS bundle or brute-forcing SPA routes.</p>
      <h3>Server Debug Info</h3>
      <pre style={{ background: '#1a1a1a', color: '#0f0', padding: 12, overflow: 'auto', fontSize: 12 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <h3>Quick Actions (no auth required)</h3>
      <ul>
        <li><a href="/api/cloud/config">Cloud Credentials</a></li>
        <li><a href="/api/env">Environment Variables</a></li>
        <li><a href="/api/actuator/configprops">Actuator ConfigProps</a></li>
        <li><a href="/api/firebase/vulnhub-cyberdyne.json">Firebase DB Dump</a></li>
        <li><a href="/api/.env">.env File</a></li>
        <li><a href="/api/.git/config">.git/config</a></li>
        <li><a href="/wp-config.php.bak">wp-config.php.bak</a></li>
      </ul>
    </div>
  );
}
