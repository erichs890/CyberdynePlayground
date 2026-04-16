// =====================================================================
// VULN-203  DOM XSS VIA document.write()
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// Escreve conteudo de URLSearchParams direto no DOM via document.write.
//
// VULN-204  DOM XSS VIA JQUERY-LIKE $.html() SIMULATION
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// Simula pattern jQuery onde .html() injeta input do usuario.
//
// VULN-205  DOM XSS VIA document.location (sink)
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// Lê URL param e usa em document.location sem validação → javascript: URI.
//
// VULN-206  DOM CLOBBERING
// CWE-79  |  OWASP A03:2021  |  CVSS 5.4 (Medium)
// Elementos com id/name que sobrescrevem propriedades do DOM global.
// =====================================================================
import React, { useEffect, useRef, useState } from 'react';

export default function DomXssAdvanced() {
  const writeRef = useRef(null);
  const jqueryRef = useRef(null);
  const [locationInput, setLocationInput] = useState('');
  const [clobberHtml, setClobberHtml] = useState('');

  // VULN-203: document.write via URL search param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('inject');
    if (payload && writeRef.current) {
      // Cria iframe e usa document.write nele (simula o pattern sem destruir a pagina)
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;height:150px;border:2px solid red';
      writeRef.current.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(`<html><body style="font-family:monospace">
        <h4>document.write output:</h4>${payload}</body></html>`);
      iframe.contentDocument.close();
    }
  }, []);

  // VULN-204: Simulação de $.html() — innerHTML direto
  function jquerySimHtml() {
    const input = document.getElementById('jquery-input')?.value || '';
    if (jqueryRef.current) {
      jqueryRef.current.innerHTML = input;
    }
  }

  // VULN-205: javascript: URI via location
  function navigateUnsafe() {
    // Sem filtrar javascript: scheme → executa JS
    if (locationInput) {
      window.location.href = locationInput;
    }
  }

  return (
    <div>
      <h2>DOM XSS Advanced Lab (VULN-203..206)</h2>

      <section style={{ border: '1px solid #e44', padding: 16, marginBottom: 16 }}>
        <h3>VULN-203: document.write via URL param</h3>
        <p style={{ fontSize: 12, color: '#666' }}>
          Teste: adicione <code>?inject=&lt;img src=x onerror=alert('VULN-203')&gt;</code> na URL desta pagina.
        </p>
        <div ref={writeRef} style={{ minHeight: 40, background: '#fff5f5' }}></div>
      </section>

      <section style={{ border: '1px solid #e90', padding: 16, marginBottom: 16 }}>
        <h3>VULN-204: jQuery $.html() simulation</h3>
        <input id="jquery-input" type="text"
          placeholder='<img src=x onerror=alert("VULN-204")>'
          style={{ width: '70%', padding: 8 }} />
        <button onClick={jquerySimHtml} style={{ padding: 8, marginLeft: 8 }}>$.html()</button>
        <div ref={jqueryRef} style={{ marginTop: 8, padding: 8, background: '#fff8e1', minHeight: 40 }}></div>
      </section>

      <section style={{ border: '1px solid #09e', padding: 16, marginBottom: 16 }}>
        <h3>VULN-205: javascript: URI via location</h3>
        <input
          value={locationInput}
          onChange={e => setLocationInput(e.target.value)}
          placeholder="javascript:alert(document.cookie)"
          style={{ width: '70%', padding: 8 }}
        />
        <button onClick={navigateUnsafe} style={{ padding: 8, marginLeft: 8 }}>Navigate</button>
        <p style={{ fontSize: 12, color: '#666' }}>
          Teste: <code>javascript:alert(document.domain)</code>
        </p>
      </section>

      <section style={{ border: '1px solid #90e', padding: 16, marginBottom: 16 }}>
        <h3>VULN-206: DOM Clobbering</h3>
        <p style={{ fontSize: 12 }}>Injete HTML com elementos que sobrescrevem globals:</p>
        <input
          value={clobberHtml}
          onChange={e => setClobberHtml(e.target.value)}
          placeholder='<form id="document"><input name="cookie" value="clobbered"></form>'
          style={{ width: '90%', padding: 8 }}
        />
        <div dangerouslySetInnerHTML={{ __html: clobberHtml }}
          style={{ marginTop: 8, padding: 8, background: '#f5f0ff', minHeight: 40 }} />
        <button onClick={() => {
          try {
            const result = document.getElementById('document');
            alert('document.getElementById("document") = ' + result?.outerHTML?.slice(0, 200));
          } catch (e) { alert(e.message); }
        }} style={{ marginTop: 8, padding: 8 }}>Check DOM Clobbering</button>
      </section>
    </div>
  );
}
