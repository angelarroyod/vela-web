import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './useAuth';
import { EMAIL_ERR, EMAIL_RE, fs, linkBtn, plainAuthError } from './authUi';
import { Button, CheckboxRow, TextField } from '../ui/controls';
import { Alert } from '../ui/feedback';
import { Screen, ScreenHeader, StepProgress } from '../ui/layout';

const NO_ERRS = { name: '', email: '', pwd: '', accept: '' };

// Paso 1 de 3. Kept mounted (hidden) while the privacy policy is open, so the form survives the round trip.
export default function Signup({ goLogin, goWelcome, goPrivacy }: { goLogin: () => void; goWelcome?: () => void; goPrivacy?: () => void }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', pwd: '' });
  const [accepted, setAccepted] = useState(false);
  const [errs, setErrs] = useState(NO_ERRS);
  const [failed, setFailed] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);

  const field = (k: keyof typeof form) => ({
    value: form[k],
    error: errs[k],
    onChange: (e: { target: { value: string } }) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrs((x) => ({ ...x, [k]: '' })); },
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    const next = {
      name: form.name.trim() ? '' : 'Escribe tu nombre.',
      email: EMAIL_RE.test(email) ? '' : EMAIL_ERR,
      pwd: form.pwd.length >= 8 ? '' : 'La contraseña necesita al menos 8 letras o números.',
      accept: accepted ? '' : 'Marca la casilla para continuar.',
    };
    setErrs(next);
    setFailed('');
    setSentTo(''); // a stale "Te enviamos un correo a …" must not sit next to a new error
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    const { error, needsConfirm } = await signUp(email, form.pwd, form.name.trim());
    setBusy(false);
    if (error) setFailed(plainAuthError(error, 'No se pudo crear la cuenta. Revisa la conexión e inténtalo de nuevo.'));
    else if (needsConfirm) setSentTo(email); // otherwise the new session takes App to onboarding
  };

  return (
    <Screen form gap={18}>
      <StepProgress step={1} onBack={goWelcome} />
      <ScreenHeader title="Crea tu cuenta" size={34} />
      <form noValidate onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <TextField label="Tu nombre" autoComplete="name" {...field('name')} />
        <TextField label="Correo electrónico" type="email" autoComplete="email" {...field('email')} />
        <TextField label="Contraseña" type="password" autoComplete="new-password" hint="Al menos 8 letras o números." {...field('pwd')} />
        <CheckboxRow checked={accepted} describedBy={errs.accept ? 'accept-err' : undefined} onChange={(v) => { setAccepted(v); setErrs((x) => ({ ...x, accept: '' })); }}>
          Acepto la política de privacidad. Entiendo que Lazo sirve para anotar cuidados y <b>no es un aparato médico</b>.
        </CheckboxRow>
        {goPrivacy && (
          <button type="button" className="press" onClick={goPrivacy} style={{ ...linkBtn, alignSelf: 'flex-start', marginTop: -8, fontSize: fs(15) }}>
            Leer la política de privacidad
          </button>
        )}
        {errs.accept && <p id="accept-err" role="alert" style={{ margin: '-8px 0 0', color: 'var(--danger)', fontWeight: 700, fontSize: fs(15) }}>{errs.accept}</p>}
        {failed && <Alert tone="danger" role="alert">{failed}</Alert>}
        <Button type="submit" disabled={busy}>Continuar</Button>
        <div role="status">
          {sentTo && (
            <Alert tone="info" action={<Button variant="outline" size="md" onClick={goLogin}>Ir a Entrar</Button>}>
              Te enviamos un correo a {sentTo}. Ábrelo para confirmar tu cuenta y después entra con tu correo y contraseña.
            </Alert>
          )}
        </div>
      </form>
    </Screen>
  );
}
