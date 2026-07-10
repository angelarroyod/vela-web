import { useLiveList } from './useLiveList';
import { hhmm } from '../lib/supabase';
import type { Vitals, Medication, FeedEntry, Message, TimelineEntry } from './data';

type VitalRow = { bp_sys: number; bp_dia: number; hr: number; temp_c: number; spo2: number; taken_at: string; note: string; has_anomaly?: boolean };
export const mapVital = (r: VitalRow): Vitals => ({
  bp: `${r.bp_sys}/${r.bp_dia}`, hr: r.hr, tempC: r.temp_c, spo2: r.spo2, takenAt: hhmm(r.taken_at), note: r.note ?? '',
});

type MedRow = { id?: string; name: string; dose: string; reason: string; scheduled_at: string; status: 'administered' | 'pending' };
export const mapMed = (r: MedRow): Medication => ({
  id: r.id, name: r.name, dose: r.dose, reason: r.reason, time: hhmm(r.scheduled_at),
  status: r.status, sub: r.status === 'administered' ? 'Administrada' : 'Próxima',
});

type EventRow = { type: string; title: string; body: string; severity: string; occurred_at: string; author_id: string };
export const mapEvent = (r: EventRow): FeedEntry => ({
  who: 'Carmen', initials: 'CM', action: r.title ?? r.type, time: hhmm(r.occurred_at),
  tone: r.severity === 'warning' ? 'anomaly' : 'normal', body: r.body ?? undefined,
});

export const mapTimeline = (r: EventRow): TimelineEntry => ({
  title: r.title ?? r.type, time: hhmm(r.occurred_at), body: r.body ?? '', tone: r.severity === 'warning' ? 'anomaly' : 'normal',
});

type MsgRow = { sender_id: string; body: string; created_at: string };
export const mapMessage = (r: MsgRow, selfId: string): Message => ({
  body: r.body, time: hhmm(r.created_at), fromSelf: r.sender_id === selfId,
});

export const useVitals = (pid?: string) => useLiveList<VitalRow, Vitals>('vitals', pid, { col: 'taken_at', asc: false }, mapVital);
export const useMedications = (pid?: string) => useLiveList<MedRow, Medication>('medications', pid, { col: 'scheduled_at', asc: true }, mapMed);
export const useCareEvents = (pid?: string) => useLiveList<EventRow, FeedEntry>('care_events', pid, { col: 'occurred_at', asc: false }, mapEvent);
export const useTimeline = (pid?: string) => useLiveList<EventRow, TimelineEntry>('care_events', pid, { col: 'occurred_at', asc: true }, mapTimeline);
export const useMessages = (pid: string | undefined, selfId: string) =>
  useLiveList<MsgRow, Message>('messages', pid, { col: 'created_at', asc: true }, (r) => mapMessage(r, selfId));
