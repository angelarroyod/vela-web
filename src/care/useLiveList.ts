import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLiveList<Row, T>(
  table: string,
  patientId: string | undefined,
  order: { col: string; asc: boolean },
  map: (r: Row) => T,
): T[] {
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    if (!patientId) {
      setRows([]);
      return;
    }
    let active = true;
    const fetchRows = () =>
      supabase
        .from(table)
        .select('*')
        .eq('patient_id', patientId)
        .order(order.col, { ascending: order.asc })
        .then(({ data }: { data: Row[] | null }) => {
          if (active) setRows((data ?? []).map(map));
        });

    fetchRows();
    // ponytail: refetch on any change, not incremental merge — fine at this scale.
    const channel = supabase
      .channel(`${table}:${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `patient_id=eq.${patientId}` }, fetchRows)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [table, patientId, order.col, order.asc]);

  return rows;
}
