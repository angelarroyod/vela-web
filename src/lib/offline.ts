import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';

const KEY = 'lazo.outbox';
const EVT = 'lazo-outbox';

// A queued write. With `id` it is an update of that row, otherwise an insert.
export type OutboxItem = { table: string; row: Record<string, unknown>; id?: string };
export type WriteResult = { queued: true } | { error: string } | { id: string };

function readOutbox(): OutboxItem[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? (v as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(EVT));
  return true;
}

async function send({ table, row, id }: OutboxItem): Promise<{ id: string } | { error: string }> {
  try {
    const { data, error } = id
      ? await supabase.from(table).update(row).eq('id', id).select('id').single()
      : await supabase.from(table).insert(row).select('id').single();
    return error ? { error: error.message } : { id: (data as { id: string }).id };
  } catch (e) {
    return { error: String(e) };
  }
}

// Online: write now and return the row id (or the error). Offline: queue it in localStorage.
export async function writeOrQueue(table: string, row: Record<string, unknown>, id?: string): Promise<WriteResult> {
  const item: OutboxItem = id ? { table, row, id } : { table, row };
  if (navigator.onLine) return send(item);
  return writeOutbox([...readOutbox(), item]) ? { queued: true } : { error: 'No se pudo guardar en el dispositivo.' };
}

let flushing: Promise<number> | null = null;

// Undo of a queued write: drops the most recent queued item for this exact row.
// False while a flush runs: the item may already be on its way, so "undone" would be a lie.
export function unqueue(table: string, row: Record<string, unknown>): boolean {
  if (flushing) return false;
  const items = readOutbox();
  const key = JSON.stringify(row);
  const i = items.findLastIndex((it) => it.table === table && JSON.stringify(it.row) === key);
  if (i < 0) return false;
  items.splice(i, 1);
  return writeOutbox(items);
}

// Web Locks serialize flushes across tabs, so two open tabs never send the same queued row twice.
const locked = (fn: () => Promise<number>): Promise<number> => ('locks' in navigator ? navigator.locks.request(KEY, fn) : fn());

// Sends queued writes in order; failures stay queued. Resolves to the number sent.
// ponytail: the outbox survives sign-out on purpose (clearing it would lose offline records). Rows keep their
// author (recorded_by…), so the next nurse of the same patient sends them; anyone else is refused by RLS and they wait.
export function flushOutbox(): Promise<number> {
  flushing ??= locked(async () => {
    const items = readOutbox();
    const failed: OutboxItem[] = [];
    for (const it of items) if ('error' in (await send(it))) failed.push(it);
    // keep anything queued while we were sending
    if (items.length) writeOutbox([...failed, ...readOutbox().slice(items.length)]);
    return items.length - failed.length;
  }).finally(() => { flushing = null; });
  return flushing;
}

const listen = (events: string[]) => (cb: () => void) => {
  events.forEach((e) => window.addEventListener(e, cb));
  return () => events.forEach((e) => window.removeEventListener(e, cb));
};
const onlineEvents = listen(['online', 'offline']);
const outboxEvents = listen([EVT, 'storage']);

export const useOnline = () => useSyncExternalStore(onlineEvents, () => navigator.onLine);
export const useOutboxCount = () => useSyncExternalStore(outboxEvents, () => readOutbox().length);
