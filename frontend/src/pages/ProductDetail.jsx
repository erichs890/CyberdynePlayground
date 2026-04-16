import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { colors, layout, btn } from '../styles.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ author: '', body: '' });
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetch(`/api/products?id=${id}`).then(r => r.json()).then(d => setProduct(d.rows?.[0] || d[0])).catch(() => {});
    fetch(`/api/comments?product_id=${id}`).then(r => r.json()).then(setComments).catch(() => {});
  }, [id]);

  async function postComment(e) {
    e.preventDefault();
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, ...form })
    });
    setForm({ author: '', body: '' });
    fetch(`/api/comments?product_id=${id}`).then(r => r.json()).then(setComments);
  }

  async function addToCart() {
    const userId = localStorage.getItem('user_id') || '1';
    await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, price: product.price, quantity: qty, user_id: userId })
    });
    alert('Added to cart!');
  }

  if (!product) return <p style={{ padding: 32, color: colors.textMuted }}>Loading...</p>;

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={layout.card}>
        <h1 style={{ color: colors.white, marginTop: 0 }}>{product.name}</h1>
        <p style={{ color: colors.textMuted, fontSize: 16 }} dangerouslySetInnerHTML={{ __html: product.description }} />
        <div style={{ fontSize: 28, color: colors.accent, fontWeight: 700, margin: '16px 0' }}>
          ${product.price?.toLocaleString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="-99" max="999"
            style={{ width: 80, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text }} />
          <button onClick={addToCart} style={btn()}>Add to Cart</button>
        </div>
      </div>

      <div style={{ ...layout.card, marginTop: 24 }}>
        <h2 style={{ color: colors.white, marginTop: 0 }}>Reviews</h2>
        {comments.map(c => (
          <div key={c.id} style={{ borderBottom: `1px solid ${colors.border}`, padding: '12px 0' }}>
            <strong style={{ color: colors.accent }}>{c.author}</strong>
            <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>{c.created_at}</span>
            <div style={{ marginTop: 4, color: colors.text }} dangerouslySetInnerHTML={{ __html: c.body }} />
          </div>
        ))}
        <form onSubmit={postComment} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input placeholder="Your name" value={form.author} onChange={e => setForm({...form, author: e.target.value})}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text }} />
          <input placeholder="Write a review..." value={form.body} onChange={e => setForm({...form, body: e.target.value})}
            style={{ flex: 3, padding: 10, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surfaceLight, color: colors.text }} />
          <button type="submit" style={btn()}>Post</button>
        </form>
      </div>
    </div>
  );
}
