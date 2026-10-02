import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Care } from '../../care/useCare';
import type { CareEvent, Handoff, Medication, Message, Vital } from '../../care/data';
import Estado from './Estado';
import Actividad from './Actividad';
import Mensajes from './Mensajes';
import Perfil from './Perfil';

const go = vi.fn(), toast = vi.fn(), insert = vi.fn();
let care: Partial<Care>;
let vitals: Vital[], events: CareEvent[], msgs: Message[], meds: Medication[], handoffs: Handoff[];

vi.mock('../../care/useCare', () => ({ useCare: () => care }));
vi.mock('../../care/hooks', () => ({
  useVitals: () => vitals, useCareEvents: () => events, useMedications: () => meds, useMessages: () => msgs, useHandoffs: () => handoffs, refetchLive: () => {},
}));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => ({ insert }) },
  mutate: async (p: PromiseLike<{ error: { message: string } | null }>) => (await p).error?.message ?? null,
}));

const now = new Date().toISOString();
const event = (o: Partial<CareEvent>): CareEvent =>
  ({ id: 'e', type: 'note', title: '', body: '', severity: 'info', occurredAt: now, time: '23:30', authorId: 'n1', tone: 'normal', ...o });

beforeEach(() => {
  vi.clearAllMocks();
  vitals = []; events = []; msgs = []; meds = []; handoffs = [];
  care = {
    role: 'family', patientId: 'p1', go, toast, nameOf: (id) => (id === 'n1' ? 'Marta' : ''),
    me: { id: 'me', email: 'a@b.co', fullName: 'Sara Gil' },
    patient: { id: 'p1', fullName: 'Ana Pérez', age: 80, room: null, status: 'Estable', conditions: [], allergies: [] },
    team: [{ profileId: 'n1', fullName: 'Marta Ruiz', role: 'nurse', shift: 'night' }],
  };
});

test('Estado: fever headline from the latest temperature, a word per vital', () => {
  vitals = [{ id: 'v', sys: 120, dia: 80, hr: 72, temp: 38.2, spo2: 97, takenAt: now, time: '00:02', note: '', hasAnomaly: true, recordedBy: 'n1' }];
  render(<Estado />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¿Cómo está Ana?');
  expect(screen.getByText('Ana tiene fiebre. Está recibiendo atención.')).toBeInTheDocument();
  expect(screen.getByText(/tiene fiebre \(38,2 °C a las 00:02\)\. Marta va a avisar al médico\./)).toBeInTheDocument();
  expect(screen.getByText('Revisar')).toBeInTheDocument();
  expect(screen.getAllByText('Normal')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Perfil de Ana' }));
  expect(go).toHaveBeenCalledWith('perfil');
});

test('Estado: "Medicación al día" counts only today doses', () => {
  const med = (id: string, scheduledAt: string, status: Medication['status']): Medication =>
    ({ id, name: 'X', dose: '', reason: '', scheduledAt, time: '08:00', status, atTime: '' });
  meds = [med('old', '2020-01-01T08:00:00Z', 'administered'), med('today', now, 'pending')];
  render(<Estado />);
  expect(screen.getByText('0 de 1 dosis.')).toBeInTheDocument();
});

test('Estado: vitals empty state, no "Lo que debes saber" without data', () => {
  render(<Estado />);
  expect(screen.getByRole('heading', { name: 'Últimos signos · sin datos' })).toBeInTheDocument();
  expect(screen.getByText(/Aún no hay signos registrados hoy/)).toBeInTheDocument();
  expect(screen.queryByText('Lo que debes saber')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Escribir a Marta' }));
  expect(go).toHaveBeenCalledWith('mensajes');
});

test('Actividad: "Para saber" shows only the warnings', () => {
  events = [
    event({ id: 'e1', title: 'Tos', body: 'Tos seca.', severity: 'warning', tone: 'anomaly' }),
    event({ id: 'e2', type: 'medication', body: 'Losartán 50 mg' }),
  ];
  render(<Actividad />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  const warn = screen.getByRole('button', { name: 'Para saber (1)' });
  fireEvent.click(warn);
  expect(warn).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('PARA SABER')).toBeInTheDocument();
  expect(screen.queryByText('Losartán 50 mg')).toBeNull();
});

test('Actividad: a vitals event shows its readings as chips and the fever in words', () => {
  vitals = [{ id: 'v', sys: 120, dia: 80, hr: 72, temp: 38.2, spo2: 97, takenAt: now, time: '00:02', note: '', hasAnomaly: true, recordedBy: 'n1' }];
  events = [event({ type: 'vitals', body: 'Presión 120/80, pulso 72, 38,2 °C, oxígeno 97 %. Fiebre.', occurredAt: now, tone: 'anomaly' })];
  render(<Actividad />);
  expect(screen.getByText('Tiene fiebre: 38,2 °C. Marta va a avisar al médico.')).toBeInTheDocument();
  expect(screen.getByText('Pulso 72')).toBeInTheDocument();
  expect(screen.getByText('Presión 120/80')).toBeInTheDocument();
});

test('Actividad: a handoff joins the feed with its summary, newest first', () => {
  events = [event({ id: 'e1', type: 'medication', body: 'Losartán 50 mg', occurredAt: new Date(Date.now() - 60e3).toISOString() })];
  handoffs = [{ id: 'h1', nurseId: 'n1', summary: 'Turno tranquilo. Nada a vigilar.', recommendation: '', endedAt: now, time: '06:00' }];
  render(<Actividad />);
  const items = screen.getAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Marta entregó el turno06:00Turno tranquilo. Nada a vigilar.');
  expect(items[1]).toHaveTextContent('Losartán 50 mg');
});

test('Actividad: empty text when nothing happened today', () => {
  events = [event({ occurredAt: '2020-01-01T00:00:00Z' })];
  render(<Actividad />);
  expect(screen.getByText('Todavía no hay actividad hoy. Aparecerá aquí en cuanto Marta anote algo.')).toBeInTheDocument();
});

test('Mensajes: blank is ignored; Enter sends with sender and patient, then clears the draft', async () => {
  msgs = [{ id: 'm1', body: 'Todo tranquilo.', time: '23:40', fromSelf: false, senderId: 'n1' },
    { id: 'm2', body: 'Paso mañana.', time: '23:41', fromSelf: false, senderId: 'f2' }];
  insert.mockResolvedValue({ error: null });
  render(<Mensajes />);
  expect(screen.getByRole('log')).toHaveTextContent('Marta dijo:Todo tranquilo.23:40Alguien del equipo dijo:Paso mañana.Alguien del equipo · 23:41');
  expect(screen.getByText('Enfermería · turno de noche')).toBeInTheDocument();
  const input = screen.getByLabelText('Escribe un mensaje a Marta');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(insert).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: ' hola ' } });
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true }); // IME still composing
  expect(insert).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(insert).toHaveBeenCalledWith({ patient_id: 'p1', sender_id: 'me', body: 'hola' }));
  expect(input).toHaveValue('');
});

test('Mensajes: a failed send keeps the draft and says so', async () => {
  insert.mockResolvedValue({ error: { message: 'x' } });
  render(<Mensajes />);
  const input = screen.getByLabelText('Escribe un mensaje a Marta');
  fireEvent.change(input, { target: { value: 'hola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith('No se pudo enviar el mensaje. Inténtalo de nuevo.'));
  expect(input).toHaveValue('hola');
});

test('Perfil: allergy alert only when there are allergies; conditions empty state', () => {
  const { unmount } = render(<Perfil />);
  expect(screen.getByRole('heading', { level: 1, name: 'Ana Pérez' })).toBeInTheDocument();
  expect(screen.getByText('80 años · en casa · estable')).toBeInTheDocument();
  expect(screen.queryByText(/Alergias:/)).toBeNull();
  expect(screen.getByText('Aún no hay condiciones anotadas.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Emergencia: llamar al 112' })).toHaveAttribute('href', 'tel:112');
  fireEvent.click(screen.getByRole('button', { name: /Configuración y tamaño de texto/ }));
  expect(go).toHaveBeenCalledWith('ajustes');
  unmount();

  care = { ...care, patient: { ...care.patient!, allergies: ['penicilina', 'látex'], conditions: ['Hipertensión'] } };
  render(<Perfil />);
  expect(screen.getByText('Alergias: penicilina, látex')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Condiciones' })).toBeInTheDocument();
});
