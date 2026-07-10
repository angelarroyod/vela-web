import { useState } from 'react';
import { useAuth } from './useAuth';
import { AuthCard, inputStyle, errorStyle, primaryBtn } from './authUi';

export default function Login({ goSignup }: { onDone?: () => void; goSignup: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error); // success → App re-renders on session change
  };

  return (
    <AuthCard title="Bienvenido de nuevo">
      <input style={inputStyle} placeholder="correo@ejemplo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={inputStyle} placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? <div style={errorStyle}>{error}</div> : null}
      <button style={primaryBtn} onClick={submit}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
      <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
        ¿No tienes cuenta? <span className="pressable" style={{ fontWeight: 700, color: 'var(--brand)' }} onClick={goSignup}>Crear cuenta</span>
      </div>
    </AuthCard>
  );
}
