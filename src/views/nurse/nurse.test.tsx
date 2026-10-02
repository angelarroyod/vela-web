import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import type { Care } from '../../care/useCare';
import Inicio from './Inicio';
import Signos from './Signos';
import Medicacion from './Medicacion';
import Relevo from './Relevo';
import Perfil from './Perfil';
import { todays } from './shared';
import type { Medication } from '../../care/data';

const go = vi.fn();
const toast = vi.fn();
const care = {
  role: 'nurse', patientId: 'p1', membership: { role: 'nurse', patient_id: 'p1', shift: 'night' },
  patient: { id: 'p1', fullName: 'Ana Ruiz', age: 80, room: null, status: 'Estable', conditions: ['Diabetes'], allergies: [] },
  me: { id: 'n1', email: 'n@x.es', fullName: 'Marta Gil' }, team: [], nameOf: () => '', screen: 'inicio', go, toast,
} as unknown as Care;
vi.mock('../../care/useCare', () => ({ useCare: () => care }));

const data = { vitals: [] as unknown[], events: [] as unknown[], meds: [] as unknown[], handoffs: [] as unknown[] };
vi.mock('../../care/hooks', () => ({
  useVitals: () => data.vitals, useCareEvents: () => data.events, useMedications: () => data.meds, useHandoffs: () => data.handoffs,
  refetchLive: vi.fn(),
}));

// Chainable Supabase stub: records every call; each query resolves to the next `db.queue` entry, else `db.result`.
type Result = { data: unknown; error: { message: string; code?: string } | null };
const db = { calls: [] as [string, string, unknown[]][], result: { data: { id: 'new' }, error: null } as Result, queue: [] as Result[] };
vi.mock('../../lib/supabase', () => ({
  hhmm: () => '08:15',
  supabase: {
    from: (t: string) => {
      const q: Record<string, unknown> = { then: (ok: (r: Result) => void) => ok(db.queue.shift() ?? db.result) };
      for (const op of ['select', 'insert', 'update', 'delete', 'eq', 'is', 'gt', 'order', 'limit', 'single']) {
        q[op] = (...args: unknown[]) => { db.calls.push([t, op, args]); return q; };
      }
      return q;
    },
  },
}));
const call = (table: string, op: string) => db.calls.find(([t, o]) => t === table && o === op)?.[2][0];

beforeEach(() => {
  go.mockClear();
  toast.mockClear();
  db.calls = [];
  db.result = { data: { id: 'new' }, error: null };
  db.queue = [];
  Object.assign(data, { vitals: [], events: [], meds: [], handoffs: [] });
});

const fill = (v: Record<string, string>) =>
  Object.entries(v).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } }));
const normal = { 'Presión máxima (sistólica)': '128', 'Presión mínima (diastólica)': '82', 'Pulso': '72', 'Temperatura': '36,7', 'Oxígeno en sangre': '97' };

test('each screen renders one h1 and its empty state', () => {
  const views: [ComponentType, string | RegExp, string][] = [
    [Inicio, /, Marta$/, 'Registrar los primeros signos vitales'],
    [Signos, 'Signos vitales', 'Ana Ruiz · nuevo control'],
    [Medicacion, 'Medicación', 'Aún no hay dosis programadas para hoy.'],
    [Relevo, 'Relevo de turno', 'Aún no hay nada anotado en este turno. Lo que registres aparecerá aquí.'],
    [Perfil, 'Perfil', 'Invitar a la familia'],
  ];
  for (const [View, h1, text] of views) {
    const { unmount } = render(<View />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(h1);
    expect(screen.getByText(text)).toBeInTheDocument();
    unmount();
  }
});

test('Inicio: an open fever turns the hero into "avisa al médico" and records the call', async () => {
  data.vitals = [{ id: 'v1', sys: 120, dia: 80, hr: 70, temp: 38.2, spo2: 97, takenAt: new Date().toISOString(), time: '00:02', note: '', hasAnomaly: true, recordedBy: 'n1' }];
  render(<Inicio />);
  expect(screen.getByRole('heading', { name: 'AVISA AL MÉDICO' })).toBeInTheDocument();
  expect(screen.getByText('Fiebre de 38,2 °C a las 00:02')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ya avisé al médico' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Queda anotado que avisaste al médico.'));
  expect(call('care_events', 'insert')).toMatchObject({ patient_id: 'p1', author_id: 'n1', type: 'doctor_notified', body: 'Por la fiebre de 38,2 °C.', severity: 'warning' });
});

test('Inicio: a notice queued offline moves the hero on, so it is not queued twice', async () => {
  data.vitals = [{ id: 'v1', sys: 120, dia: 80, hr: 70, temp: 38.2, spo2: 97, takenAt: '2026-10-02T00:02:00Z', time: '00:02', note: '', hasAnomaly: true, recordedBy: 'n1' }];
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(<Inicio />);
  fireEvent.click(screen.getByRole('button', { name: 'Ya avisé al médico' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Guardado en el teléfono. Se enviará al volver la conexión.'));
  expect(screen.queryByRole('button', { name: 'Ya avisé al médico' })).not.toBeInTheDocument();
  online.mockRestore();
  localStorage.clear();
});

test('Signos: an out-of-range value is explained and turns "Avisar a la familia" on', () => {
  render(<Signos />);
  expect(screen.getByRole('switch', { name: /Avisar a la familia/ })).toHaveAttribute('aria-checked', 'false');
  fill({ 'Presión máxima (sistólica)': '150' });
  expect(screen.getByText('Más alto de lo normal (normal: 90 a 140)')).toBeInTheDocument();
  expect(screen.getByText('Hay 1 valor fuera de lo normal. Revísalo antes de guardar.')).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: /Avisar a la familia/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('button', { name: 'Guardar y avisar a la familia' })).toBeInTheDocument();
});

test('Signos: saving inserts numeric vitals for the patient, then the event, and offers undo', async () => {
  render(<Signos />);
  fill({ ...normal, 'Nota (opcional)': ' Tranquila ' });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar control' }));
  await waitFor(() => expect(go).toHaveBeenCalledWith('inicio'));
  expect(call('vitals', 'insert')).toMatchObject({ patient_id: 'p1', recorded_by: 'n1', bp_sys: 128, bp_dia: 82, hr: 72, temp_c: 36.7, spo2: 97, has_anomaly: false, note: 'Tranquila' });
  expect(call('care_events', 'insert')).toMatchObject({ type: 'vitals', body: 'Presión 128/82, pulso 72, 36,7 °C, oxígeno 97 %.', severity: 'info' });
  expect(toast).toHaveBeenCalledWith('Control guardado.', expect.any(Function));
});

test('Signos: a failed save keeps the values and offers "Reintentar"', async () => {
  db.result = { data: null, error: { message: 'boom' } };
  render(<Signos />);
  fill(normal);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar control' }));
  expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  expect(screen.getByText(/No se pudo guardar el control/)).toBeInTheDocument();
  expect(screen.getByLabelText('Pulso')).toHaveValue('72');
  expect(go).not.toHaveBeenCalled();
});

test('Medicación: "Marcar como dada" updates the dose and offers undo', async () => {
  data.meds = [{ id: 'm1', name: 'Amlodipino', dose: '5 mg', reason: 'Presión arterial', scheduledAt: new Date().toISOString(), time: '08:00', status: 'pending', atTime: '' }];
  render(<Medicacion />);
  expect(screen.getByRole('progressbar', { name: '0 de 1 dosis dadas hoy' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como dada' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Amlodipino marcada como dada a las 08:15.', expect.any(Function)));
  expect(call('medications', 'update')).toMatchObject({ status: 'administered', administered_by: 'n1' });
  expect(call('medications', 'eq')).toBe('id');
  expect(db.calls.find(([t, o]) => t === 'medications' && o === 'eq')?.[2]).toEqual(['id', 'm1']);
  expect(call('care_events', 'insert')).toMatchObject({ patient_id: 'p1', author_id: 'n1', type: 'medication', body: 'Amlodipino 5 mg.', severity: 'info' });
  expect(screen.getByText('Dada · 08:15')).toBeInTheDocument();
});

test('todays: a night shift sees the 06:00 dose before midnight and keeps the missed 23:30 after it', () => {
  const med = (id: string, at: string) => ({ id, scheduledAt: new Date(at).toISOString() }) as Medication;
  const meds = [med('missed', '2026-10-01T23:30'), med('dawn', '2026-10-03T06:00'), med('old', '2026-10-01T08:00'), med('far', '2026-10-03T14:00')];
  expect(todays(meds, Date.parse('2026-10-02T23:00')).map((m) => m.id)).toEqual(['dawn']);
  expect(todays(meds, Date.parse('2026-10-02T00:30')).map((m) => m.id)).toEqual(['missed']);
});

test('Relevo: confirming the sheet saves the handoff', async () => {
  render(<Relevo />);
  fireEvent.click(screen.getByRole('button', { name: 'Entregar turno' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, entregar turno' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Turno entregado.', expect.any(Function)));
  expect(call('shift_handoffs', 'insert')).toMatchObject({ patient_id: 'p1', nurse_id: 'n1', summary: 'Turno recién empezado. Aún no hay registros.' });
});

test('Perfil: shows the open invite letter by letter and copies it', async () => {
  db.result = { data: [{ code: 'AB12CD' }], error: null };
  const writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<Perfil />);
  expect(await screen.findByText('Código A B 1 2 C D')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Compartir código' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Código AB12CD copiado. Ya puedes enviarlo.'));
  expect(writeText).toHaveBeenCalledWith('AB12CD');
  expect(call('invites', 'insert')).toBeUndefined();
});

test('Perfil: a code that is already taken (23505) is retried once with a new one', async () => {
  db.queue = [{ data: [], error: null }, { data: null, error: { message: 'duplicate key', code: '23505' } }];
  render(<Perfil />);
  expect(await screen.findByRole('button', { name: 'Compartir código' })).toBeEnabled();
  const codes = db.calls.filter(([t, o]) => t === 'invites' && o === 'insert').map(([, , a]) => (a[0] as { code: string }).code);
  expect(codes).toHaveLength(2);
  expect(screen.getByText(codes[1])).toBeInTheDocument();
});
