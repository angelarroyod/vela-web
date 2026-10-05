import { renderHook, act } from '@testing-library/react';
import { writeOrQueue, flushOutbox, unqueue, useOutboxCount } from './offline';

const single = vi.fn();
const insert = vi.fn((_row: unknown) => ({ select: () => ({ single }) }));
const eq = vi.fn((_c: string, _v: string) => ({ select: () => ({ single }) }));
const update = vi.fn((_row: unknown) => ({ eq }));
vi.mock('./supabase', () => ({ supabase: { from: () => ({ insert, update }) } }));

const offline = (off: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!off);
const outbox = () => JSON.parse(localStorage.getItem('lazo.outbox') ?? '[]');

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test('online: inserts and returns the id, or the error', async () => {
  offline(false);
  single.mockResolvedValueOnce({ data: { id: 'v1' }, error: null });
  expect(await writeOrQueue('vitals', { hr: 72 })).toEqual({ id: 'v1' });
  expect(insert).toHaveBeenCalledWith({ hr: 72 });
  single.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
  expect(await writeOrQueue('vitals', { hr: 72 })).toEqual({ error: 'boom' });
});

test('online with id: updates that row', async () => {
  offline(false);
  single.mockResolvedValueOnce({ data: { id: 'm1' }, error: null });
  expect(await writeOrQueue('medications', { status: 'administered' }, 'm1')).toEqual({ id: 'm1' });
  expect(update).toHaveBeenCalledWith({ status: 'administered' });
  expect(eq).toHaveBeenCalledWith('id', 'm1');
});

test('offline: queues, counts, unqueues; flush sends in order and keeps failures', async () => {
  offline(true);
  const { result } = renderHook(() => useOutboxCount());
  await act(async () => {
    expect(await writeOrQueue('vitals', { a: 1 })).toEqual({ queued: true });
    await writeOrQueue('care_events', { b: 2 });
    await writeOrQueue('vitals', { c: 3 });
  });
  expect(result.current).toBe(3);
  act(() => { expect(unqueue('vitals', { c: 3 })).toBe(true); });
  expect(result.current).toBe(2);
  expect(insert).not.toHaveBeenCalled();

  offline(false);
  single.mockResolvedValueOnce({ data: { id: '1' }, error: null }).mockResolvedValueOnce({ data: null, error: { message: 'x' } });
  let sent = 0;
  await act(async () => { sent = await flushOutbox(); });
  expect(sent).toBe(1);
  expect(insert.mock.calls.map((c) => c[0])).toEqual([{ a: 1 }, { b: 2 }]);
  expect(outbox()).toEqual([{ table: 'care_events', row: { b: 2 } }]);
  expect(result.current).toBe(1);
});

test('unqueue refuses while a flush is sending; a corrupt outbox reads as empty', async () => {
  localStorage.setItem('lazo.outbox', '{}');
  offline(true);
  await writeOrQueue('vitals', { a: 1 });
  expect(outbox()).toEqual([{ table: 'vitals', row: { a: 1 } }]);

  offline(false);
  let land!: (v: unknown) => void;
  single.mockReturnValueOnce(new Promise((r) => { land = r; }));
  const flushed = flushOutbox();
  expect(unqueue('vitals', { a: 1 })).toBe(false); // already on its way: "undone" would be a lie
  land({ data: { id: '1' }, error: null });
  expect(await flushed).toBe(1);
  expect(outbox()).toEqual([]);
});
