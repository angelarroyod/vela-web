import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Ajustes from './Ajustes';
import Privacidad from './Privacidad';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
const go = vi.fn(), toast = vi.fn(), signOut = vi.fn();
vi.mock('../../care/useCare', () => ({
  useCare: () => ({ go, toast, me: { id: 'u1', email: 'ana@correo.com', fullName: 'Ana Ruiz' }, patient: { fullName: 'Pedro Gil' } }),
}));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ signOut }) }));
vi.mock('../../lib/supabase', () => ({ supabase: { functions: { invoke } } }));

beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

test('ajustes: account, back to perfil, text size A+ updates the label', () => {
  render(<Ajustes />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByText('ana@correo.com')).toBeInTheDocument();
  // at the bound: aria-disabled (stays focusable) and a no-op
  const smaller = screen.getByRole('button', { name: 'Texto más pequeño' });
  expect(smaller).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(smaller);
  expect(screen.getByText('100 %')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Texto más grande' }));
  expect(screen.getByText('110 %')).toBeInTheDocument();
  expect(smaller).toHaveAttribute('aria-disabled', 'false');
  expect(document.documentElement.style.getPropertyValue('--u')).toBe('1.1px');
  fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
  expect(go).toHaveBeenCalledWith('perfil');
});

test('ajustes: delete account confirms, then signs out; a failure toasts', async () => {
  invoke.mockResolvedValueOnce({ error: new Error('x') }).mockResolvedValueOnce({ error: null });
  render(<Ajustes />);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('El cuidado de Pedro seguirá para el resto del equipo.');
  fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('No se pudo eliminar la cuenta. Inténtalo de nuevo.'));
  expect(signOut).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }));
  await waitFor(() => expect(signOut).toHaveBeenCalled());
  expect(invoke).toHaveBeenCalledWith('delete-account');
});

test('privacidad: legal copy with Lazo and the back action', () => {
  const back = vi.fn();
  render(<Privacidad onBack={back} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Privacidad y aviso médico' })).toBeInTheDocument();
  expect(screen.getByText('Lazo no es un aparato médico. No diagnostica ni sustituye a un profesional de la salud.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
  expect(back).toHaveBeenCalled();
});
