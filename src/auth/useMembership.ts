import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type Membership = { role: 'nurse' | 'family' | 'doctor'; patient_id: string };

export function pickActiveMembership(rows: Membership[]): Membership | null {
  if (rows.length === 0) return null;
  return rows.find((r) => r.role === 'nurse') ?? rows[0];
}

export function useMembership() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    let active = true;
    if (!session) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('care_memberships')
      .select('role, patient_id')
      .then(({ data }) => {
        if (!active) return;
        setMembership(pickActiveMembership((data as Membership[]) ?? []));
        setLoading(false);
      });
    return () => { active = false; };
  }, [session]);

  return { loading, membership };
}
