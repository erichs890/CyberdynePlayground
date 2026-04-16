import React, { useState } from 'react';
import { colors, layout, btn } from '../styles.js';

export default function Support() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m the Cyberdyne Systems support assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: colors.white }}>Support Chat</h1>
      <div style={{ ...layout.card, height: 480, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              margin: '8px 0',
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '10px 16px',
                borderRadius: 12,
                background: m.role === 'user' ? colors.accent : colors.surfaceLight,
                color: m.role === 'user' ? colors.primary : colors.text,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div style={{ color: colors.textMuted, fontSize: 13, padding: 8 }}>Typing...</div>}
        </div>
        <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..."
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text, fontSize: 14 }} />
          <button type="submit" style={btn()} disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
}
