import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useMembership } from '../../auth/useMembership';
import { supabase, mutate } from '../../lib/supabase';
import { Icon } from '../../components/Icon';

const card = { background: 'var(--card)', borderRadius: 20, padding: '18px 20px', border: '1px solid var(--lineSoft)' } as const;

function VitalInput({ label, value, onChange, placeholder, unit }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; unit: string }) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted2)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 9 }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ fontWeight: 800, fontSize: 30, color: 'var(--ink)', border: 'none', outline: 'none', width: '100%', background: 'transparent' }} />
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted2)' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function Signos({ setScreen }: { setScreen?: (id: string) => void }) {
  const { session } = useAuth();
  const { membership } = useMembership();
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [anomaly, setAnomaly] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!membership) return;
    setBusy(true);
    const [sys, dia] = bp.split('/').map((n) => parseInt(n, 10));
    const err = await mutate(supabase.from('vitals').insert({
      patient_id: membership.patient_id, recorded_by: session?.user.id,
      bp_sys: sys, bp_dia: dia, hr: Number(hr), temp_c: Number(temp), spo2: Number(spo2), note, has_anomaly: anomaly,
    }));
    if (err) { setBusy(false); alert('No se pudo guardar: ' + err); return; }
    await mutate(supabase.from('care_events').insert({
      patient_id: membership.patient_id, author_id: session?.user.id, type: 'vitals',
      title: 'Signos vitales', body: `PA ${bp} · FC ${hr} · ${temp}° · SpO₂ ${spo2}%`, severity: anomaly ? 'warning' : 'info',
    }));
    setBusy(false);
    setScreen?.('inicio');
  };

  return (
    <div>
      <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>Signos vitales</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginTop: 7 }}>Sra. Elena · nuevo control</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <VitalInput label="Presión arterial" value={bp} onChange={setBp} placeholder="120/80" unit="mmHg" />
            <VitalInput label="Frecuencia cardíaca" value={hr} onChange={setHr} placeholder="72" unit="lpm" />
            <VitalInput label="Temperatura" value={temp} onChange={setTemp} placeholder="36.5" unit="°C" />
            <VitalInput label="Saturación O₂" value={spo2} onChange={setSpo2} placeholder="97" unit="%" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--warnBg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="warningTri" size={20} color="var(--warnAmber)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>¿Alguna anomalía?</div>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted2)' }}>Avísale a la familia si algo cambia</div>
            </div>
            <div className="pressable" onClick={() => setAnomaly((a) => !a)} style={{ width: 48, height: 28, borderRadius: 99, background: anomaly ? 'var(--brand)' : '#E4EAE6', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 3, left: anomaly ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--lineSoft)', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 8 }}>Nota del control</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cómo pasó el turno…"
              style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink3)', width: '100%', minHeight: 60, border: 'none', outline: 'none', resize: 'vertical', background: 'transparent' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={save} className="hoverable" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--brand)', borderRadius: 18, height: 56, border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(92,138,119,.34)' }}>
            <Icon name="check" size={20} color="#fff" strokeWidth={2.2} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{busy ? 'Guardando…' : 'Guardar registro'}</span>
          </button>
          <div style={{ background: 'var(--tint3)', border: '1px solid var(--onBrand2)', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="warningCircle" size={16} color="var(--onTint)" strokeWidth={2} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--onTint)' }}>Se comparte con la familia</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--onTint)', lineHeight: 1.5, opacity: 0.85 }}>Lucía verá este control en cuanto lo guardes.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
