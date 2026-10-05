import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { AppShell } from './AppShell';
import type { Care } from '../care/useCare';

const go = vi.fn();
let care: Partial<Care> = {};
vi.mock('../care/useCare', () => ({ useCare: () => care }));
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ signOut: vi.fn() }) }));
let unread = 0;
vi.mock('../care/useUnread', () => ({ useUnread: () => unread }));

const tabBar = () => within(screen.getAllByRole('navigation', { name: 'Navegación principal' })[1]);

beforeEach(() => {
  go.mockClear();
  care = { role: 'nurse', screen: 'meds', go };
  unread = 0;
});

test('nurse has a Mensajes tab with an unread count read out by screen readers', () => {
  unread = 2;
  render(<AppShell><h1>Inicio</h1></AppShell>);
  const tab = tabBar().getByRole('button', { name: 'Mensajes, 2 mensajes sin leer' });
  expect(within(tab).getByText('2', { selector: '[aria-hidden="true"]' })).toBeInTheDocument(); // the visible bubble, not the sr text
  fireEvent.click(tab);
  expect(go).toHaveBeenCalledWith('mensajes');
});

test('nurse tabs: meds highlights Inicio, a tab navigates', () => {
  render(<AppShell><h1>Medicación</h1></AppShell>);
  expect(tabBar().getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(tabBar().getByRole('button', { name: 'Signos' }));
  expect(go).toHaveBeenCalledWith('signos');
});

test('the badge caps at 9+', () => {
  unread = 12;
  render(<AppShell><h1>Inicio</h1></AppShell>);
  const tab = tabBar().getByRole('button', { name: 'Mensajes, 12 mensajes sin leer' });
  expect(within(tab).getByText('9+', { selector: '[aria-hidden="true"]' })).toBeInTheDocument();
});

test('family tabs and the sidebar settings link', () => {
  care = { role: 'family', screen: 'mensajes', go };
  render(<AppShell><h1>Mensajes</h1></AppShell>);
  expect(tabBar().getByRole('button', { name: 'Mensajes' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(screen.getByRole('button', { name: 'Configuración' }));
  expect(go).toHaveBeenCalledWith('ajustes');
});

test('screen change focuses the new h1', () => {
  const { rerender } = render(<AppShell><h1>Inicio</h1></AppShell>);
  care = { ...care, screen: 'signos' };
  rerender(<AppShell><h1>Signos vitales</h1></AppShell>);
  expect(screen.getByRole('heading', { name: 'Signos vitales' })).toHaveFocus();
});

test('offline bar appears with the nurse copy and the outbox count', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  localStorage.setItem('lazo.outbox', JSON.stringify([{ table: 'vitals', row: {} }, { table: 'care_events', row: {} }]));
  render(<AppShell><h1>Inicio</h1></AppShell>);
  act(() => { window.dispatchEvent(new Event('offline')); });
  expect(screen.getByText(/se enviará al volver la conexión\. 2 registros pendientes de enviar\./)).toBeInTheDocument();
  localStorage.clear();
  vi.restoreAllMocks();
});
