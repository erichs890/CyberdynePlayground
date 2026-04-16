export const colors = {
  primary: '#0a1628',
  accent: '#00d4ff',
  danger: '#ff3860',
  surface: '#0f1f3a',
  surfaceLight: '#162a4a',
  text: '#e0e6ed',
  textMuted: '#7a8ba3',
  border: '#1e3456',
  white: '#ffffff',
  success: '#23d160'
};

export const layout = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16
  },
  cardHover: {
    background: colors.surfaceLight,
    border: `1px solid ${colors.accent}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export const btn = (bg = colors.accent, color = colors.primary) => ({
  padding: '10px 24px',
  background: bg,
  color,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
  transition: 'opacity 0.2s'
});
