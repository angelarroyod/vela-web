import { useAuth } from '../../auth/useAuth';
import { useMembership } from '../../auth/useMembership';
import { useTimeline } from '../../care/hooks';
import { supabase, mutate } from '../../lib/supabase';
import { Icon } from '../../components/Icon';

const recommendation = 'Vigilar la tos y ofrecer líquidos tibios. Avisar al médico si aparece fiebre.';

export default function Relevo({ setScreen }: { setScreen?: (id: string) => void }) {
  const { session } = useAuth();
  const { membership } = useMembership();
  const timeline = useTimeline(membership?.patient_id);

  const handover = async () => {
    if (!membership) return;
    const err = await mutate(supabase.from('shift_handoffs').insert({ patient_id: membership.patient_id, nurse_id: session?.user.id, summary: 'Turno sin novedades relevantes.', recommendation, ended_at: new Date().toISOString() }));
    if (err) { alert('No se pudo entregar el turno: ' + err); return; }
    setScreen?.('inicio');
  };

  return (
    <div>
      <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>Relevo de turno</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginTop: 7 }}>Resumen · 22:00 – 06:00</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 24, padding: '24px 26px', boxShadow: '0 6px 18px rgba(53,94,80,.05)' }}>
          {timeline.length === 0 ? <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted)' }}>Sin eventos registrados esta noche.</div> : (
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#E2EAE5' }} />
              {timeline.map((e, i) => {
                const anomaly = e.tone === 'anomaly';
                return (
                  <div key={i} style={{ display: 'flex', gap: 15, paddingBottom: i < timeline.length - 1 ? 18 : 0, position: 'relative' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: anomaly ? 'var(--anomalyDot)' : 'var(--brand)', border: '3px solid var(--card)', marginTop: 2, zIndex: 1 }} />
                    {anomaly ? (
                      <div style={{ flex: 1, background: 'var(--warnBg)', border: '1px solid var(--warnLine)', borderRadius: 14, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--warnInk)' }}>{e.title}</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--warnInk)' }}>{e.time}</span></div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--warnInk2)', marginTop: 3, lineHeight: 1.45 }}>{e.body}</div>
                      </div>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{e.title}</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted2)' }}>{e.time}</span></div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{e.body}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '18px 20px', boxShadow: '0 6px 18px rgba(53,94,80,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><Icon name="bulb" size={17} color="var(--brand)" strokeWidth={2} /><span style={{ fontWeight: 700, fontSize: 14, color: 'var(--onTint)' }}>Recomendación para el día</span></div>
            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink3)', lineHeight: 1.55 }}>{recommendation}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '15px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--rosaBg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--rosaInk)' }}>RG</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Rosa García</div><div style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted2)' }}>Recibe el turno de día · 06:00</div></div>
          </div>
          <button onClick={handover} className="hoverable" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--brand)', borderRadius: 18, height: 56, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(92,138,119,.34)' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Entregar turno al equipo de día</span>
          </button>
        </div>
      </div>
    </div>
  );
}
