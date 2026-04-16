// =====================================================================
// VULN-070 (variant): DOM XSS via search param rendered in page
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// =====================================================================
import React, { useState } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('');

  function search() {
    // Injeta o resultado direto via innerHTML (DOM XSS)
    setResults(`<p>Resultados para: <b>${query}</b></p><p>Nenhum produto encontrado.</p>`);
  }

  return (
    <div>
      <h2>Search (DOM XSS)</h2>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder='Buscar... (tente <img src=x onerror=alert("XSS")>)'
        style={{ width: '70%', padding: 8 }}
      />
      <button onClick={search} style={{ padding: 8, marginLeft: 8 }}>Buscar</button>
      <div
        dangerouslySetInnerHTML={{ __html: results }}
        style={{ marginTop: 12, padding: 8, border: '1px solid #ddd', minHeight: 50 }}
      />
    </div>
  );
}
