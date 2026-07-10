import { Icon } from '../components/Icon';

export default function Welcome({ goSignup, goLogin }: { goSignup: (role: 'nurse' | 'family') => void; goLogin: () => void }) {
  return (
    <div style={{ height: '100vh', background: 'linear-gradient(165deg,var(--brand),var(--brand2))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 760, maxWidth: '94vw', background: 'var(--card)', borderRadius: 28, boxShadow: '0 40px 90px rgba(30,55,45,.35)', padding: '56px 60px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 74, height: 74, borderRadius: 24, background: 'var(--tint)', border: '1px solid var(--tintLine)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="drop" size={36} color="var(--brand)" />
        </div>
        <div className="serif" style={{ fontSize: 54, color: 'var(--ink)', lineHeight: 1, marginTop: 20 }}>Vela</div>
        <div style={{ fontWeight: 500, fontSize: 16, color: 'var(--muted)', marginTop: 10 }}>Cuidado que acompaña, de día y de noche.</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginTop: 38, alignSelf: 'flex-start' }}>¿Cómo usarás Vela?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', marginTop: 14 }}>
          <RoleCard title="Soy enfermera/o" sub="Registro signos y novedades del turno" icon="pulse" iconBg="var(--tint)" iconColor="var(--onTint)" onClick={() => goSignup('nurse')} />
          <RoleCard title="Soy familiar" sub="Sigo el estado de mi ser querido" icon="user" iconBg="#F3EADF" iconColor="#B07A4E" onClick={() => goSignup('family')} />
        </div>
        <div style={{ marginTop: 30 }}>
          <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)' }}>¿Ya tienes cuenta? </span>
          <span className="pressable" style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand)' }} onClick={goLogin}>Iniciar sesión</span>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, sub, icon, iconBg, iconColor, onClick }: { title: string; sub: string; icon: 'pulse' | 'user'; iconBg: string; iconColor: string; onClick: () => void }) {
  return (
    <div className="pressable hoverable" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: 18, boxShadow: '0 6px 18px rgba(53,94,80,.06)', textAlign: 'left' }}>
      <div style={{ width: 50, height: 50, borderRadius: 15, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={24} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <Icon name="chevronRight" size={18} color="#C2CCC6" strokeWidth={2.4} />
    </div>
  );
}
