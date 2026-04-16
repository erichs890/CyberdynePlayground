// =====================================================================
// VULN-074  XSS STORED VIA innerHTML (Frontend rendering)
// CWE-79  |  OWASP A03:2021  |  CVSS 8.8 (High)
// ---------------------------------------------------------------------
// Busca comentários do backend (que armazena HTML bruto) e renderiza
// via dangerouslySetInnerHTML. Qualquer script salvo pelo VULN-003
// será executado ao carregar esta página.
// =====================================================================
import React, { useEffect, useState } from 'react';

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ product_id: '1', author: '', body: '' });

  function loadComments() {
    fetch(`/api/comments?product_id=${form.product_id}`)
      .then(r => r.json())
      .then(setComments)
      .catch(() => {});
  }

  useEffect(() => { loadComments(); }, []);

  async function submit(e) {
    e.preventDefault();
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    loadComments();
  }

  return (
    <div>
      <h2>Comments (Stored XSS Lab)</h2>
      <form onSubmit={submit} style={{ marginBottom: 16 }}>
        <input placeholder="Product ID" value={form.product_id}
          onChange={e => setForm({ ...form, product_id: e.target.value })} style={{ marginRight: 8 }} />
        <input placeholder="Author" value={form.author}
          onChange={e => setForm({ ...form, author: e.target.value })} style={{ marginRight: 8 }} />
        <input placeholder='Body (try <img src=x onerror=alert(1)>)' value={form.body}
          onChange={e => setForm({ ...form, body: e.target.value })} style={{ width: '40%', marginRight: 8 }} />
        <button type="submit">Post</button>
      </form>

      <button onClick={loadComments} style={{ marginBottom: 12 }}>Reload Comments</button>

      {comments.map(c => (
        <div key={c.id} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
          <strong>{c.author}</strong> <small>{c.created_at}</small>
          {/* VULN-074: innerHTML render — executa qualquer HTML/JS salvo */}
          <div dangerouslySetInnerHTML={{ __html: c.body }}
            style={{ marginTop: 4, padding: 4, background: '#fff8e1' }} />
        </div>
      ))}
    </div>
  );
}
