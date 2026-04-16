// =====================================================================
// VULN-070  DOM XSS VIA location.hash
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Lê location.hash e injeta via innerHTML sem sanitização.
// Payload: http://localhost:5173/dom-xss#<img src=x onerror=alert(1)>
//
// VULN-071  DOM XSS VIA innerHTML (user input)
// CWE-79  |  OWASP A03:2021  |  CVSS 6.1 (Medium)
// ---------------------------------------------------------------------
// Campo de texto renderizado via innerHTML (dangerouslySetInnerHTML).
// =====================================================================
import React, { useEffect, useState, useRef } from 'react';

export default function DomXss() {
  const hashRef = useRef(null);
  const [userInput, setUserInput] = useState('');

  // VULN-070: Lê hash da URL e injeta direto no DOM
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hashRef.current && hash) {
      hashRef.current.innerHTML = hash;  // DOM XSS direto
    }

    const onHashChange = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (hashRef.current) hashRef.current.innerHTML = h;
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div>
      <h2>DOM XSS Lab</h2>

      <h3>VULN-070: Hash-based DOM XSS</h3>
      <p>Conteudo do hash renderizado abaixo (sem sanitizacao):</p>
      <div ref={hashRef} style={{ border: '1px solid red', padding: 8, minHeight: 40 }}></div>
      <p style={{ fontSize: 12, color: '#666' }}>
        Teste: adicione #&lt;img src=x onerror=alert(1)&gt; na URL
      </p>

      <h3>VULN-071: innerHTML via input</h3>
      <input
        type="text"
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
        placeholder='Digite HTML: <b>bold</b> ou <img src=x onerror=alert(1)>'
        style={{ width: '100%', padding: 8 }}
      />
      {/* VULN-071: dangerouslySetInnerHTML com input do usuario */}
      <div
        dangerouslySetInnerHTML={{ __html: userInput }}
        style={{ border: '1px solid orange', padding: 8, marginTop: 8, minHeight: 40 }}
      />
    </div>
  );
}
