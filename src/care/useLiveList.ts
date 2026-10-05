import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const REFETCH = 'lazo-refetch';
let channelSeq = 0;
// Last rows per list, so a remount (every screen change) starts from them instead of flashing empty states
// ("Registrar los primeros signos…") until the refetch lands. RLS already scoped them to this user.
const cache = new Map<string, unknown[]>();

// Refetch every mounted live list, e.g. after an undo delete (realtime does not deliver filtered DELETEs).
export const refetchLive = () => window.dispatchEvent(new Event(REFETCH));

export function useLiveList<Row, T>(
  table: string,
  patientId: string | undefined,
  order: { col: string; asc: boolean },
  map: (r: Row) => T,
): T[] {
  const key = `${table}:${patientId}:${order.col}:${order.asc}`;
  const [rows, setRows] = useState<T[]>(() => ((patientId && cache.get(key)) as Row[] | undefined ?? []).map(map));
  const mapRef = useRef(map); // callers pass inline mappers; the latest one is used, without resubscribing
  useEffect(() => { mapRef.current = map; });

  useEffect(() => {
    if (!patientId) {
      setRows([]);
      return;
    }
    // Only the latest fetch may land (bursts of events resolve out of order); 0 after unmount.
    // A failed fetch (offline, flaky reconnect) keeps the last rows instead of blanking every list.
    let latest = 1;
    const fetchRows = () => {
      const n = ++latest;
      supabase
        .from(table)
        .select('*')
        .eq('patient_id', patientId)
        .order(order.col, { ascending: order.asc })
        .then(({ data, error }: { data: Row[] | null; error: unknown }) => {
          if (n !== latest || error) return;
          cache.set(key, data ?? []);
          setRows((data ?? []).map(mapRef.current));
        });
    };

    fetchRows();
    // ponytail: refetch on any change, not incremental merge — fine at this scale.
    // One topic per hook instance: two lists on the same table must not share (and tear down) one channel.
    const channel = supabase
      .channel(`${table}:${patientId}:${++channelSeq}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `patient_id=eq.${patientId}` }, fetchRows)
      .subscribe();
    // Catch up on what changed while offline, and on explicit refetch requests.
    window.addEventListener('online', fetchRows);
    window.addEventListener(REFETCH, fetchRows);

    return () => {
      latest = 0;
      supabase.removeChannel(channel);
      window.removeEventListener('online', fetchRows);
      window.removeEventListener(REFETCH, fetchRows);
    };
  }, [table, patientId, order.col, order.asc, key]);

  return rows;
}
