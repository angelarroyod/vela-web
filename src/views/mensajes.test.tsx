import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Care } from '../care/useCare';
import type { Message } from '../care/data';
import Mensajes from './Mensajes';

const go = vi.fn(), toast = vi.fn();
const write = vi.fn();
let care: Partial<Care>;

vi.mock('../care/useCare', () => ({ useCare: () => care }));
vi.mock('../care/hooks', () => ({ refetchLive: () => {} }));
vi.mock('../lib/offline', () => ({ writeOrQueue: (...a: unknown[]) => write(...a) }));

const now = new Date().toISOString();
const names: Record<string, string> = { f1: 'Violeta', f2: 'Ana', f3: 'Luis' };
const msg = (id: string, senderId: string, body: string): Message =>
  ({ id, body, time: '10:00', fromSelf: senderId === 'n1', senderId, createdAt: now });

beforeEach(() => {
  vi.clearAllMocks();
  write.mockResolvedValue({ id: 'x' });
  care = {
    role: 'nurse', patientId: 'p1', go, toast, nameOf: (id) => names[id ?? ''] ?? '', messages: [],
    me: { id: 'n1', email: 'j@b.co', fullName: 'José Ruiz' },
    patient: { id: 'p1', fullName: 'Oliva Pérez', age: 97, room: null, status: 'Estable', conditions: [], allergies: [] },
    team: [
      { profileId: 'n1', fullName: 'José Ruiz', role: 'nurse', shift: 'night' },
      { profileId: 'f1', fullName: 'Violeta Pérez', role: 'family', shift: null },
    ],
  };
});

test('nurse: header names the family, nurse quick replies send as the nurse', async () => {
  care.messages = [msg('m1', 'f1', '¿Cómo durmió?')];
  render(<Mensajes />);
  expect(screen.getByRole('heading', { level: 1, name: 'Violeta' })).toBeInTheDocument();
  expect(screen.getByText('Familia de Oliva')).toBeInTheDocument();
  expect(screen.getByRole('log', { name: 'Mensajes con Violeta' })).toHaveTextContent('Violeta dijo:¿Cómo durmió?10:00');
  expect(screen.getByLabelText('Escribe un mensaje a Violeta')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Todo tranquilo por aquí.' }));
  await waitFor(() => expect(write).toHaveBeenCalledWith('messages', { patient_id: 'p1', sender_id: 'n1', body: 'Todo tranquilo por aquí.' }));
});

test('nurse: several relatives are listed in Spanish, and every message names its sender', () => {
  care.team = [...care.team!, { profileId: 'f2', fullName: 'Ana Pérez', role: 'family', shift: null }, { profileId: 'f3', fullName: 'Luis Pérez', role: 'family', shift: null }];
  care.messages = [msg('m1', 'f1', 'Hola'), msg('m2', 'f2', 'Buenas')];
  render(<Mensajes />);
  expect(screen.getByRole('heading', { level: 1, name: 'Violeta, Ana y Luis' })).toBeInTheDocument();
  expect(screen.getByLabelText('Escribe un mensaje a la familia')).toBeInTheDocument();
  expect(screen.getByText('Violeta ·', { exact: false })).toBeInTheDocument(); // first-named too, since the header is a group
  expect(screen.getByText('Ana ·', { exact: false })).toBeInTheDocument();
});

test('nurse without family yet: explains and links to the invite code', () => {
  care.team = care.team!.slice(0, 1);
  render(<Mensajes />);
  expect(screen.getByRole('heading', { level: 1, name: 'Familia' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Invitar a la familia' }));
  expect(go).toHaveBeenCalledWith('perfil');
});

test('team not loaded (or care_team failing) but family already wrote: no false "no family" state', () => {
  care.team = care.team!.slice(0, 1);
  care.messages = [msg('m1', 'f1', 'Hola')];
  render(<Mensajes />);
  expect(screen.queryByRole('button', { name: 'Invitar a la familia' })).toBeNull();
  expect(screen.getByRole('log')).toHaveTextContent('Hola');
});

test('offline: the message is queued and the user is told so', async () => {
  write.mockResolvedValue({ queued: true });
  render(<Mensajes />);
  const input = screen.getByLabelText('Escribe un mensaje a Violeta');
  fireEvent.change(input, { target: { value: 'hola' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Sin conexión. Tu mensaje se enviará al volver la conexión.'));
  expect(input).toHaveValue('');
});
