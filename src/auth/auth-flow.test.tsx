import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

const signIn = vi.fn(async () => ({ error: null }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ signIn }) }));

test('login submits credentials', async () => {
  render(<Login onDone={() => {}} goSignup={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByText('Iniciar sesión'));
  await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.com', 'secret123'));
});
