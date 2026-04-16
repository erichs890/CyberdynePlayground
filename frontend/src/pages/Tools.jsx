import React, { useState } from 'react';
import { colors, layout, btn } from '../styles.js';

export default function Tools() {
  const [pingHost, setPingHost] = useState('');
  const [pingResult, setPingResult] = useState('');
  const [urlToFetch, setUrlToFetch] = useState('');
  const [fetchResult, setFetchResult] = useState('');
  const [template, setTemplate] = useState('');
  const [templateResult, setTemplateResult] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  async function runPing(e) {
    e.preventDefault();
    const r = await fetch('/api/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: pingHost })
    });
    const data = await r.json();
    setPingResult(data.result || data.stdout || data.error || JSON.stringify(data));
  }

  async function runFetch(e) {
    e.preventDefault();
    const r = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlToFetch)}`);
    const data = await r.json();
    setFetchResult(JSON.stringify(data, null, 2));
  }

  async function renderTemplate(e) {
    e.preventDefault();
    const r = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Report', body: template })
    });
    const data = await r.json();
    setTemplateResult(data.content || JSON.stringify(data));
  }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ color: colors.white }}>Network Tools</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Connectivity Check</h3>
          <form onSubmit={runPing} style={{ display: 'flex', gap: 8 }}>
            <input value={pingHost} onChange={e => setPingHost(e.target.value)} placeholder="hostname or IP"
              style={inputStyle} />
            <button type="submit" style={btn()}>Ping</button>
          </form>
          {pingResult && <pre style={pre}>{pingResult}</pre>}
        </div>

        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>URL Inspector</h3>
          <form onSubmit={runFetch} style={{ display: 'flex', gap: 8 }}>
            <input value={urlToFetch} onChange={e => setUrlToFetch(e.target.value)} placeholder="https://example.com"
              style={inputStyle} />
            <button type="submit" style={btn()}>Fetch</button>
          </form>
          {fetchResult && <pre style={pre}>{fetchResult}</pre>}
        </div>

        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Report Generator</h3>
          <form onSubmit={renderTemplate}>
            <textarea value={template} onChange={e => setTemplate(e.target.value)}
              placeholder="Write report content. Use {{variables}} for dynamic data."
              style={{ ...inputStyle, width: '100%', height: 80, resize: 'vertical', boxSizing: 'border-box' }} />
            <button type="submit" style={{ ...btn(), marginTop: 8 }}>Generate</button>
          </form>
          {templateResult && <pre style={pre}>{templateResult}</pre>}
        </div>

        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>File Download</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="filename.pdf"
              style={inputStyle} />
            <a href={`/api/download?file=${fileUrl}`} target="_blank" rel="noreferrer" style={{ ...btn(), textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { flex: 1, padding: 10, borderRadius: 6, border: `1px solid #1e3456`, background: '#162a4a', color: '#e0e6ed', fontSize: 14 };
const pre = { background: '#0a1020', color: '#00d4ff', padding: 12, borderRadius: 8, overflow: 'auto', fontSize: 12, marginTop: 12, maxHeight: 200 };
