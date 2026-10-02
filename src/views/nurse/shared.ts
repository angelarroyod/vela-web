import { useCare } from '../../care/useCare';
import { useCareEvents, useHandoffs, useMedications, useVitals } from '../../care/hooks';
import { feverState, firstName } from '../../care/logic';
import { supabase } from '../../lib/supabase';
import { unqueue } from '../../lib/offline';
import type { WriteResult } from '../../lib/offline';
import type { Handoff, Medication } from '../../care/data';

export const fs = (n: number) => `calc(var(--u)*${n})`;

const H12 = 12 * 3600e3;
const endOf = (h?: Handoff) => (h?.endedAt ? Date.parse(h.endedAt) : 0);

// Membership shift as words: 'night' → 'Turno de noche'. Free text passes through.
export { shiftLabel } from '../../care/logic';

// "Today" is the calendar day plus 12 h either side, so a night shift is never cut at midnight: a missed 23:30 dose
// still reaches "Lo siguiente" after it, and the 06:00 dose is already there before it.
export function todays(meds: Medication[], now = Date.now()) {
  const d = new Date(now).toDateString();
  return meds.filter((m) => {
    if (!m.scheduledAt) return false;
    return new Date(m.scheduledAt).toDateString() === d || Math.abs(now - Date.parse(m.scheduledAt)) < H12;
  });
}

// Undo of an insert. 0 deleted rows (e.g. no delete policy) counts as a failure, never silent.
export async function removeRow(table: string, id: string) {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  return !error && !!data?.length;
}

// Undo of a writeOrQueue insert: delete the row if it was sent, drop it from the outbox if it was queued.
export const undoWrite = (table: string, row: Record<string, unknown>, r: WriteResult) =>
  'id' in r ? removeRow(table, r.id) : Promise.resolve(unqueue(table, row));

// What the nurse home and the handoff screen both derive from the live lists.
export function useShift() {
  const { patientId, me, team } = useCare();
  const vitals = useVitals(patientId);
  const events = useCareEvents(patientId);
  const meds = todays(useMedications(patientId));
  const handoffs = useHandoffs(patientId);
  const now = Date.now();
  const ended = handoffs.filter((h) => h.endedAt); // newest first
  // Handed off while the latest handoff is mine and recent. A later one by another nurse gave the shift back to me.
  const handedOff = ended[0]?.nurseId === me.id && now - endOf(ended[0]) < H12 ? ended[0] : null;
  // The shift began at the handoff before that (anyone's), but never more than 12 h ago.
  const since = Math.max(now - H12, endOf(handedOff ? ended[1] : ended[0]));
  return {
    vitals, meds, handedOff, since,
    nextMed: meds.find((m) => m.status === 'pending') ?? null,
    fever: feverState(vitals[0], events),
    shiftVitals: vitals.filter((v) => Date.parse(v.takenAt) >= since), // newest first
    shiftEvents: events.filter((e) => Date.parse(e.occurredAt) >= since), // newest first
    // ponytail: the next shift is the first other nurse on the team; '' (neutral words) when there is none.
    nextName: firstName(team.find((t) => t.role === 'nurse' && t.profileId !== me.id)?.fullName),
  };
}
