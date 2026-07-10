import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthCard, inputStyle, errorStyle, primaryBtn } from './authUi';

const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function Onboarding() {
  const [step, setStep] = useState<'role' | 'nurse' | 'family'>('role');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [room, setRoom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = () => window.location.reload(); // reload so useMembership refetches → shell

  const createPatient = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc('create_patient_with_nurse', { p_name: name.trim(), p_age: age ? Number(age) : null, p_room: room.trim() || null });
    setBusy(false);
    if (error) setError(error.message); else done();
  };
  const redeem = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc('redeem_invite', { p_code: normalizeCode(code) });
    setBusy(false);
    if (error) setError('Código inválido o expirado'); else done();
  };

  if (step === 'role') {
    return (
      <AuthCard title="¿Cómo usarás Vela?">
        <button style={primaryBtn} onClick={() => setStep('nurse')}>Soy enfermera/o</button>
        <button style={{ ...primaryBtn, background: '#B07A4E' }} onClick={() => setStep('family')}>Soy familiar</button>
      </AuthCard>
    );
  }
  if (step === 'nurse') {
    return (
      <AuthCard title="Datos del paciente">
        <input style={inputStyle} placeholder="Nombre del paciente" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Edad" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        <input style={inputStyle} placeholder="Habitación (opcional)" value={room} onChange={(e) => setRoom(e.target.value)} />
        {error ? <div style={errorStyle}>{error}</div> : null}
        <button style={primaryBtn} onClick={createPatient}>{busy ? 'Creando…' : 'Continuar'}</button>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Código de invitación">
      <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>Pídele a la enfermera el código de 6 caracteres.</div>
      <input style={{ ...inputStyle, letterSpacing: 4, textAlign: 'center', fontWeight: 700, fontSize: 20 }} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value)} />
      {error ? <div style={errorStyle}>{error}</div> : null}
      <button style={primaryBtn} onClick={redeem}>{busy ? 'Uniéndote…' : 'Unirme'}</button>
    </AuthCard>
  );
}
