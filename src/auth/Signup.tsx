import { useState } from 'react';
import { useAuth } from './useAuth';
import { AuthCard, inputStyle, errorStyle, primaryBtn } from './authUi';

export default function Signup({ goLogin }: { role?: 'nurse' | 'family'; goLogin: () => void }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!consent) return;
    setBusy(true);
    setError(null);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (error) setError(error); // success → session appears → App shows Onboarding
  };

  return (
    <AuthCard title="Crea tu cuenta">
      <input style={inputStyle} placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input style={inputStyle} placeholder="correo@ejemplo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={inputStyle} placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <label className="pressable" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 500, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
        Acepto la política de privacidad y entiendo que Vela es una herramienta de registro de cuidados, no un dispositivo médico.
      </label>
      {error ? <div style={errorStyle}>{error}</div> : null}
      <button style={{ ...primaryBtn, opacity: consent ? 1 : 0.5 }} onClick={submit}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
      <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
        ¿Ya tienes cuenta? <span className="pressable" style={{ fontWeight: 700, color: 'var(--brand)' }} onClick={goLogin}>Iniciar sesión</span>
      </div>
    </AuthCard>
  );
}
