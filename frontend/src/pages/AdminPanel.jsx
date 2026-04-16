import React, { useState, useEffect } from 'react';
import { colors, layout, btn } from '../styles.js';

export default function AdminPanel({ section }) {
  const [data, setData] = useState(null);
  const [sql, setSql] = useState('');
  const [sqlResult, setSqlResult] = useState(null);

  useEffect(() => {
    if (!section || section === 'users') {
      fetch('/api/nosql/users').then(r => r.json()).then(setData).catch(() => {});
    } else if (section === 'config') {
      fetch('/api/debug/info').then(r => r.json()).then(setData).catch(() => {});
    }
  }, [section]);

  async function runSql() {
    const r = await fetch(`/api/products?id=${encodeURIComponent(sql)}`);
    setSqlResult(await r.json());
  }

  if (section === 'sql') {
    return (
      <div style={{ paddingTop: 32 }}>
        <h1 style={{ color: colors.white }}>Database Console</h1>
        <div style={layout.card}>
          <textarea value={sql} onChange={e => setSql(e.target.value)}
            placeholder="Enter SQL expression..."
            style={{ width: '100%', height: 100, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
          <button onClick={runSql} style={{ ...btn(colors.danger, colors.white), marginTop: 8 }}>Execute</button>
          {sqlResult && <pre style={pre}>{JSON.stringify(sqlResult, null, 2)}</pre>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 32 }}>
      <h1 style={{ color: colors.white }}>
        {section === 'config' ? 'System Configuration' : 'User Management'}
      </h1>
      <div style={layout.card}>
        {data ? (
          <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p style={{ color: colors.textMuted }}>Loading...</p>
        )}
      </div>
    </div>
  );
}

const pre = { background: '#0a1020', color: '#00d4ff', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 11, maxHeight: 500 };
