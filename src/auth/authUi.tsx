import type { CSSProperties, ReactNode } from 'react';

export const inputStyle: CSSProperties = {
  border: '1px solid var(--line)', borderRadius: 14, padding: '13px 16px',
  fontWeight: 500, fontSize: 15, color: 'var(--ink)', width: '100%', outline: 'none',
};
export const errorStyle: CSSProperties = { fontWeight: 600, fontSize: 13, color: '#B4452F' };
export const primaryBtn: CSSProperties = {
  height: 52, borderRadius: 14, background: 'var(--brand)', color: '#fff',
  fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', width: '100%',
};

// Centered auth card on the page background.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--page)' }}>
      <div style={{ width: 420, maxWidth: '94vw', background: 'var(--card)', borderRadius: 24, border: '1px solid var(--line)', boxShadow: '0 20px 50px rgba(30,55,45,.14)', padding: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 26, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
