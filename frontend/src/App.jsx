// =====================================================================
// VulnHub Frontend — React SPA
// VULN-070..080 (Lote original) + VULN-201..217 (Browser Mimic)
// =====================================================================
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// Lote original (070..080)
import DomXss from './components/DomXss.jsx';
import StorageLeak from './components/StorageLeak.jsx';
import HiddenAdmin from './components/HiddenAdmin.jsx';
import CspBypass from './components/CspBypass.jsx';
import Comments from './components/Comments.jsx';
import SearchBar from './components/SearchBar.jsx';

// Lote 201..217 (Browser Mimic)
import DomXssAdvanced from './components/DomXssAdvanced.jsx';
import InsecureStorage from './components/InsecureStorage.jsx';
import PostMessageLab from './components/PostMessageLab.jsx';
import { AdminUsers, AdminSecrets, SqlConsole, DebugState } from './components/HiddenRoutes.jsx';

// VULN-213: secrets hardcoded no JS bundle (SAST target)
// eslint-disable-next-line
const INTERNAL_API_KEY = 'sk-cyberdyne-internal-FAKEFAKE1234';
// eslint-disable-next-line
const DB_CONN_STRING = 'postgresql://admin:admin123@db.cyberdyne.internal:5432/vulnhub';
// eslint-disable-next-line
const PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0FAKEKEY\n-----END RSA PRIVATE KEY-----';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 960, margin: '0 auto' }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Rotas visiveis (linkadas na nav) */}
          <Route path="/search" element={<SearchBar />} />
          <Route path="/dom-xss" element={<DomXss />} />
          <Route path="/dom-xss-advanced" element={<DomXssAdvanced />} />
          <Route path="/comments" element={<Comments />} />
          <Route path="/storage" element={<InsecureStorage />} />
          <Route path="/storage-legacy" element={<StorageLeak />} />
          <Route path="/csp-test" element={<CspBypass />} />
          <Route path="/postmessage" element={<PostMessageLab />} />

          {/* ============================================================
              VULN-212: HIDDEN ROUTES — sem link na UI, sem auth guard
              Descobriveis via: JS bundle inspection, directory brute-force,
              ou lendo este source code (source maps habilitados).
              ============================================================ */}
          <Route path="/admin-debug" element={<HiddenAdmin />} />
          <Route path="/internal/config" element={<HiddenAdmin />} />
          <Route path="/super-secret-panel" element={<HiddenAdmin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/secrets" element={<AdminSecrets />} />
          <Route path="/admin/sql-console" element={<SqlConsole />} />
          <Route path="/debug/state" element={<DebugState />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/_internal/health" element={<InternalHealth />} />
          <Route path="/dev/feature-flags" element={<FeatureFlags />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Header() {
  const loc = useLocation();
  const isHidden = loc.pathname.startsWith('/admin') || loc.pathname.startsWith('/debug') ||
                   loc.pathname.startsWith('/_internal') || loc.pathname.startsWith('/dev') ||
                   loc.pathname === '/super-secret-panel' || loc.pathname === '/internal/config';

  return (
    <div style={{ marginBottom: 24 }}>
      <h1>VulnHub API &amp; Web</h1>
      {isHidden && (
        <div style={{ background: '#d32f2f', color: '#fff', padding: 12, marginBottom: 12 }}>
          HIDDEN ROUTE: <code>{loc.pathname}</code> — esta rota nao possui link visivel nem auth guard.
        </div>
      )}
      <p style={{ color: 'crimson' }}>
        <b>AVISO:</b> aplicacao intencionalmente vulneravel. Alvo exclusivo do scanner CyberDyne.
      </p>
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/search">Search</Link>
        <Link to="/dom-xss">DOM XSS</Link>
        <Link to="/dom-xss-advanced">DOM XSS v2</Link>
        <Link to="/comments">Comments</Link>
        <Link to="/storage">Storage</Link>
        <Link to="/csp-test">CSP</Link>
        <Link to="/postmessage">PostMessage</Link>
        {/* Rotas ocultas NAO aparecem aqui — VULN-212 */}
      </nav>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Catalogo de Vulnerabilidades (118 backend + 17 frontend = 135 total)</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
        <div>
          <h3>Backend API</h3>
          <ul>
            <li>001..006 Injections (SQLi, XSS, SSRF, LFI, CmdInj)</li>
            <li>021..035 JWT / Auth / GraphQL / AI / Race</li>
            <li>036..055 Cloud Keys / S3 / Recon / Headers</li>
            <li>056..069 Upload / XXE / Deserialization / WP Fake</li>
            <li>081..118 NoSQL / Swagger / SSTI / Session / Advanced</li>
          </ul>
        </div>
        <div>
          <h3>Frontend SPA (Browser Mimic)</h3>
          <ul>
            <li>070..080 DOM XSS, Storage, Hidden Routes, CSP</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>201 CSP unsafe-inline + unsafe-eval</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>202 Missing Security Headers</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>203 DOM XSS via document.write</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>204 DOM XSS via $.html() sim</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>205 DOM XSS via javascript: URI</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>206 DOM Clobbering</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>207 JWT em localStorage</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>208 Refresh Token em localStorage</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>209 PII em sessionStorage</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>210 Cookie sem flags</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>211 Client-side auth bypass (role)</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>212 Hidden Admin Routes</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>213 Secrets em inline script + bundle</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>214 Tracking pixel sem consent</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>215 postMessage sem origin check</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>216 Iframe srcdoc sem sandbox</li>
            <li style={{ fontWeight: 'bold', color: '#d32f2f' }}>217 Version disclosure em HTML comments</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: '#fff3e0', fontSize: 12 }}>
        <b>Rotas ocultas (VULN-212):</b> /admin/users, /admin/secrets, /admin/sql-console,
        /admin/dashboard, /debug/state, /_internal/health, /dev/feature-flags, /super-secret-panel
      </div>
    </div>
  );
}

// VULN-212 extra: mais rotas ocultas inline
function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    fetch('/api/actuator/metrics').then(r => r.json()).then(setMetrics).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /admin/dashboard</h2>
      <p>Dashboard de metricas internas — sem autenticacao:</p>
      <pre style={pre}>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}

function InternalHealth() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/actuator/health').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /_internal/health</h2>
      <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function FeatureFlags() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: 'red' }}>HIDDEN: /dev/feature-flags</h2>
      <pre style={pre}>{JSON.stringify({
        admin_panel: { enabled: true, url: '/admin/dashboard' },
        debug_mode: { enabled: true, url: '/debug/state' },
        sql_console: { enabled: true, url: '/admin/sql-console' },
        maintenance_bypass: { enabled: true, token: 'GOD_MODE_2026' },
        beta_ai_chatbot: { enabled: true, url: '/api/chatbot' },
        hidden_signup: { enabled: true, url: '/api/users/register', note: 'Accepts role in body' },
        aws_integration: { enabled: true, key: 'AKIAIOSFODNN7EXAMPLE' },
        stripe_live: { enabled: true, key: 'sk_live_51FakeKeyThatLooksRealButIsNot' }
      }, null, 2)}</pre>
    </div>
  );
}

// useState needs to be imported for inline components
const { useState, useEffect } = React;

const pre = { background: '#1a1a2e', color: '#0f0', padding: 16, overflow: 'auto', fontSize: 11, maxHeight: 400 };
