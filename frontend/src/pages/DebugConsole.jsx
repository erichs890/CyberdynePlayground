import React, { useState, useEffect } from 'react';
import { colors, layout } from '../styles.js';

export default function DebugConsole() {
  const [appState, setAppState] = useState({});

  useEffect(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); ss[k] = sessionStorage.getItem(k); }

    setAppState({
      config: window.__CONFIG__,
      localStorage: ls,
      sessionStorage: ss,
      cookies: document.cookie,
      navigator: { userAgent: navigator.userAgent, language: navigator.language, platform: navigator.platform },
      location: { href: window.location.href, origin: window.location.origin }
    });
  }, []);

  return (
    <div style={{ paddingTop: 32 }}>
      <h1 style={{ color: colors.white }}>System State</h1>
      <div style={layout.card}>
        <pre style={{ background: '#0a1020', color: '#00d4ff', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 11, maxHeight: 600 }}>
          {JSON.stringify(appState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
