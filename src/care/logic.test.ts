import {
  VITALS, checkVital, unreadCount, vitalMessage, parseDec, fmtDec, isFever, greeting, dayLabel, firstName, initials, aLas,
  feverState, nextStep, handoffSummary, pendingTasks, watchText,
} from './logic';
import type { NextStepInput } from './logic';

const [sys, , , temp] = VITALS;

test('checkVital accepts comma or dot decimals', () => {
  expect(checkVital(temp, '')).toBe('empty');
  expect(checkVital(temp, null)).toBe('empty');
  expect(checkVital(temp, '36,7')).toBe('ok');
  expect(checkVital(temp, '36.7')).toBe('ok');
  expect(checkVital(temp, '38,2')).toBe('high');
  expect(checkVital(temp, '35')).toBe('low');
  expect(checkVital(temp, 37.5)).toBe('ok');
  expect(checkVital(temp, '12abc')).toBe('invalid');
  expect(checkVital(temp, 'Infinity')).toBe('invalid');
  expect(checkVital(temp, '380')).toBe('invalid'); // typo for 38,0: implausible, never saved
  expect(checkVital(temp, '45')).toBe('high');
  expect(parseDec(' 36,5 ')).toBe(36.5);
});

test('vitalMessage uses the design copy', () => {
  expect(vitalMessage(sys, 'ok')).toBe('Dentro de lo normal');
  expect(vitalMessage(sys, 'high')).toBe('Más alto de lo normal (normal: 90 a 140)');
  expect(vitalMessage(sys, 'low')).toBe('Más bajo de lo normal (normal: 90 a 140)');
  expect(vitalMessage(sys, 'invalid')).toBe('Escribe solo números, por ejemplo 72');
  expect(vitalMessage(temp, 'invalid', '380')).toBe('Revisa el número: no parece un valor real (normal: 36,0 a 37,5)');
  expect(vitalMessage(temp, 'empty')).toBe('Normal: 36,0 a 37,5 °C');
});

test('formatting helpers', () => {
  expect(fmtDec(36.7)).toBe('36,7');
  expect(fmtDec(null)).toBe('—');
  expect(isFever(37.5)).toBe(false);
  expect(isFever(37.6)).toBe(true);
  expect(isFever(null)).toBe(false);
  expect(greeting(new Date(2026, 5, 30, 5, 59))).toBe('Buenas noches');
  expect(greeting(new Date(2026, 5, 30, 6, 0))).toBe('Buenos días');
  expect(greeting(new Date(2026, 5, 30, 12, 0))).toBe('Buenas tardes');
  expect(greeting(new Date(2026, 5, 30, 20, 0))).toBe('Buenas noches');
  expect(dayLabel(new Date(2026, 5, 30))).toBe('martes 30 de junio');
  expect(firstName('  Carmen  Morales ')).toBe('Carmen');
  expect(firstName(null)).toBe('');
  expect(initials('carmen morales ruiz')).toBe('CM');
  expect(initials('')).toBe('');
  expect(aLas('01:15')).toBe('a la 01:15');
  expect(aLas('06:00')).toBe('a las 06:00');
});

test('feverState: open until a doctor_notified event after the reading', () => {
  const v = { temp: 38.2, takenAt: '2026-06-30T00:02:00Z', time: '00:02' };
  expect(feverState(undefined, [])).toBeNull();
  expect(feverState({ ...v, temp: 36.7 }, [])).toBeNull();
  expect(feverState(v, [])).toEqual({ temp: 38.2, time: '00:02', notified: false, notifiedAt: undefined });
  const before = { type: 'doctor_notified', occurredAt: '2026-06-29T23:00:00Z', time: '23:00' };
  const after = { type: 'doctor_notified', occurredAt: '2026-06-30T00:05:00Z', time: '00:05' };
  expect(feverState(v, [before])?.notified).toBe(false);
  expect(feverState(v, [after, before])).toMatchObject({ notified: true, notifiedAt: '00:05' });
});

test('nextStep priority: fever → first vitals → med → handoff → done', () => {
  const base: NextStepInput = { fever: null, feverNotified: false, hasVitals: true, nextMed: null, handoffDone: false, patientFirst: 'Ana', nextShiftName: '' };
  const fever = nextStep({ ...base, fever: { temp: 38.2, time: '00:02' } });
  expect(fever).toMatchObject({ eyebrow: 'AVISA AL MÉDICO', title: 'Fiebre de 38,2 °C a las 00:02', cta: 'Ya avisé al médico', target: 'notify', tone: 'danger' });
  expect(nextStep({ ...base, fever: { temp: 38.2, time: '00:02' }, feverNotified: true }).target).toBe('relevo');
  expect(nextStep({ ...base, hasVitals: false })).toMatchObject({ title: 'Registrar los primeros signos vitales', target: 'signos', tone: 'hero' });
  expect(nextStep({ ...base, hasVitals: false }).sub).toContain('primer turno con Ana');
  expect(nextStep({ ...base, nextMed: { name: 'Levotiroxina', dose: '50 mcg', time: '06:00' } })).toMatchObject({ title: 'Dar Levotiroxina 50 mcg a las 06:00', target: 'meds' });
  expect(nextStep({ ...base, nextShiftName: 'Rosa' }).title).toBe('Entregar el turno a Rosa');
  expect(nextStep(base).title).toBe('Entregar el turno');
  expect(nextStep({ ...base, handoffDone: true, meFirst: 'Carmen' })).toMatchObject({ title: 'Todo al día', sub: 'Turno entregado. Buen descanso, Carmen.', cta: 'Ver relevo' });
});

test('handoff builders', () => {
  expect(handoffSummary({ fever: false, watchCount: 0, records: 0 })).toBe('Turno recién empezado. Aún no hay registros.');
  expect(handoffSummary({ fever: false, watchCount: 1, records: 4 })).toBe('Turno tranquilo. Hay 1 cosa a vigilar.');
  expect(handoffSummary({ fever: true, watchCount: 2, records: 4 })).toBe('Turno con fiebre. Hay 2 cosas a vigilar.');

  const meds = [{ name: 'Levotiroxina', dose: '50 mcg', time: '06:00' }];
  expect(pendingTasks({ fever: null, pendingMeds: meds })).toEqual([
    'Dar Levotiroxina 50 mcg a las 06:00.',
    'Avisar al médico si aparece fiebre (más de 37,5 °C).',
  ]);
  expect(pendingTasks({ fever: { temp: 38.2, time: '00:02', notified: false }, pendingMeds: [] })).toEqual([
    'Avisar al médico por la fiebre de 38,2 °C.',
    'Tomar la temperatura cada 2 horas.',
  ]);
  expect(pendingTasks({ fever: { temp: 38.2, time: '00:02', notified: true, notifiedAt: '00:05' }, pendingMeds: [] })[0])
    .toBe('El médico ya está avisado por la fiebre (aviso a las 00:05).');

  const tos = { text: 'Tos seca de vez en cuando.', time: '01:15' };
  expect(watchText({ fever: null, watch: [] })).toBe('');
  expect(watchText({ fever: null, watch: [tos] })).toBe('Tos seca de vez en cuando desde la 01:15. Sin fiebre.');
  expect(watchText({ fever: { temp: 38.2, time: '00:02' }, watch: [tos] })).toBe('Fiebre de 38,2 °C a las 00:02 y tos seca de vez en cuando desde la 01:15.');
});

test('unreadCount: only messages from others, newer than the last visit', () => {
  const m = (createdAt: string, fromSelf = false) => ({ fromSelf, createdAt });
  const msgs = [m('2026-10-05T10:00:00Z'), m('2026-10-05T11:00:00Z', true), m('2026-10-05T12:00:00Z')];
  expect(unreadCount(msgs, '')).toBe(2);
  expect(unreadCount(msgs, '2026-10-05T10:00:00Z')).toBe(1);
  expect(unreadCount(msgs, '2026-10-05T12:00:00Z')).toBe(0);
});
