import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthFlow } from './AuthFlow';
import Login from './Login';
import Onboarding from './Onboarding';

const { rpc, reset } = vi.hoisted(() => ({ rpc: vi.fn(), reset: vi.fn() }));
const signIn = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();
vi.mock('./useAuth', () => ({ useAuth: () => ({ signIn, signUp, signOut }) }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc, auth: { resetPasswordForEmail: reset } } }));

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => vi.clearAllMocks());

test('welcome has one h1 and leads to login', () => {
  render(<AuthFlow />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus(); // also after signing out: the old button is gone
  expect(screen.getByRole('main')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
  expect(screen.getByRole('heading', { name: 'Entrar' })).toHaveFocus();
});

test('login: empty fields show alerts and do not call signIn', () => {
  render(<Login goSignup={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
  expect(alerts).toEqual(['Escribe tu correo completo, por ejemplo nombre@correo.com', 'Escribe tu contraseña.']);
  expect(signIn).not.toHaveBeenCalled();
});

test('login: wrong password is said in plain Spanish', async () => {
  signIn.mockResolvedValue({ error: 'Invalid login credentials' });
  render(<Login goSignup={() => {}} />);
  type('Correo electrónico', 'ana@correo.com');
  type('Contraseña', 'secreto123');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  expect(signIn).toHaveBeenCalledWith('ana@correo.com', 'secreto123');
});

test('login: an unknown or network error is never shown in raw English', async () => {
  signIn.mockResolvedValue({ error: 'TypeError: Failed to fetch' });
  render(<Login goSignup={() => {}} />);
  type('Correo electrónico', 'ana@correo.com');
  type('Contraseña', 'secreto123');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo entrar. Revisa la conexión e inténtalo de nuevo.');
});

test('login: forgot password sends the reset link', async () => {
  reset.mockResolvedValue({ error: null });
  render(<Login goSignup={() => {}} />);
  type('Correo electrónico', 'ana@correo.com');
  fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Te enviamos un enlace a ana@correo.com.'));
  expect(reset).toHaveBeenCalledWith('ana@correo.com');
});

test('signup: blocked without consent, then asks to confirm the email', async () => {
  signUp.mockResolvedValue({ error: null, needsConfirm: true });
  render(<AuthFlow />);
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  type('Tu nombre', 'Ana Ruiz');
  type('Correo electrónico', 'ana@correo.com');
  type('Contraseña', 'secreto123');
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Marca la casilla para continuar.');
  expect(signUp).not.toHaveBeenCalled();

  // the policy opens and comes back without losing what was typed
  fireEvent.click(screen.getByRole('button', { name: 'Leer la política de privacidad' }));
  expect(screen.getByRole('heading', { name: 'Privacidad y aviso médico' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
  expect(screen.getByLabelText('Tu nombre')).toHaveValue('Ana Ruiz');

  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText(/Te enviamos un correo a ana@correo.com/)).toBeInTheDocument();
  expect(signUp).toHaveBeenCalledWith('ana@correo.com', 'secreto123', 'Ana Ruiz');
});

test('onboarding: role → nurse → patient calls create_patient_with_nurse', async () => {
  rpc.mockResolvedValue({ error: { message: 'boom' } }); // an error, so the page does not reload
  render(<Onboarding />);
  expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '¿Cómo vas a usar Lazo?' })).toHaveFocus(); // arriving from signup
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' })); // the only way out of onboarding
  expect(signOut).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Elige una de las dos opciones.');
  expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Elige una de las dos opciones.');
  fireEvent.click(screen.getByRole('radio', { name: /Soy enfermera o enfermero/ }));
  expect(screen.getByRole('radio', { name: /Soy enfermera o enfermero/ })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

  expect(screen.getByRole('heading', { name: '¿A quién vas a cuidar?' })).toBeInTheDocument();
  type('Nombre del paciente', 'Pedro Gil');
  type('Edad', '8a1');
  fireEvent.click(screen.getByRole('button', { name: 'Empezar el turno' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo crear el paciente.');
  expect(rpc).toHaveBeenCalledWith('create_patient_with_nurse', { p_name: 'Pedro Gil', p_age: 81, p_room: null });
});

test('onboarding: family code counts characters and checks the length', () => {
  render(<Onboarding />);
  fireEvent.click(screen.getByRole('radio', { name: /Soy familiar/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  type('Código de invitación', 'vx7-k');
  expect(screen.getByLabelText('Código de invitación')).toHaveValue('VX7K');
  expect(screen.getByText('6 letras o números. Llevas 4.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Unirme al cuidado' }));
  expect(screen.getByRole('alert')).toHaveTextContent('El código tiene 6 caracteres. Has escrito 4.');
  expect(rpc).not.toHaveBeenCalled();
});

test('onboarding: a bad code and a lost connection get different messages', async () => {
  rpc.mockResolvedValueOnce({ error: { message: 'invalid_or_expired_invite' } }).mockResolvedValueOnce({ error: { message: 'TypeError: Failed to fetch' } });
  render(<Onboarding />);
  fireEvent.click(screen.getByRole('radio', { name: /Soy familiar/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  type('Código de invitación', 'VX7K2P');
  fireEvent.click(screen.getByRole('button', { name: 'Unirme al cuidado' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Ese código no es válido o ya caducó.');
  expect(rpc).toHaveBeenCalledWith('redeem_invite', { p_code: 'VX7K2P' });
  fireEvent.click(screen.getByRole('button', { name: 'Unirme al cuidado' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo comprobar el código. Revisa la conexión'));
});
