// Display types for care rows. Numbers stay numbers; `time` is HH:MM (24h); ISO fields keep the raw timestamp.
export interface Vital {
  id: string;
  sys: number | null; dia: number | null; hr: number | null; temp: number | null; spo2: number | null;
  takenAt: string; time: string; note: string; hasAnomaly: boolean; recordedBy: string | null;
}
export interface Medication {
  id: string; name: string; dose: string; reason: string;
  scheduledAt: string | null; time: string; status: 'administered' | 'pending';
  atTime: string; // HH:MM when given, else ''
}
export interface CareEvent {
  id: string; type: string; title: string; body: string; severity: string;
  occurredAt: string; time: string; authorId: string | null; tone: 'normal' | 'anomaly';
}
export interface Message { id: string; body: string; time: string; fromSelf: boolean; senderId: string }
export interface Handoff { id: string; nurseId: string | null; summary: string; recommendation: string; endedAt: string | null; time: string }
export interface Patient {
  id: string; fullName: string; age: number | null; room: string | null; status: string;
  conditions: string[]; allergies: string[];
}
export interface TeamMember { profileId: string; fullName: string; role: 'nurse' | 'family' | 'doctor'; shift: string | null }
export interface Me { id: string; email: string; fullName: string }
