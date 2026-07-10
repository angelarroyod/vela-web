import { Icon } from '../../components/Icon';

const chip = { fontWeight: 600, fontSize: 13, background: 'var(--chipBg)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: 99 } as const;

export default function Perfil() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="serif" style={{ width: 66, height: 66, borderRadius: 20, background: 'var(--tint)', border: '1px solid var(--tintLine)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 31, color: 'var(--onTint)' }}>E</div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.05 }}>Elena Rivas</div>
          <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted2)', marginTop: 4 }}>78 años · En casa</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--tint)', padding: '7px 13px', borderRadius: 99 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)' }} /><span style={{ fontWeight: 700, fontSize: 12, color: 'var(--onTint)' }}>Estable</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '20px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>Condiciones</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ ...chip, color: 'var(--muted)' }}>Hipertensión</span>
              <span style={{ ...chip, color: 'var(--muted)' }}>Hipotiroidismo</span>
              <span style={{ ...chip, color: 'var(--muted)' }}>Movilidad reducida</span>
              <span style={{ ...chip, color: 'var(--warnInk)', background: 'var(--warnBg)', borderColor: 'var(--warnLine)' }}>Alergia · Penicilina</span>
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '20px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 14 }}>Contactos de emergencia</div>
            <Contact initials="DM" bg="var(--docBlueBg)" fg="var(--docBlue)" name="Dr. Méndez" sub="Cardiología" divider />
            <Contact initials="L" bg="var(--tint2)" fg="var(--onTint)" name="Lucía Rivas" sub="Hija · contacto principal" />
          </div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '20px 22px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 16 }}>Equipo de cuidado</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Member initials="CM" bg="var(--tint2)" fg="var(--onTint)" name="Carmen Morales" sub="Enfermera · turno de noche" tag="En turno" />
            <Member initials="RG" bg="var(--rosaBg)" fg="var(--rosaInk)" name="Rosa García" sub="Enfermera · turno de día" />
            <Member initials="DM" bg="var(--docBlueBg)" fg="var(--docBlue)" name="Dr. Méndez" sub="Cardiología" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Contact({ initials, bg, fg, name, sub, divider }: { initials: string; bg: string; fg: string; name: string; sub: string; divider?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: divider ? '0 0 13px' : '13px 0 0', borderBottom: divider ? '1px solid var(--line)' : undefined }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: fg }}>{initials}</div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{name}</div><div style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted2)' }}>{sub}</div></div>
      <a href="tel:" aria-label={`Llamar a ${name}`} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={17} color="var(--onTint)" /></a>
    </div>
  );
}

function Member({ initials, bg, fg, name, sub, tag }: { initials: string; bg: string; fg: string; name: string; sub: string; tag?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: fg }}>{initials}</div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{name}</div><div style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted2)' }}>{sub}</div></div>
      {tag ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--tint)', padding: '5px 10px', borderRadius: 99 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} /><span style={{ fontWeight: 700, fontSize: 11, color: 'var(--onTint)' }}>{tag}</span></div> : null}
    </div>
  );
}
