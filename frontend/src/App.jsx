import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { colors, layout, btn } from './styles.js';

import Shop from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Support from './pages/Support.jsx';
import Search from './pages/Search.jsx';
import Tools from './pages/Tools.jsx';

// Hidden routes (no links)
import AdminPanel from './pages/AdminPanel.jsx';
import DebugConsole from './pages/DebugConsole.jsx';

const INTERNAL_KEY = 'sk-cyberdyne-internal-FAKEFAKE1234';
const DB_URI = 'postgresql://admin:admin123@db.cyberdyne.internal:5432/main';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: colors.primary, minHeight: '100vh', color: colors.text }}>
        <Navbar />
        <div style={layout.page}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/support" element={<Support />} />
            <Route path="/search" element={<Search />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/users" element={<AdminPanel section="users" />} />
            <Route path="/admin/sql" element={<AdminPanel section="sql" />} />
            <Route path="/admin/config" element={<AdminPanel section="config" />} />
            <Route path="/debug" element={<DebugConsole />} />
            <Route path="/debug/state" element={<DebugConsole />} />
            <Route path="/_internal" element={<DebugConsole />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Navbar() {
  const loc = useLocation();
  const jwt = localStorage.getItem('jwt');
  const user = jwt ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  const linkStyle = (path) => ({
    color: loc.pathname === path ? colors.accent : colors.textMuted,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: loc.pathname === path ? 700 : 400,
    transition: 'color 0.2s'
  });

  return (
    <nav style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '0 24px' }}>
      <div style={{ ...layout.page, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/" style={{ color: colors.white, textDecoration: 'none', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            ⚙ CYBERDYNE
          </Link>
          <Link to="/shop" style={linkStyle('/shop')}>Store</Link>
          <Link to="/support" style={linkStyle('/support')}>Support</Link>
          <Link to="/tools" style={linkStyle('/tools')}>Tools</Link>
          <Link to="/search" style={linkStyle('/search')}>Search</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <span style={{ color: colors.accent, fontSize: 13 }}>
              <Link to="/dashboard" style={{ color: colors.accent, textDecoration: 'none' }}>
                {user.username} ({user.role})
              </Link>
            </span>
          ) : (
            <Link to="/login" style={btn()}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
    // store visit
    localStorage.setItem('last_visit', new Date().toISOString());
    localStorage.setItem('visitor_id', 'v_' + Math.random().toString(36).slice(2));
  }, []);

  return (
    <div style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: colors.white, margin: 0 }}>
          Cyberdyne Systems
        </h1>
        <p style={{ fontSize: 20, color: colors.textMuted, marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
          Advanced Defense Technology & AI Solutions. Building the future of automated security.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/shop" style={{ ...btn(), textDecoration: 'none', padding: '14px 32px', fontSize: 16 }}>
            Browse Products
          </Link>
          <Link to="/login" style={{ ...btn(colors.surfaceLight, colors.accent), textDecoration: 'none', padding: '14px 32px', fontSize: 16, border: `1px solid ${colors.accent}` }}>
            Partner Login
          </Link>
        </div>
      </div>

      <h2 style={{ fontSize: 24, color: colors.white, marginBottom: 24 }}>Featured Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {products.slice(0, 6).map(p => (
          <Link key={p.id} to={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={layout.card}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{['🔧','🤖','💊','💊','🍗','🔬','🍺','🚀','🔐','🍩'][p.id - 1] || '📦'}</div>
              <h3 style={{ color: colors.white, margin: '0 0 8px', fontSize: 16 }}>{p.name}</h3>
              <p style={{ color: colors.textMuted, fontSize: 13, margin: '0 0 12px' }} dangerouslySetInnerHTML={{ __html: p.description }} />
              <div style={{ color: colors.accent, fontWeight: 700, fontSize: 18 }}>
                ${p.price?.toLocaleString()}
              </div>
              <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 64, ...layout.card, textAlign: 'center' }}>
        <h2 style={{ color: colors.white, marginTop: 0 }}>AI Assistant</h2>
        <p style={{ color: colors.textMuted }}>Have questions? Ask our AI-powered support bot.</p>
        <Link to="/support" style={{ ...btn(), textDecoration: 'none' }}>Open Chat</Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${colors.border}`, padding: '32px 24px', textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
      <p>&copy; 2026 Cyberdyne Systems Corp. All rights reserved.</p>
      <p style={{ marginTop: 4 }}>
        <a href="https://cyberdyne-fake-404.example.com" style={{ color: colors.textMuted }}>Twitter</a> •{' '}
        <a href="https://linkedin-fake-404.example.com" style={{ color: colors.textMuted }}>LinkedIn</a> •{' '}
        <a href="/api/docs" style={{ color: colors.textMuted }}>API Docs</a>
      </p>
    </footer>
  );
}
