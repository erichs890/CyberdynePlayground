import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { colors, layout } from '../styles.js';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : d.rows || [])).catch(() => {});
  }, []);

  const filtered = filter
    ? products.filter(p => p.category === filter || p.name?.toLowerCase().includes(filter.toLowerCase()))
    : products;

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ color: colors.white }}>Product Catalog</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['', 'hardware', 'pharma', 'food', 'chemistry', 'beverage', 'vehicle', 'crypto'].map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ padding: '6px 16px', background: filter === c ? colors.accent : colors.surfaceLight, color: filter === c ? colors.primary : colors.text, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {c || 'All'}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(p => (
          <Link key={p.id} to={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={layout.card}>
              <h3 style={{ color: colors.white, margin: '0 0 8px' }}>{p.name}</h3>
              <p style={{ color: colors.textMuted, fontSize: 13 }} dangerouslySetInnerHTML={{ __html: p.description }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ color: colors.accent, fontWeight: 700 }}>${p.price?.toLocaleString()}</span>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>{p.stock} units</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
