import { useAuth } from '../../auth/useAuth';
import { useMembership } from '../../auth/useMembership';
import { useMedications } from '../../care/hooks';
import { supabase, mutate } from '../../lib/supabase';
import { Icon } from '../../components/Icon';
import type { Medication } from '../../care/data';

export default function Medicacion() {
  const { session } = useAuth();
  const { membership } = useMembership();
  const meds = useMedications(membership?.patient_id);
  const done = meds.filter((m) => m.status === 'administered').length;
  const total = meds.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const administer = async (m: Medication) => {
    if (!m.id || !membership) return;
    const err = await mutate(supabase.from('medications').update({ status: 'administered', administered_by: session?.user.id, administered_at: new Date().toISOString() }).eq('id', m.id));
    if (err) { alert('No se pudo registrar la dosis: ' + err); return; }
    await mutate(supabase.from('care_events').insert({ patient_id: membership.patient_id, author_id: session?.user.id, type: 'medication', title: 'Medicación administrada', body: `${m.name} ${m.dose}`, severity: 'info' }));
  };

  return (
    <div>
      <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>Medicación</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginTop: 7 }}>Sra. Elena · martes 26 jun</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {meds.length === 0 ? <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted)' }}>Sin medicación registrada.</div> : meds.map((m) => {
            const pending = m.status === 'pending';
            return (
              <div key={m.id ?? m.name} className={pending ? 'pressable' : ''} onClick={pending ? () => administer(m) : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card)', border: `1px ${pending ? 'dashed' : 'solid'} var(--lineSoft)`, borderRadius: 16, padding: '15px 18px' }}>
                {pending
                  ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card)', border: '2px solid #C9D3CD' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={17} color="#fff" strokeWidth={2.6} /></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{m.name} <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted2)' }}>{m.dose}</span></div>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted2)' }}>{m.reason}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{m.time}</div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: pending ? 'var(--warnAmber)' : 'var(--brand)' }}>{m.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 20, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Dosis de hoy</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--brand)' }}>{done} de {total}</span>
            </div>
            <div style={{ height: 9, background: 'var(--line)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99 }} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--warnBg)', border: '1px solid var(--warnLine)', borderRadius: 18, padding: '15px 17px' }}>
            <Icon name="bell" size={17} color="#C0913F" strokeWidth={2} />
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--warnInk2)', lineHeight: 1.45 }}>Te avisaremos antes de la próxima dosis · en ayunas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
