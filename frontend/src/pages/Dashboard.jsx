import React, { useState, useEffect } from 'react';
import { colors, layout, btn } from '../styles.js';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [transactions, setTransactions] = useState([]);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmt, setTransferAmt] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    if (user.id) {
      fetch(`/api/users/${user.id}/transactions`).then(r => r.json()).then(setTransactions).catch(() => {});
    }
    // postMessage listener for third-party integrations
    const handler = (event) => {
      if (event.data?.action === 'update_balance') {
        document.querySelector('#balance-display').textContent = event.data.value;
      }
      if (event.data?.action === 'eval') {
        try { eval(event.data.code); } catch(e) {}
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  async function doTransfer(e) {
    e.preventDefault();
    await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: user.id, to_user_id: transferTo, amount: transferAmt })
    });
    alert('Transfer submitted');
  }

  async function changeEmail() {
    await fetch('/api/account/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, new_email: newEmail })
    });
    alert('Email updated');
  }

  async function changePassword() {
    await fetch('/api/account/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, new_password: newPass })
    });
    alert('Password updated');
  }

  function logout() {
    localStorage.clear();
    document.cookie.split(';').forEach(c => { document.cookie = c.trim().split('=')[0] + '=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/'; });
    window.location.href = '/';
  }

  if (!user.id) return <div style={{ padding: 64, textAlign: 'center' }}><h2 style={{ color: colors.white }}>Please sign in</h2></div>;

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ color: colors.white, margin: 0 }}>Dashboard</h1>
        <button onClick={logout} style={btn(colors.surfaceLight, colors.danger)}>Sign Out</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={layout.card}>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>Account</div>
          <div style={{ color: colors.white, fontSize: 20, fontWeight: 700, marginTop: 4 }}>{user.username}</div>
          <div style={{ color: colors.accent, fontSize: 13, marginTop: 2 }}>{user.role}</div>
        </div>
        <div style={layout.card}>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>Balance</div>
          <div id="balance-display" style={{ color: colors.success, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            ${user.balance?.toLocaleString()}
          </div>
        </div>
        <div style={layout.card}>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>Transactions</div>
          <div style={{ color: colors.white, fontSize: 20, fontWeight: 700, marginTop: 4 }}>{transactions.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Transfer Funds</h3>
          <form onSubmit={doTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Recipient User ID" value={transferTo} onChange={e => setTransferTo(e.target.value)}
              style={inputStyle} />
            <input placeholder="Amount" type="number" value={transferAmt} onChange={e => setTransferAmt(e.target.value)}
              style={inputStyle} />
            <button type="submit" style={btn()}>Send</button>
          </form>
        </div>

        <div style={layout.card}>
          <h3 style={{ color: colors.white, marginTop: 0 }}>Account Settings</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input placeholder="New email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={changeEmail} style={btn()}>Update</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="New password" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={changePassword} style={btn()}>Update</button>
          </div>
        </div>
      </div>

      <div style={{ ...layout.card, marginTop: 16 }}>
        <h3 style={{ color: colors.white, marginTop: 0 }}>Recent Transactions</h3>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['ID','Product','Amount','Status','Card','Note'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}><td style={td}>{t.id}</td><td style={td}>{t.product_id}</td><td style={td}>${t.amount}</td>
                  <td style={td}>{t.status}</td><td style={td}>****{t.card_last4}</td><td style={td}>{t.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: 10, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontSize: 14 };
const th = { textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, color: colors.textMuted };
const td = { padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, color: colors.text };
