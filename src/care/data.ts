export interface Vitals {
  bp: string; hr: number; tempC: number; spo2: number; takenAt: string; note: string;
}
export interface Medication {
  id?: string; name: string; dose: string; reason: string; time: string;
  status: 'administered' | 'pending'; sub: string;
}
export interface FeedEntry {
  who: string; initials: string; action: string; time: string;
  tone: 'normal' | 'anomaly'; chips?: string[]; body?: string;
}
export interface Message {
  body: string; time: string; fromSelf: boolean;
}
export interface TimelineEntry {
  title: string; time: string; body: string; tone: 'normal' | 'anomaly';
}
