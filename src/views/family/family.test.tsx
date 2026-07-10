import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Mensajes from './Mensajes';

const insert = vi.fn(async (_row: Record<string, unknown>) => ({ error: null }));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => ({ insert }) },
  mutate: async (p: PromiseLike<{ error: { message: string } | null }>) => (await p).error?.message ?? null,
  hhmm: (s: string) => s,
}));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
vi.mock('../../auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));
vi.mock('../../care/hooks', () => ({ useMessages: () => [] }));

test('sending inserts a message', async () => {
  render(<Mensajes />);
  fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje…'), { target: { value: 'hola' } });
  fireEvent.click(screen.getByLabelText('Enviar'));
  await waitFor(() => expect(insert).toHaveBeenCalledWith({ patient_id: 'p1', sender_id: 'me', body: 'hola' }));
});
