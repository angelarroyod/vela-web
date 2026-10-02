import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Button, RadioCard, TextField } from '../ui/controls';
import { Alert } from '../ui/feedback';
import { Screen, ScreenHeader, StepProgress } from '../ui/layout';

type Step = 'role' | 'patient' | 'code';

const ROLES = [
  ['nurse', 'Soy enfermera o enfermero', 'Anoto los signos, la medicación y cómo va el turno.'],
  ['family', 'Soy familiar', 'Quiero saber cómo está mi ser querido.'],
] as const;

// ponytail: reload so useMembership (keyed on the user id) fetches the new membership.
const done = () => window.location.reload();

// Signed in, no patient yet: Paso 2 (role) → Paso 3 (nurse: the patient · family: the invite code).
export default function Onboarding() {
  const { signOut } = useAuth();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'nurse' | 'family' | null>(null);
  const [form, setForm] = useState({ patient: '', age: '', room: '', code: '' });
  const [err, setErr] = useState('');
  const [failed, setFailed] = useState('');
  const [busy, setBusy] = useState(false);

  // A new step moves focus to its h1, like every other screen change. On mount too: a new account arrives here
  // from the signup form, which is gone.
  useEffect(() => {
    const h = document.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }, [step]);

  const goStep = (s: Step) => { setStep(s); setErr(''); setFailed(''); };
  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErr(''); };

  // The error, or null when it worked (then the page reloads into the app).
  const call = async (fn: string, args: Record<string, unknown>) => {
    setBusy(true); setFailed(''); setErr(''); // cleared first, so the same error twice is announced twice
    const { error } = await supabase.rpc(fn, args);
    if (error) setBusy(false);
    else done(); // stays busy until the reload lands: a second tap must not create a second patient
    return error;
  };

  if (step === 'role') {
    return (
      <Page step={2} onBack={() => void signOut()} backLabel="Cerrar sesión" onSubmit={() => (role ? goStep(role === 'nurse' ? 'patient' : 'code') : setErr('Elige una de las dos opciones.'))} cta="Continuar">
        <ScreenHeader title={<span id="role-q">¿Cómo vas a usar Lazo?</span>} size={34} />
        <div role="radiogroup" aria-labelledby="role-q" aria-describedby={err ? 'role-err' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROLES.map(([k, title, sub]) => (
            <RadioCard key={k} checked={role === k} onSelect={() => { setRole(k); setErr(''); }} title={title} description={sub} />
          ))}
        </div>
        {err && <p id="role-err" role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 700, fontSize: 'calc(var(--u)*15)' }}>{err}</p>}
      </Page>
    );
  }

  if (step === 'patient') {
    const submit = async () => {
      if (!form.patient.trim()) return setErr('Escribe el nombre del paciente.');
      const error = await call('create_patient_with_nurse', { p_name: form.patient.trim(), p_age: form.age ? Number(form.age) : null, p_room: form.room.trim() || null });
      if (error) setFailed('No se pudo crear el paciente. Revisa la conexión e inténtalo de nuevo.');
    };
    return (
      <Page step={3} onBack={() => goStep('role')} onSubmit={submit} cta="Empezar el turno" busy={busy} failed={failed}>
        <ScreenHeader title="¿A quién vas a cuidar?" size={34} />
        <TextField label="Nombre del paciente" value={form.patient} error={err} onChange={(e) => set('patient', e.target.value)} />
        <TextField label="Edad" inputMode="numeric" value={form.age} inputStyle={{ flex: 'none', width: 140 }}
          onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 3))} />
        <TextField label="Habitación" optional value={form.room} onChange={(e) => set('room', e.target.value)} />
      </Page>
    );
  }

  const n = form.code.length;
  const submit = async () => {
    if (n !== 6) return setErr(`El código tiene 6 caracteres. Has escrito ${n}.`);
    const error = await call('redeem_invite', { p_code: form.code });
    if (error) setErr(/invalid_or_expired_invite/.test(error.message) ? 'Ese código no es válido o ya caducó. Pídele uno nuevo a la enfermera.'
      : 'No se pudo comprobar el código. Revisa la conexión e inténtalo de nuevo.');
  };
  return (
    <Page step={3} onBack={() => goStep('role')} onSubmit={submit} cta="Unirme al cuidado" busy={busy}>
      <ScreenHeader title="Únete con un código" size={34} />
      <p style={{ margin: 0, fontSize: 'calc(var(--u)*17)', lineHeight: 1.45, color: 'var(--ink2)' }}>
        Pídeselo a la enfermera. Ella lo encuentra en <b style={{ color: 'var(--ink)' }}>Perfil → Invitar a la familia</b>.
      </p>
      <TextField label="Código de invitación" size="code" autoCapitalize="characters" autoComplete="one-time-code" value={form.code} error={err}
        hint={`6 letras o números. Llevas ${n}.`}
        onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
    </Page>
  );
}

// One onboarding step: progress, content, and the primary button at the bottom (Enter submits).
function Page({ step, onBack, backLabel, onSubmit, cta, busy = false, failed = '', children }: {
  step: number; onBack: () => void; backLabel?: string; onSubmit: () => void; cta: string; busy?: boolean; failed?: string; children: ReactNode;
}) {
  return (
    <main><Screen form gap={18} style={{ minHeight: '100dvh' }}>
      {/* Paso 2's back signs out: the account already exists, and onboarding has no other way out. */}
      <StepProgress step={step} onBack={onBack} backLabel={backLabel} />
      <form noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
        {failed && <Alert tone="danger" role="alert">{failed}</Alert>}
        <div style={{ marginTop: 'auto' }}><Button type="submit" disabled={busy}>{cta}</Button></div>
      </form>
    </Screen></main>
  );
}
