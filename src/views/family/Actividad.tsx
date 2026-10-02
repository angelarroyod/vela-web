import { useState } from 'react';
import { useCare } from '../../care/useCare';
import { useCareEvents, useHandoffs, useVitals } from '../../care/hooks';
import type { CareEvent } from '../../care/data';
import { dayLabel, feverState, firstName, fmtDec } from '../../care/logic';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../ui/feedback';
import { Chip, Screen, ScreenHeader } from '../../ui/layout';

const fs = (n: number) => `calc(var(--u)*${n})`;

// What the nurse did, in words ("Marta registró los signos vitales"). Other types fall back to their title.
const ACTION: Record<string, string> = { vitals: 'registró los signos vitales', medication: 'dio la medicación', doctor_notified: 'avisó al médico', handoff: 'entregó el turno' };

export default function Actividad() {
  const { patientId, team, nameOf } = useCare();
  const events = useCareEvents(patientId);
  const vitals = useVitals(patientId);
  const handoffs = useHandoffs(patientId);
  const [warnOnly, setWarnOnly] = useState(false);

  // Handoffs live in their own table; they join the feed with their summary (Relevo tells the nurse "La familia verá el resumen").
  const handed = handoffs.filter((h) => h.endedAt).map((h): CareEvent => ({ id: h.id, type: 'handoff', title: '', body: h.summary, severity: 'info',
    occurredAt: h.endedAt as string, time: h.time, authorId: h.nurseId, tone: 'normal' }));
  // ponytail: the last 24 h stand in for "Hoy" so a night shift isn't cut at midnight; add paging if families need older history.
  const today = [...events, ...handed].filter((e) => Date.parse(e.occurredAt) > Date.now() - 864e5)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const warnCount = today.filter((e) => e.tone === 'anomaly').length;
  const feed = warnOnly ? today.filter((e) => e.tone === 'anomaly') : today;
  const nurse = firstName(team.find((t) => t.role === 'nurse')?.fullName) || 'la enfermera';
  const filters: [boolean, string][] = [[false, 'Todo'], [true, `Para saber (${warnCount})`]];

  return (
    <Screen gap={14}>
      <ScreenHeader title="Actividad" sub={`Hoy, ${dayLabel()}`} />
      <div role="group" aria-label="Filtrar actividad"
        style={{ display: 'flex', gap: 8, padding: 4, background: 'var(--surface)', border: '1.5px solid var(--line)', borderRadius: 14 }}>
        {filters.map(([w, label]) => {
          const on = warnOnly === w;
          return (
            <button key={String(w)} type="button" className="press" aria-pressed={on} onClick={() => setWarnOnly(w)}
              style={{ flex: 1, minHeight: 48, border: 'none', borderRadius: 10, background: on ? 'var(--pri)' : 'transparent', color: on ? 'var(--onPri)' : 'var(--ink)',
                fontWeight: 700, fontSize: fs(16) }}>
              {label}
            </button>
          );
        })}
      </div>

      {feed.length === 0 ? (
        <EmptyState>{warnOnly && today.length ? 'Hoy no hay nada que destacar.' : `Todavía no hay actividad hoy. Aparecerá aquí en cuanto ${nurse} anote algo.`}</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feed.map((e) => {
            const warn = e.tone === 'anomaly';
            const who = nameOf(e.authorId) || 'La enfermera';
            // A vitals event and its row share one timestamp (Signos writes both with the same `at`): readings as chips,
            // fever in words. No matching row (yet) → the event's own body.
            const v = e.type === 'vitals' ? vitals.find((x) => Date.parse(x.takenAt) === Date.parse(e.occurredAt)) : undefined;
            const fever = v && feverState(v, events);
            const body = !v ? e.body : fever ? `Tiene fiebre: ${fmtDec(fever.temp)} °C. ${who} ${fever.notified ? 'ya avisó' : 'va a avisar'} al médico.` : '';
            const chips = v ? [v.sys != null && v.dia != null && `Presión ${v.sys}/${v.dia}`, v.hr != null && `Pulso ${v.hr}`,
              v.temp != null && `${fmtDec(v.temp)} °C`, v.spo2 != null && `Oxígeno ${v.spo2} %`].filter((c) => c !== false) : [];
            return (
              <li key={e.id} style={{ background: warn ? 'var(--warnSoft)' : 'var(--surface)', border: `2px solid ${warn ? 'var(--warn)' : 'var(--line)'}`, borderRadius: 'var(--r)',
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {warn && (
                  <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: fs(13), letterSpacing: '.06em', color: 'var(--warnInk)' }}>
                    <Icon name="warning" size={16} strokeWidth={2.4} />PARA SABER
                  </span>
                )}
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: fs(16) }}>
                  <span><b>{who}</b> {ACTION[e.type] ?? (e.title ? `anotó: ${e.title}` : 'anotó algo')}</span>
                  <span style={{ color: 'var(--ink2)', fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                </p>
                {body && <p style={{ margin: 0, fontSize: fs(16), lineHeight: 1.45 }}>{body}</p>}
                {chips.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {chips.map((c) => <li key={c}><Chip tone="data">{c}</Chip></li>)}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
