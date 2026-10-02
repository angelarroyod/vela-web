// Bits shared by the Login and Signup screens.
export const fs = (n: number) => `calc(var(--u)*${n})`;

export const EMAIL_RE = /.+@.+\..+/;
export const EMAIL_ERR = 'Escribe tu correo completo, por ejemplo nombre@correo.com';

// Supabase answers in English: say it in plain Spanish, never raw. `fallback` covers the rest (mostly no connection).
export const plainAuthError = (msg: string, fallback: string) =>
  /invalid login credentials/i.test(msg) ? 'Correo o contraseña incorrectos.'
  : /email not confirmed/i.test(msg) ? 'Aún no has confirmado tu correo. Abre el enlace que te enviamos y vuelve a entrar.'
  : /already registered/i.test(msg) ? 'Ya hay una cuenta con ese correo. Entra con tu contraseña.'
  : /rate limit|security purposes/i.test(msg) ? 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.'
  : /password/i.test(msg) ? 'Esa contraseña es demasiado fácil. Prueba con una más larga, con letras y números.'
  : /is invalid|invalid format/i.test(msg) ? EMAIL_ERR
  : fallback;

// Text-styled button ("¿Olvidaste tu contraseña?", "Leer la política de privacidad").
export const linkBtn = { minHeight: 48, border: 'none', background: 'none', padding: 0, fontWeight: 700, color: 'var(--priText)', textDecoration: 'underline' } as const;
