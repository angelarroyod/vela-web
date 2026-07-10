import { useAuth } from '../auth/useAuth';
import { Icon, type IconName } from '../components/Icon';

type NavItem = { id: string; label: string; icon: IconName };
const NURSE_NAV: NavItem[] = [
  { id: 'inicio', label: 'Inicio del turno', icon: 'home' },
  { id: 'signos', label: 'Signos vitales', icon: 'pulse' },
  { id: 'meds', label: 'Medicación', icon: 'pill' },
  { id: 'relevo', label: 'Relevo de turno', icon: 'clipboard' },
];
const FAMILY_NAV: NavItem[] = [
  { id: 'inicio', label: 'Estado de mamá', icon: 'home' },
  { id: 'actividad', label: 'Actividad', icon: 'pulse' },
  { id: 'mensajes', label: 'Mensajes', icon: 'message' },
  { id: 'perfil', label: 'Perfil de Elena', icon: 'user' },
];

export function Sidebar({ role, screen, setScreen }: { role: 'nurse' | 'family'; screen: string; setScreen: (id: string) => void }) {
  const { signOut } = useAuth();
  const nav = role === 'nurse' ? NURSE_NAV : FAMILY_NAV;
  const initials = role === 'nurse' ? 'CM' : 'L';
  const name = role === 'nurse' ? 'Carmen Morales' : 'Lucía Rivas';
  const sub = role === 'nurse' ? 'Enfermera · noche' : 'Hija · contacto principal';

  return (
    <div style={{ background: 'var(--card)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', padding: '22px 16px 18px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="drop" size={17} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>Vela</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--page)', border: '1px solid var(--line)', borderRadius: 16, padding: '11px 12px', marginTop: 22 }}>
        <div className="serif" style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--tint)', border: '1px solid var(--tintLine)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--onTint)' }}>E</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Elena Rivas</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />
            <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--onTint)' }}>Estable · En casa</span>
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--faint)', letterSpacing: '.08em', padding: '0 10px', margin: '22px 0 8px' }}>CUIDADO</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {nav.map((n) => {
          const active = screen === n.id;
          return (
            <div key={n.id} className="side-item pressable" onClick={() => setScreen(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: active ? 'var(--tint)' : 'transparent' }}>
              <Icon name={n.icon} size={21} color="var(--onTint)" />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink2)' }}>{n.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 20 }}>
        {role === 'nurse' ? (
          <div style={{ background: 'linear-gradient(160deg,var(--brand),var(--brandDeep))', borderRadius: 16, padding: '14px 15px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--onBrand2)' }} />
              <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--onBrand)', letterSpacing: '.05em' }}>EN TURNO</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 7 }}>Turno nocturno</div>
            <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--onBrand2)', marginTop: 2 }}>22:00 – 06:00 · junto a Elena</div>
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--tint2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--onTint)' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{name}</div>
            <div style={{ fontWeight: 500, fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
          </div>
          <div className="side-item pressable" title="Cerrar sesión" onClick={() => signOut()} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="switch" size={16} color="#7C8A82" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
