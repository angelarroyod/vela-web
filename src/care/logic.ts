// Pure care logic + copy, mirroring the design's state machine (Vela Rediseño.dc.html) with real inputs.

export type VitalKey = 'sys' | 'dia' | 'hr' | 'temp' | 'spo2';
// lo/hi = normal range (design). min/max = physically plausible; outside it is a typo, not a reading
// (also keeps temp under numeric(4,1)'s 999.9 so a queued insert can't get stuck in the outbox).
export type VitalDef = { k: VitalKey; label: string; unit: string; lo: number; hi: number; range: string; min: number; max: number };
export type VitalState = 'empty' | 'invalid' | 'low' | 'high' | 'ok';

export const VITALS: VitalDef[] = [
  { k: 'sys', label: 'Presión máxima (sistólica)', unit: 'mmHg', lo: 90, hi: 140, range: '90 a 140', min: 40, max: 300 },
  { k: 'dia', label: 'Presión mínima (diastólica)', unit: 'mmHg', lo: 60, hi: 90, range: '60 a 90', min: 20, max: 200 },
  { k: 'hr', label: 'Pulso', unit: 'latidos/min', lo: 60, hi: 100, range: '60 a 100', min: 20, max: 250 },
  { k: 'temp', label: 'Temperatura', unit: '°C', lo: 36, hi: 37.5, range: '36,0 a 37,5', min: 30, max: 45 },
  { k: 'spo2', label: 'Oxígeno en sangre', unit: '%', lo: 95, hi: 100, range: '95 a 100', min: 50, max: 100 },
];

type Raw = string | number | null | undefined;
const blank = (raw: Raw) => raw == null || String(raw).trim() === '';

// "36,7" or "36.7" → 36.7; anything else → NaN.
export const parseDec = (raw: Raw): number => (blank(raw) ? NaN : Number(String(raw).trim().replace(',', '.')));

export function checkVital(def: VitalDef, raw: Raw): VitalState {
  if (blank(raw)) return 'empty';
  const n = parseDec(raw);
  if (!Number.isFinite(n)) return 'invalid'; // also "Infinity", which Number() accepts
  if (n < def.min || n > def.max) return 'invalid';
  return n < def.lo ? 'low' : n > def.hi ? 'high' : 'ok';
}

export function vitalMessage(def: VitalDef, state: VitalState, raw?: Raw): string {
  if (state === 'ok') return 'Dentro de lo normal';
  if (state === 'high') return `Más alto de lo normal (normal: ${def.range})`;
  if (state === 'low') return `Más bajo de lo normal (normal: ${def.range})`;
  if (state === 'invalid') return Number.isFinite(parseDec(raw)) ? `Revisa el número: no parece un valor real (normal: ${def.range})` : 'Escribe solo números, por ejemplo 72';
  return `Normal: ${def.range} ${def.unit}`;
}

// 36.7 → "36,7". Missing → "—".
export const fmtDec = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? '—' : String(n).replace('.', ','));

export const isFever = (temp: number | null | undefined) => temp != null && temp > 37.5;

// "a las 06:00", but "a la 01:15".
const hora = (prep: string, time: string) => `${prep} ${time.startsWith('01:') ? 'la' : 'las'} ${time}`;
export const aLas = (time: string) => hora('a', time);

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h >= 6 && h < 12 ? 'Buenos días' : h >= 12 && h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

// "martes 26 de junio"
export const dayLabel = (d = new Date()) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(d).replace(',', '').toLowerCase();

const words = (full: string | null | undefined) => (full ?? '').trim().split(/\s+/).filter(Boolean);
// membership.shift is free text; the two known values get plain-language labels.
export const shiftLabel = (s: string | null | undefined) => (s === 'night' ? 'Turno de noche' : s === 'day' ? 'Turno de día' : (s ?? ''));
export const firstName = (full: string | null | undefined) => words(full)[0] ?? '';
export const initials = (full: string | null | undefined) => words(full).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export type Fever = { temp: number; time: string; notified: boolean; notifiedAt?: string };

// Latest vitals over 37,5 °C; `notified` once a doctor_notified event exists after that reading.
export function feverState(
  latest: { temp: number | null; takenAt: string; time: string } | undefined,
  events: { type: string; occurredAt: string; time: string }[],
): Fever | null {
  if (!latest || !isFever(latest.temp)) return null;
  const n = events.find((e) => e.type === 'doctor_notified' && Date.parse(e.occurredAt) >= Date.parse(latest.takenAt));
  return { temp: latest.temp as number, time: latest.time, notified: !!n, notifiedAt: n?.time };
}

export type NextStep = {
  eyebrow: string; title: string; sub: string; cta: string;
  target: 'notify' | 'signos' | 'meds' | 'relevo'; tone: 'danger' | 'hero';
};
export type NextStepInput = {
  fever: { temp: number; time: string } | null;
  feverNotified: boolean;
  hasVitals: boolean; // any vitals row for this patient
  nextMed: { name: string; dose: string; time: string } | null;
  handoffDone: boolean;
  patientFirst: string;
  nextShiftName: string; // '' when unknown
  meFirst?: string;
};

// The nurse home "Lo siguiente" card.
export function nextStep(i: NextStepInput): NextStep {
  const step = (title: string, sub: string, cta: string, target: NextStep['target']): NextStep =>
    ({ eyebrow: 'LO SIGUIENTE', title, sub, cta, target, tone: 'hero' });
  if (i.fever && !i.feverNotified) {
    return { eyebrow: 'AVISA AL MÉDICO', title: `Fiebre de ${fmtDec(i.fever.temp)} °C ${aLas(i.fever.time)}`,
      sub: 'Llama al médico y cuéntale cómo está.', cta: 'Ya avisé al médico', target: 'notify', tone: 'danger' };
  }
  if (!i.hasVitals) {
    return step('Registrar los primeros signos vitales',
      `Es tu primer turno con ${i.patientFirst || 'este paciente'}. Este control servirá de referencia para el resto del turno.`,
      'Registrar signos', 'signos');
  }
  if (i.nextMed) {
    const med = [i.nextMed.name, i.nextMed.dose].filter(Boolean).join(' ');
    return step(`Dar ${med} ${aLas(i.nextMed.time)}`, 'Márcala como dada cuando se la des.', 'Ir a medicación', 'meds');
  }
  if (!i.handoffDone) {
    return step(i.nextShiftName ? `Entregar el turno a ${i.nextShiftName}` : 'Entregar el turno',
      'El resumen ya está listo para revisar.', 'Preparar relevo', 'relevo');
  }
  return step('Todo al día', i.meFirst ? `Turno entregado. Buen descanso, ${i.meFirst}.` : 'Turno entregado. Buen descanso.', 'Ver relevo', 'relevo');
}

// Handoff "RESUMEN" line. `watchCount` includes the fever when there is one.
export function handoffSummary({ fever, watchCount, records }: { fever: boolean; watchCount: number; records: number }) {
  if (records === 0) return 'Turno recién empezado. Aún no hay registros.';
  const head = fever ? 'Turno con fiebre.' : 'Turno tranquilo.';
  const tail = watchCount === 0 ? 'Nada a vigilar.' : watchCount === 1 ? 'Hay 1 cosa a vigilar.' : `Hay ${watchCount} cosas a vigilar.`;
  return `${head} ${tail}`;
}

// Handoff "PARA …" list.
export function pendingTasks({ fever, pendingMeds }: {
  fever: Fever | null;
  pendingMeds: { name: string; dose: string; time: string }[];
}): string[] {
  return [
    ...(fever ? [fever.notified
      ? `El médico ya está avisado por la fiebre${fever.notifiedAt ? ` (aviso ${aLas(fever.notifiedAt)})` : ''}.`
      : `Avisar al médico por la fiebre de ${fmtDec(fever.temp)} °C.`] : []),
    ...pendingMeds.map((m) => `Dar ${[m.name, m.dose].filter(Boolean).join(' ')} ${aLas(m.time)}.`),
    fever ? 'Tomar la temperatura cada 2 horas.' : 'Avisar al médico si aparece fiebre (más de 37,5 °C).',
  ];
}

// Handoff "A VIGILAR" text. '' when there is nothing to watch (hide the section).
export function watchText({ fever, watch }: { fever: { temp: number; time: string } | null; watch: { text: string; time: string }[] }) {
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const parts = [
    ...(fever ? [`fiebre de ${fmtDec(fever.temp)} °C ${aLas(fever.time)}`] : []),
    ...watch.map((w) => `${lower(w.text.trim().replace(/\.+$/, ''))} ${hora('desde', w.time)}`),
  ];
  if (!parts.length) return '';
  const s = listEs(parts);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.${fever ? '' : ' Sin fiebre.'}`;
}

// "Violeta, Ana y Luis".
export const listEs = (parts: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(parts);

// Messages from others newer than the last time this user opened the chat. ISO timestamps from one
// source (Postgres, server-set by 0005) compare correctly as strings; '' (never opened) counts everything.
export const unreadCount = (msgs: { fromSelf: boolean; createdAt: string }[], seen: string) =>
  msgs.filter((m) => !m.fromSelf && m.createdAt > seen).length;
