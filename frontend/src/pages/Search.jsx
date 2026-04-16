import React, { useState } from 'react';
import { colors, layout, btn } from '../styles.js';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [mode, setMode] = useState('products');

  async function handleSearch(e) {
    e.preventDefault();
    if (mode === 'products') {
      const r = await fetch(`/api/directory/search?q=${encodeURIComponent(query)}`);
      setResults(await r.json());
    } else if (mode === 'graphql') {
      const r = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `{ user(id: "${query}") { username email role balance } }` })
      });
      setResults(await r.json());
    }
  }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ color: colors.white }}>Search</h1>
      <div style={layout.card}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <select value={mode} onChange={e => setMode(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text }}>
            <option value="products">Directory</option>
            <option value="graphql">Advanced</option>
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees, products..."
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontSize: 14 }} />
          <button type="submit" style={btn()}>Search</button>
        </form>
      </div>
      {results && (
        <div style={{ ...layout.card, marginTop: 16 }}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Results</h3>
          <pre style={{ color: colors.text, fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
