import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, layout, btn } from '../styles.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    if (data.token) {
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user_id', String(data.user.id));
      document.cookie = `session=${data.token}; path=/`;
      document.cookie = `role=${data.user.role}; path=/`;
      navigate('/dashboard');
    } else {
      setError(data.error || 'Authentication failed');
    }
  }

  async function handleRecover() {
    const email = prompt('Enter your email address:');
    if (!email) return;
    const r = await fetch(`/api/auth/reset-password?email=${encodeURIComponent(email)}`);
    const data = await r.json();
    alert(data.message || data.error);
  }

  return (
    <div style={{ paddingTop: 64, maxWidth: 420, margin: '0 auto' }}>
      <div style={layout.card}>
        <h1 style={{ color: colors.white, marginTop: 0, textAlign: 'center' }}>Sign In</h1>
        <p style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
          Access your Cyberdyne Systems account
        </p>
        {error && <div style={{ background: '#ff386020', border: `1px solid ${colors.danger}`, color: colors.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: colors.textMuted, fontSize: 13, display: 'block', marginBottom: 6 }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: colors.textMuted, fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ ...btn(), width: '100%', padding: 14, fontSize: 16 }}>Sign In</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="#" onClick={handleRecover} style={{ color: colors.accent, fontSize: 13, textDecoration: 'none' }}>Forgot password?</a>
        </p>
      </div>
    </div>
  );
}
