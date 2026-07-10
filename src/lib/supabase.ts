import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string) ?? 'http://localhost';
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? 'anon';

export const supabase = createClient(url, anon);

// Formats an ISO timestamp as HH:MM (24h, es locale).
export const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });

// Awaits a Supabase write; returns the error message or null on success.
export async function mutate<T extends { error: { message: string } | null }>(p: PromiseLike<T>): Promise<string | null> {
  const { error } = await p;
  return error?.message ?? null;
}
