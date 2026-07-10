import { useMembership } from '../../auth/useMembership';
import { useTimeline } from '../../care/hooks';
import { Icon, type IconName } from '../../components/Icon';

const chip = { fontWeight: 600, fontSize: 12, background: 'var(--chipBg)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: 99 } as const;

function Task({ icon, iconBg, iconColor, title, sub, time, dashed }: { icon: IconName; iconBg: string; iconColor: string; title: string; sub: string; time: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--page)', border: `1px ${dashed ? 'dashed' : 'solid'} var(--lineSoft)`, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} color={iconColor} strokeWidth={1.8} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted2)' }}>{sub}</div>
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{time}</span>
    </div>
  );
}

export default function Inicio({ setScreen }: { setScreen?: (id: string) => void }) {
  const { membership } = useMembership();
  const timeline = useTimeline(membership?.patient_id).slice(-2).reverse();

  return (
    <div>
      <div className="serif" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1.1 }}>Buenas noches, Carmen</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginTop: 7 }}>Turno nocturno · 22:00 – 06:00</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 24, padding: 22, border: '1px solid var(--lineSoft)', boxShadow: '0 6px 20px rgba(53,94,80,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="serif" style={{ width: 58, height: 58, borderRadius: 18, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, color: 'var(--onTint)', border: '1px solid var(--tintLine)' }}>E</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Sra. Elena Rivas</div>
                <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>78 años · Habitación principal</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--tint)', padding: '7px 13px', borderRadius: 99 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)' }} /><span style={{ fontWeight: 700, fontSize: 12, color: 'var(--onTint)' }}>Estable</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <span style={{ ...chip, color: 'var(--muted)' }}>Hipertensión</span>
              <span style={{ ...chip, color: 'var(--muted)' }}>Movilidad reducida</span>
              <span style={{ ...chip, color: 'var(--warnInk)', background: 'var(--warnBg)', borderColor: 'var(--warnLine)' }}>Alergia · Penicilina</span>
            </div>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 24, padding: 22, border: '1px solid var(--lineSoft)', boxShadow: '0 6px 18px rgba(53,94,80,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Próximas tareas</span>
              <span className="pressable" style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)' }}>Ver todas</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Task icon="pill" iconBg="var(--warnBg)" iconColor="#C0913F" title="Medicación" sub="Losartán 50 mg" time="23:30" />
              <Task icon="pulse" iconBg="var(--tint)" iconColor="var(--brand)" title="Signos vitales" sub="Control de rutina" time="00:00" />
              <Task icon="plus" iconBg="var(--tint)" iconColor="var(--brand)" title="Cambio de posición" sub="Prevención de úlceras" time="03:00" dashed />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="pressable hoverable" onClick={() => setScreen?.('signos')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--brand)', borderRadius: 18, height: 58, boxShadow: '0 10px 24px rgba(92,138,119,.34)' }}>
            <Icon name="plus" size={20} color="#fff" strokeWidth={2} /><span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Registrar signos vitales</span>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 24, padding: '20px 22px', border: '1px solid var(--lineSoft)', boxShadow: '0 6px 18px rgba(53,94,80,.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 14 }}>Esta noche</div>
            {timeline.length === 0 ? <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)' }}>Sin registros aún.</div> : (
              <div style={{ position: 'relative', paddingLeft: 6 }}>
                <div style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: '#E2EAE5' }} />
                {timeline.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < timeline.length - 1 ? 14 : 0, position: 'relative' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--brand)', border: '3px solid var(--card)', marginTop: 3, zIndex: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{e.title}</span><span style={{ fontWeight: 600, fontSize: 11, color: 'var(--muted2)' }}>{e.time}</span></div>
                      <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{e.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
