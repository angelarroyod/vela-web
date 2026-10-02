import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type Membership = {
  role: 'nurse' | 'family' | 'doctor';
  patient_id: string;
  shift?: string | null; // e.g. 'night'
  relationship?: string | null; // e.g. 'family'
};

export function pickActiveMembership(rows: Membership[]): Membership | null {
  if (rows.length === 0) return null;
  return rows.find((r) => r.role === 'nurse') ?? rows[0];
}

export function useMembership() {
  const { session } = useAuth();
  const userId = session?.user.id;
  // Remembers whose memberships it holds: a new user id is "loading" from its very first render,
  // so signing in never flashes onboarding before the fetch starts.
  const [got, setGot] = useState<{ userId: string; membership: Membership | null } | null>(null);

  // Keyed on the user id, not the session object: a token refresh must not refetch (and blank the app).
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let retry: number | undefined;
    const load = () => {
      supabase
        .from('care_memberships')
        .select('role, patient_id, shift, relationship')
        .then(({ data, error }) => {
          if (!active) return;
          // A failed fetch is not "no membership": that would send a member to onboarding (and a second patient).
          // ponytail: stays loading and retries every 3 s; add a "sin conexión" screen if that blank ever matters.
          if (error) retry = window.setTimeout(load, 3000);
          else setGot({ userId, membership: pickActiveMembership((data as Membership[]) ?? []) });
        });
    };
    load();
    return () => { active = false; clearTimeout(retry); };
  }, [userId]);

  const fresh = !!userId && got?.userId === userId;
  return { loading: !!userId && !fresh, membership: fresh ? got?.membership ?? null : null };
}
