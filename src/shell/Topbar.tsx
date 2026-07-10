import { Icon } from '../components/Icon';

export function Topbar() {
  return (
    <div style={{ height: 64, flexShrink: 0, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>Miércoles 26 de junio · 23:14</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--tint)', padding: '7px 13px', borderRadius: 99 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)' }} />
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--onTint)' }}>Elena · Estable</span>
        </div>
        <Icon name="bell" size={20} color="#7C8A82" />
      </div>
    </div>
  );
}
