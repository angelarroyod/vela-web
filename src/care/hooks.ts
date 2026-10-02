import { useEffect, useState } from 'react';
import { useLiveList } from './useLiveList';
import { useAuth } from '../auth/useAuth';
import { supabase, hhmm } from '../lib/supabase';
import type { Vital, Medication, CareEvent, Message, Handoff, Patient, TeamMember, Me } from './data';

export { refetchLive } from './useLiveList';

const time = (iso: string | null | undefined) => (iso ? hhmm(iso) : '');
const num = (n: number | string | null | undefined) => (n == null ? null : Number(n)); // numeric columns may arrive as strings

type VitalRow = {
  id: string; bp_sys: number | null; bp_dia: number | null; hr: number | null; temp_c: number | string | null; spo2: number | null;
  taken_at: string; note: string | null; has_anomaly: boolean | null; recorded_by: string | null;
};
export const mapVital = (r: VitalRow): Vital => ({
  id: r.id, sys: r.bp_sys, dia: r.bp_dia, hr: r.hr, temp: num(r.temp_c), spo2: r.spo2,
  takenAt: r.taken_at, time: time(r.taken_at), note: r.note ?? '', hasAnomaly: !!r.has_anomaly, recordedBy: r.recorded_by,
});

type MedRow = {
  id: string; name: string; dose: string | null; reason: string | null; scheduled_at: string | null;
  status: string; administered_at: string | null;
};
export const mapMed = (r: MedRow): Medication => ({
  id: r.id, name: r.name, dose: r.dose ?? '', reason: r.reason ?? '', scheduledAt: r.scheduled_at, time: time(r.scheduled_at),
  status: r.status === 'administered' ? 'administered' : 'pending', atTime: time(r.administered_at),
});

type EventRow = {
  id: string; type: string; title: string | null; body: string | null; severity: string; occurred_at: string; author_id: string | null;
};
export const mapEvent = (r: EventRow): CareEvent => ({
  id: r.id, type: r.type, title: r.title ?? '', body: r.body ?? '', severity: r.severity,
  occurredAt: r.occurred_at, time: time(r.occurred_at), authorId: r.author_id, tone: r.severity === 'warning' ? 'anomaly' : 'normal',
});

type MsgRow = { id: string; sender_id: string; body: string; created_at: string };
export const mapMessage = (r: MsgRow, selfId: string): Message => ({
  id: r.id, body: r.body, time: time(r.created_at), fromSelf: r.sender_id === selfId, senderId: r.sender_id,
});

type HandoffRow = { id: string; nurse_id: string | null; summary: string | null; recommendation: string | null; ended_at: string | null };
export const mapHandoff = (r: HandoffRow): Handoff => ({
  id: r.id, nurseId: r.nurse_id, summary: r.summary ?? '', recommendation: r.recommendation ?? '', endedAt: r.ended_at, time: time(r.ended_at),
});

type PatientRow = {
  id: string; full_name: string; age: number | null; room: string | null; status: string | null;
  conditions?: string[] | null; allergies?: string[] | null; // absent before migration 0003
};
export const mapPatient = (r: PatientRow): Patient => ({
  id: r.id, fullName: r.full_name, age: r.age, room: r.room, status: r.status ?? 'Estable',
  conditions: r.conditions ?? [], allergies: r.allergies ?? [],
});

// Live lists: refetch on realtime change, on reconnect and on refetchLive().
export const useVitals = (pid?: string) => useLiveList<VitalRow, Vital>('vitals', pid, { col: 'taken_at', asc: false }, mapVital);
export const useMedications = (pid?: string) => useLiveList<MedRow, Medication>('medications', pid, { col: 'scheduled_at', asc: true }, mapMed);
export const useCareEvents = (pid?: string) => useLiveList<EventRow, CareEvent>('care_events', pid, { col: 'occurred_at', asc: false }, mapEvent);
export const useTimeline = (pid?: string) => useLiveList<EventRow, CareEvent>('care_events', pid, { col: 'occurred_at', asc: true }, mapEvent);
export const useMessages = (pid: string | undefined, selfId: string) =>
  useLiveList<MsgRow, Message>('messages', pid, { col: 'created_at', asc: true }, (r) => mapMessage(r, selfId));
export const useHandoffs = (pid?: string) => useLiveList<HandoffRow, Handoff>('shift_handoffs', pid, { col: 'ended_at', asc: false }, mapHandoff);

// Fetched once per patient (not live).
export function usePatient(pid?: string): Patient | null {
  const [patient, setPatient] = useState<Patient | null>(null);
  useEffect(() => {
    if (!pid) return;
    let active = true;
    supabase.from('patients').select('*').eq('id', pid).single()
      .then(({ data }) => { if (active && data) setPatient(mapPatient(data as PatientRow)); });
    return () => { active = false; };
  }, [pid]);
  return patient;
}

type TeamRow = { profile_id: string; full_name: string | null; role: TeamMember['role']; shift: string | null };
export function useCareTeam(pid?: string): TeamMember[] {
  const [team, setTeam] = useState<TeamMember[]>([]);
  useEffect(() => {
    if (!pid) return;
    let active = true;
    // On error (e.g. migration 0003 not applied) the team stays empty and copy falls back to neutral words.
    supabase.rpc('care_team', { p_patient: pid }).then(({ data, error }) => {
      if (!active || error) return;
      setTeam(((data ?? []) as TeamRow[]).map((r) => ({ profileId: r.profile_id, fullName: r.full_name ?? '', role: r.role, shift: r.shift })));
    });
    return () => { active = false; };
  }, [pid]);
  return team;
}

export function useMe(): Me {
  const { session } = useAuth();
  const id = session?.user.id ?? '';
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true;
    supabase.from('profiles').select('full_name').eq('id', id).single()
      .then(({ data }) => { if (active && data) setFullName((data as { full_name: string | null }).full_name ?? ''); });
    return () => { active = false; };
  }, [id]);
  const metaName = (session?.user.user_metadata?.full_name as string | undefined) ?? '';
  return { id, email: session?.user.email ?? '', fullName: fullName || metaName };
}
