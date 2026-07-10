import { useMembership } from '../../auth/useMembership';
import { useVitals } from '../../care/hooks';
import { Icon } from '../../components/Icon';

function Glance({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 16, padding: '15px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted2)' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 21, color: 'var(--ink)', marginTop: 5 }}>{value}{unit ? <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted2)' }}> {unit}</span> : null}</div>
    </div>
  );
}

export default function Estado({ setScreen }: { setScreen?: (id: string) => void }) {
  const { membership } = useMembership();
  const v = useVitals(membership?.patient_id)[0];
  return (
    <div>
      <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted2)' }}>Hola, Lucía</div>
      <div className="serif" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1.1, marginTop: 3 }}>¿Cómo está mamá?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ background: 'linear-gradient(160deg,var(--brand),var(--brandDeep))', borderRadius: 26, padding: 30, color: '#fff', boxShadow: '0 16px 34px rgba(72,112,98,.32)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--onBrand2)' }} /><span style={{ fontWeight: 700, fontSize: 12, color: 'var(--onBrand)', letterSpacing: '.04em' }}>EN CASA · ATENDIDA AHORA</span></div>
          <div className="serif" style={{ fontSize: 40, lineHeight: 1.12, marginTop: 14, maxWidth: 420 }}>Elena está estable y descansando</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 26, background: 'rgba(255,255,255,.13)', borderRadius: 16, padding: '12px 14px', maxWidth: 420 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--tint3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--onTint)' }}>CM</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Carmen está con ella</div><div style={{ fontWeight: 500, fontSize: 12, color: 'var(--onBrand2)' }}>Enfermera · turno de noche</div></div>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--onBrand2)' }}>hace 4 min</span>
          </div>
          <div className="pressable" onClick={() => setScreen?.('mensajes')} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 18, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 99, padding: '10px 18px' }}>
            <Icon name="message" size={16} color="#fff" /><span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Escribir a Carmen</span>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>Últimos signos{v ? ` · ${v.takenAt}` : ''}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Glance label="Presión" value={v ? v.bp : '—'} />
            <Glance label="Pulso" value={v ? String(v.hr) : '—'} unit={v ? 'lpm' : undefined} />
            <Glance label="Temperatura" value={v ? v.tempC.toFixed(1) : '—'} unit={v ? '°C' : undefined} />
            <Glance label="Saturación" value={v ? String(v.spo2) : '—'} unit={v ? '%' : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
