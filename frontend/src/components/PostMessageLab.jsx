// =====================================================================
// VULN-215  POSTMESSAGE HANDLER SEM VALIDACAO DE ORIGIN
// CWE-345  |  OWASP A04:2021  |  CVSS 7.5 (High)
// Escuta window.message sem verificar event.origin. Aceita comandos:
//   - action:"eval"  → executa code arbitrario
//   - action:"steal" → retorna localStorage+sessionStorage+cookies
//   - action:"redirect" → redireciona para URL arbitraria
//   - action:"inject" → injeta HTML no DOM
//
// VULN-216  IFRAME SANDBOX BYPASS (srcdoc com JS)
// CWE-1021  |  OWASP A05:2021  |  CVSS 6.1 (Medium)
// Renderiza iframe com srcdoc controlado pelo usuario, sem sandbox.
// =====================================================================
import React, { useEffect, useState, useRef } from 'react';

export default function PostMessageLab() {
  const [messages, setMessages] = useState([]);
  const [iframeSrc, setIframeSrc] = useState('<h1>Hello</h1><script>document.write("JS executou dentro do iframe!")</script>');
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      // VULN-215: NENHUMA verificacao de event.origin
      const entry = {
        time: new Date().toISOString(),
        origin: event.origin,
        data: event.data
      };
      setMessages(prev => [entry, ...prev].slice(0, 50));

      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.action) {
        case 'eval':
          try { eval(event.data.code); } catch (e) { console.error(e); }
          break;
        case 'steal':
          event.source?.postMessage({
            type: 'stolen_data',
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            cookies: document.cookie,
            config: window.__APP_CONFIG__
          }, '*');
          break;
        case 'redirect':
          window.location.href = event.data.url;
          break;
        case 'inject':
          document.body.insertAdjacentHTML('beforeend', event.data.html);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  function testSteal() {
    window.postMessage({ action: 'steal' }, '*');
  }

  function testEval() {
    window.postMessage({ action: 'eval', code: 'alert("VULN-215: postMessage eval executed!")' }, '*');
  }

  function testInject() {
    window.postMessage({
      action: 'inject',
      html: '<div style="position:fixed;top:0;left:0;right:0;background:red;color:white;padding:12px;z-index:99999;text-align:center">VULN-215: HTML injected via postMessage!</div>'
    }, '*');
  }

  return (
    <div>
      <h2>PostMessage + Iframe Lab (VULN-215..216)</h2>

      <section style={{ border: '1px solid #e44', padding: 16, marginBottom: 16 }}>
        <h3>VULN-215: postMessage sem origin check</h3>
        <p style={{ fontSize: 12 }}>O handler aceita qualquer origem e executa comandos arbitrarios.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={testSteal} style={btn('#f44336')}>Steal Data</button>
          <button onClick={testEval} style={btn('#ff9800')}>Eval Alert</button>
          <button onClick={testInject} style={btn('#9c27b0')}>Inject HTML</button>
        </div>

        <p style={{ fontSize: 12, color: '#666' }}>
          De outro site/iframe: <code>targetWindow.postMessage({'{'} action:"steal" {'}'}, "*")</code>
        </p>

        <h4>Mensagens recebidas:</h4>
        <div style={{ maxHeight: 200, overflow: 'auto', background: '#1a1a2e', padding: 8 }}>
          {messages.length === 0 && <p style={{ color: '#666', fontSize: 12 }}>Nenhuma mensagem</p>}
          {messages.map((m, i) => (
            <pre key={i} style={{ color: '#0f0', fontSize: 10, margin: '4px 0' }}>
              [{m.time}] origin={m.origin} data={JSON.stringify(m.data).slice(0, 200)}
            </pre>
          ))}
        </div>
      </section>

      <section style={{ border: '1px solid #09e', padding: 16 }}>
        <h3>VULN-216: Iframe srcdoc sem sandbox</h3>
        <p style={{ fontSize: 12 }}>Conteudo HTML/JS renderizado em iframe sem atributo sandbox:</p>
        <textarea
          value={iframeSrc}
          onChange={e => setIframeSrc(e.target.value)}
          style={{ width: '100%', height: 80, fontFamily: 'monospace', padding: 8, fontSize: 12 }}
        />
        <button onClick={() => {
          if (iframeRef.current) iframeRef.current.srcdoc = iframeSrc;
        }} style={{ ...btn('#2196f3'), marginTop: 8 }}>Render in Iframe</button>

        {/* VULN-216: iframe sem sandbox — JS no srcdoc executa livremente */}
        <iframe
          ref={iframeRef}
          srcdoc={iframeSrc}
          style={{ width: '100%', height: 150, border: '2px solid #09e', marginTop: 8 }}
          /* sem sandbox attribute de proposito */
        />
      </section>
    </div>
  );
}

const btn = (bg) => ({ padding: '8px 16px', background: bg, color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 4 });
