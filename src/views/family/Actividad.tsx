import { useMembership } from '../../auth/useMembership';
import { useCareEvents } from '../../care/hooks';
import { Icon } from '../../components/Icon';

export default function Actividad() {
  const { membership } = useMembership();
  const feed = useCareEvents(membership?.patient_id);

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>Actividad</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginTop: 7 }}>Hoy</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
        {feed.length === 0 ? <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted)' }}>Sin novedades aún.</div> : feed.map((e, i) => {
          const anomaly = e.tone === 'anomaly';
          return (
            <div key={i} style={{ background: anomaly ? 'var(--warnBg)' : 'var(--card)', border: `1px solid ${anomaly ? 'var(--warnLine)' : 'var(--lineSoft)'}`, borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                {anomaly
                  ? <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--warnChip)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="warningCircle" size={16} color="#B58A2E" strokeWidth={2.2} /></div>
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--tint2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--onTint)' }}>{e.initials}</div>}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: anomaly ? 'var(--warnInk)' : 'var(--ink)' }}>{e.who}</span>{' '}
                  <span style={{ fontWeight: 500, fontSize: 14, color: anomaly ? 'var(--warnInk2)' : 'var(--muted2)' }}>{e.action}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 12, color: anomaly ? 'var(--warnInk)' : 'var(--faint)' }}>{e.time}</span>
              </div>
              {e.chips ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {e.chips.map((c) => <span key={c} style={{ fontWeight: 700, fontSize: 12, color: 'var(--onTint)', background: 'var(--tint3)', padding: '6px 10px', borderRadius: 9 }}>{c}</span>)}
                </div>
              ) : null}
              {e.body ? <div style={{ fontWeight: 500, fontSize: 14, color: anomaly ? 'var(--warnInk2)' : 'var(--ink3)', lineHeight: 1.5, marginTop: 10 }}>{e.body}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
