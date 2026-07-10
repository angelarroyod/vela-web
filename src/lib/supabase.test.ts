import { hhmm } from './supabase';

test('hhmm formats an ISO time as HH:MM', () => {
  expect(hhmm('2026-07-03T00:02:00Z')).toMatch(/^\d{2}:\d{2}$/);
});
