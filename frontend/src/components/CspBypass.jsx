// =====================================================================
// VULN-077  CSP BYPASS VIA unsafe-inline / unsafe-eval
// CWE-693  |  OWASP A05:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Usa eval() e inline event handlers, demonstrando que mesmo com CSP,
// se unsafe-inline e unsafe-eval estiverem habilitados, XSS funciona.
//
// VULN-076  SOURCE MAP EXPOSURE
// CWE-540  |  OWASP A05:2021  |  CVSS 3.7 (Low)
// ---------------------------------------------------------------------
// Vite gera source maps por padrão em dev. O bundle .js.map expõe
// todo o código fonte original, incluindo comentários com secrets.
// =====================================================================
import React, { useState } from 'react';

export default function CspBypass() {
  const [evalInput, setEvalInput] = useState('');
  const [evalResult, setEvalResult] = useState('');

  function runEval() {
    // VULN-077: eval() no client com input do usuario
    try {
      const result = eval(evalInput);
      setEvalResult(String(result));
    } catch (e) {
      setEvalResult('Error: ' + e.message);
    }
  }

  return (
    <div>
      <h2>CSP Bypass Lab</h2>

      <h3>VULN-077: eval() no browser</h3>
      <p>Digite JavaScript para executar (simula unsafe-eval habilitado):</p>
      <input
        type="text"
        value={evalInput}
        onChange={e => setEvalInput(e.target.value)}
        placeholder="document.cookie"
        style={{ width: '80%', padding: 8 }}
      />
      <button onClick={runEval} style={{ padding: 8, marginLeft: 8 }}>Eval</button>
      <pre style={{ background: '#1a1a1a', color: '#0f0', padding: 12, marginTop: 8 }}>
        {evalResult || 'resultado aparece aqui'}
      </pre>

      <h3>VULN-077b: Inline Event Handlers</h3>
      {/* eslint-disable-next-line */}
      <button onClick={() => { eval("alert('CSP bypass via inline handler')"); }}>
        Click me (inline eval)
      </button>

      <h3>VULN-076: Source Map Exposure</h3>
      <p style={{ fontSize: 12, color: '#666' }}>
        Em modo dev, Vite gera .js.map contendo o codigo fonte completo.
        Verifique em DevTools &gt; Sources &gt; webpack:// ou vite://
        <br />Todos os comentarios com secrets (VULN-080) sao visiveis no source map.
      </p>
    </div>
  );
}
