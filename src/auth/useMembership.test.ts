import { act, renderHook } from '@testing-library/react';
import { pickActiveMembership, useMembership } from './useMembership';

const { select } = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({ select }) } }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'u1' } } }) }));

test('prefers nurse, else first, else null', () => {
  expect(
    pickActiveMembership([
      { role: 'family', patient_id: 'p' },
      { role: 'nurse', patient_id: 'q' },
    ]),
  ).toEqual({ role: 'nurse', patient_id: 'q' });
  expect(pickActiveMembership([{ role: 'family', patient_id: 'p' }])).toEqual({ role: 'family', patient_id: 'p' });
  expect(pickActiveMembership([])).toBeNull();
});

test('a failed fetch is not "no membership": it stays loading and retries', async () => {
  vi.useFakeTimers();
  select.mockResolvedValueOnce({ data: null, error: { message: 'TypeError: Failed to fetch' } })
    .mockResolvedValueOnce({ data: [{ role: 'nurse', patient_id: 'p' }], error: null });
  const { result } = renderHook(() => useMembership());
  await act(async () => {});
  expect(result.current.loading).toBe(true); // not onboarding
  await act(() => vi.advanceTimersByTimeAsync(3000));
  expect(result.current).toEqual({ loading: false, membership: { role: 'nurse', patient_id: 'p' } });
  vi.useRealTimers();
});
