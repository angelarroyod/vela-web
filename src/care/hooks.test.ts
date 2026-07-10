import { mapVital, mapMed, mapMessage } from './hooks';

test('mapVital formats bp', () => {
  expect(mapVital({ bp_sys: 128, bp_dia: 82, hr: 72, temp_c: 36.7, spo2: 97, taken_at: '2026-07-03T00:02:00Z', note: '' }).bp).toBe('128/82');
});
test('mapMed pending sub', () => {
  expect(mapMed({ name: 'X', dose: '1', reason: 'r', scheduled_at: '2026-07-03T06:00:00Z', status: 'pending' }).sub).toBe('Próxima');
});
test('mapMessage self', () => {
  expect(mapMessage({ sender_id: 'me', body: 'h', created_at: '2026-07-03T00:00:00Z' }, 'me').fromSelf).toBe(true);
  expect(mapMessage({ sender_id: 'nurse', body: 'h', created_at: '2026-07-03T00:00:00Z' }, 'me').fromSelf).toBe(false);
});
