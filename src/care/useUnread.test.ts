import { renderHook } from '@testing-library/react';
import { useUnread } from './useUnread';
import type { Message } from './data';

let screen = 'inicio';
let msgs: Message[] = [];
vi.mock('./useCare', () => ({ useCare: () => ({ patientId: 'p1', me: { id: 'n1' }, screen, messages: msgs }) }));

const msg = (id: string, createdAt: string, fromSelf = false): Message =>
  ({ id, body: '', time: '', fromSelf, senderId: fromSelf ? 'n1' : 'f1', createdAt });

beforeEach(() => { localStorage.clear(); screen = 'inicio'; });

test('counts until the chat is opened, then remembers the visit', () => {
  msgs = [msg('a', '2026-10-05T10:00:00+00:00'), msg('b', '2026-10-05T11:00:00+00:00')];
  const { result, rerender } = renderHook(() => useUnread());
  expect(result.current).toBe(2);

  screen = 'mensajes';
  rerender();
  expect(result.current).toBe(0);
  expect(localStorage.getItem('lazo.seen.p1.n1')).toBe('2026-10-05T11:00:00+00:00');

  screen = 'inicio';
  msgs = [...msgs, msg('c', '2026-10-05T12:00:00+00:00', true), msg('d', '2026-10-05T13:00:00+00:00')];
  rerender();
  expect(result.current).toBe(1); // own message doesn't count
});

test('a stored visit survives a reload', () => {
  localStorage.setItem('lazo.seen.p1.n1', '2026-10-05T10:00:00+00:00');
  msgs = [msg('a', '2026-10-05T10:00:00+00:00'), msg('b', '2026-10-05T11:00:00+00:00')];
  expect(renderHook(() => useUnread()).result.current).toBe(1);
});

test('never moves the stored visit backwards (another tab may be ahead)', () => {
  localStorage.setItem('lazo.seen.p1.n1', '2026-10-05T10:00:00+00:00');
  msgs = [msg('a', '2026-10-05T11:00:00+00:00')];
  const { rerender } = renderHook(() => useUnread()); // this tab remembers 10:00
  localStorage.setItem('lazo.seen.p1.n1', '2026-10-05T12:00:00+00:00'); // another tab saw up to 12:00
  screen = 'mensajes';
  rerender(); // this tab opens the chat with a stale list ending at 11:00
  expect(localStorage.getItem('lazo.seen.p1.n1')).toBe('2026-10-05T12:00:00+00:00');
});
