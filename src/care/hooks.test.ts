import { renderHook, waitFor, act } from '@testing-library/react';
import { mapVital, mapMed, mapEvent, mapMessage, mapHandoff, mapPatient, useHandoffs, refetchLive } from './hooks';

const order = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
  hhmm: (s: string) => s.slice(11, 16),
}));

test('mapVital keeps numbers', () => {
  const v = mapVital({ id: 'v', bp_sys: 128, bp_dia: 82, hr: 72, temp_c: '36.7', spo2: 97, taken_at: '2026-07-03T00:02:00Z', note: null, has_anomaly: null, recorded_by: 'n' });
  expect(v).toEqual({ id: 'v', sys: 128, dia: 82, hr: 72, temp: 36.7, spo2: 97, takenAt: '2026-07-03T00:02:00Z', time: '00:02', note: '', hasAnomaly: false, recordedBy: 'n' });
});

test('mapMed status and given time', () => {
  const r = { id: 'm', name: 'X', dose: null, reason: 'r', scheduled_at: '2026-07-03T06:00:00Z', status: 'pending', administered_at: null };
  expect(mapMed(r)).toMatchObject({ status: 'pending', time: '06:00', atTime: '', dose: '' });
  expect(mapMed({ ...r, dose: '1 g', scheduled_at: null, status: 'administered', administered_at: '2026-07-03T05:52:00Z' }))
    .toMatchObject({ status: 'administered', time: '', atTime: '05:52', dose: '1 g' });
});

test('mapEvent tone from severity', () => {
  const e = { id: 'e', type: 'note', title: null, body: null, severity: 'warning', occurred_at: '2026-07-03T01:15:00Z', author_id: 'n' };
  expect(mapEvent(e)).toMatchObject({ title: '', body: '', tone: 'anomaly', time: '01:15', authorId: 'n' });
  expect(mapEvent({ ...e, severity: 'info' }).tone).toBe('normal');
});

test('mapMessage self', () => {
  const r = { id: '1', sender_id: 'me', body: 'h', created_at: '2026-07-03T00:00:00Z' };
  expect(mapMessage(r, 'me')).toMatchObject({ fromSelf: true, senderId: 'me' });
  expect(mapMessage({ ...r, sender_id: 'nurse' }, 'me').fromSelf).toBe(false);
});

test('mapHandoff and mapPatient defaults', () => {
  expect(mapHandoff({ id: 'h', nurse_id: 'n', summary: null, recommendation: 'r', ended_at: '2026-07-03T05:52:00Z' }))
    .toEqual({ id: 'h', nurseId: 'n', summary: '', recommendation: 'r', endedAt: '2026-07-03T05:52:00Z', time: '05:52' });
  expect(mapPatient({ id: 'p', full_name: 'Ana Ruiz', age: 80, room: null, status: null }))
    .toEqual({ id: 'p', fullName: 'Ana Ruiz', age: 80, room: null, status: 'Estable', conditions: [], allergies: [] });
});

test('a live list keeps its last rows when a refetch fails (offline)', async () => {
  order
    .mockResolvedValueOnce({ data: [{ id: 'h', nurse_id: null, summary: null, recommendation: null, ended_at: null }], error: null })
    .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } });
  const { result } = renderHook(() => useHandoffs('p'));
  await waitFor(() => expect(result.current).toHaveLength(1));
  await act(async () => { refetchLive(); });
  expect(order).toHaveBeenCalledTimes(2);
  expect(result.current).toHaveLength(1);
});
