import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Signos from './Signos';

const insert = vi.fn(async (_row: Record<string, unknown>) => ({ error: null }));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => ({ insert }) },
  mutate: async (p: PromiseLike<{ error: { message: string } | null }>) => (await p).error?.message ?? null,
  hhmm: (s: string) => s,
}));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'n1' } } }) }));
vi.mock('../../auth/useMembership', () => ({ useMembership: () => ({ membership: { patient_id: 'p1' } }) }));

test('saving inserts vitals for the patient', async () => {
  render(<Signos />);
  fireEvent.change(screen.getByPlaceholderText('120/80'), { target: { value: '128/82' } });
  fireEvent.click(screen.getByText('Guardar registro'));
  await waitFor(() => expect(insert).toHaveBeenCalled());
  expect(insert.mock.calls[0][0].patient_id).toBe('p1');
});
