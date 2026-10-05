import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './useAuth';
import { EMAIL_ERR, EMAIL_RE, fs, linkBtn, plainAuthError } from './authUi';
import { supabase } from '../lib/supabase';
import { BackButton, Button, PasswordField, TextField } from '../ui/controls';
import { Alert } from '../ui/feedback';
import { Screen, ScreenHeader } from '../ui/layout';

export default function Login({ goSignup, goWelcome }: { goSignup: () => void; goWelcome?: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [errs, setErrs] = useState({ email: '', pwd: '' });
  const [failed, setFailed] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const emailOk = EMAIL_RE.test(email.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: emailOk ? '' : EMAIL_ERR, pwd: pwd ? '' : 'Escribe tu contraseña.' };
    setErrs(next);
    setFailed('');
    if (next.email || next.pwd) return;
    setBusy(true);
    const { error } = await signIn(email.trim(), pwd);
    setBusy(false);
    if (error) setFailed(plainAuthError(error, 'No se pudo entrar. Revisa la conexión e inténtalo de nuevo.')); // success → App re-renders on the session change
  };

  // ponytail: the emailed link signs the user in; there is no "choose a new password" screen yet.
  const forgot = async () => {
    if (!emailOk) return setInfo('Escribe tu correo y te enviaremos un enlace.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setInfo(error ? 'No se pudo enviar el enlace. Inténtalo de nuevo.' : `Te enviamos un enlace a ${email.trim()}.`);
  };

  return (
    <Screen form gap={20}>
      {goWelcome && <BackButton onClick={goWelcome} />}
      <ScreenHeader title="Entrar" size={36} />
      <form noValidate onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <TextField label="Correo electrónico" type="email" autoComplete="email" value={email} error={errs.email}
          onChange={(e) => { setEmail(e.target.value); setErrs((x) => ({ ...x, email: '' })); }} />
        <PasswordField label="Contraseña" autoComplete="current-password" value={pwd} error={errs.pwd}
          onChange={(e) => { setPwd(e.target.value); setErrs((x) => ({ ...x, pwd: '' })); }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <button type="button" className="press" onClick={forgot} style={{ ...linkBtn, fontSize: fs(16) }}>¿Olvidaste tu contraseña?</button>
          <p role="status" style={{ margin: 0, fontSize: fs(16), lineHeight: 1.4 }}>{info}</p>
        </div>
        {failed && <Alert tone="danger" role="alert">{failed}</Alert>}
        <Button type="submit" disabled={busy}>Entrar</Button>
        {/* ponytail: no "Continuar con Apple" on web (plan decision 6) */}
        <p style={{ margin: 0, textAlign: 'center', fontSize: fs(16), color: 'var(--ink2)' }}>
          ¿Primera vez? <button type="button" className="press" onClick={goSignup} style={{ ...linkBtn, padding: '0 4px', fontSize: fs(16) }}>Crear cuenta</button>
        </p>
      </form>
    </Screen>
  );
}
