import { useCare } from '../../care/useCare';
import { useCareEvents, useMedications, useVitals } from '../../care/hooks';
import { VITALS, aLas, checkVital, feverState, firstName, fmtDec, initials } from '../../care/logic';
import type { VitalKey } from '../../care/logic';
import type { Vital } from '../../care/data';
import { Icon } from '../../components/Icon';
import { Button } from '../../ui/controls';
import { Alert, EmptyState } from '../../ui/feedback';
import { Avatar, Card, Screen, SectionLabel } from '../../ui/layout';
import { todays } from '../nurse/shared';

const fs = (n: number) => `calc(var(--u)*${n})`;

// true = "Normal", false = "Revisar" (the design's ranges), null = reading missing.
const isOk = (v: Vital, keys: VitalKey[]) => {
  const s = keys.map((k) => checkVital(VITALS.find((d) => d.k === k)!, v[k]));
  return s.includes('empty') ? null : s.every((x) => x === 'ok');
};

export default function Estado() {
  const { patientId, patient, me, team, nameOf, go } = useCare();
  const vitals = useVitals(patientId);
  const events = useCareEvents(patientId);
  const meds = todays(useMedications(patientId)); // "al día" = today's doses, like the nurse's Medicación

  const v = vitals[0], e = events[0];
  const fever = feverState(v, events);
  const p = firstName(patient?.fullName);
  const nurseFirst = firstName(team.find((t) => t.role === 'nurse')?.fullName);
  const nurse = nurseFirst || 'La enfermera';
  const lastTime = v && (!e || Date.parse(v.takenAt) > Date.parse(e.occurredAt)) ? v.time : e?.time;
  const caregiver = (fever ? `${nurse} ${fever.notified ? 'ya avisó' : 'va a avisar'} al médico. ` : nurseFirst ? `${nurseFirst} es su enfermera. ` : '')
    + (lastTime ? `Última actualización ${aLas(lastTime)}.` : 'Aún no hay actualizaciones.');
  // Latest warning from the last 24 h; fever and readings already have their own blocks.
  const note = events.find((x) => x.tone === 'anomaly' && x.type !== 'vitals' && x.type !== 'doctor_notified' && Date.parse(x.occurredAt) > Date.now() - 864e5);
  const given = meds.filter((m) => m.status === 'administered').length;

  const rows = v ? [
    { label: 'Presión', value: v.sys == null || v.dia == null ? '—' : `${v.sys}/${v.dia}`, unit: 'mmHg', ok: isOk(v, ['sys', 'dia']) },
    { label: 'Pulso', value: v.hr ?? '—', unit: 'lpm', ok: isOk(v, ['hr']) },
    { label: 'Temperatura', value: fmtDec(v.temp), unit: '°C', ok: isOk(v, ['temp']) },
    { label: 'Oxígeno', value: v.spo2 ?? '—', unit: '%', ok: isOk(v, ['spo2']) },
  ] : [];

  return (
    <Screen gap={18}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: fs(16), color: 'var(--ink2)' }}>{me.fullName ? `Hola, ${firstName(me.fullName)}` : 'Hola'}</p>
          <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--fd)', fontWeight: 'var(--fdw)', fontSize: fs(32), lineHeight: 1.1 }}>¿Cómo está {p || 'tu familiar'}?</h1>
        </div>
        <Avatar text={initials(patient?.fullName)} label={`Perfil de ${p || 'tu familiar'}`} onClick={() => go('perfil')} />
      </div>

      <Card as="section" aria-label="Estado actual" tone="hero" padding={20}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: fs(15), color: 'var(--heroSub)' }}>
          <Icon name={fever ? 'warning' : 'check'} size={18} strokeWidth={fever ? 2.4 : 2.8} />
          {fever ? 'Necesita atención · en casa' : patient ? `${patient.status} · en casa` : 'En casa'}
        </p>
        <p style={{ margin: 0, fontFamily: 'var(--fd)', fontWeight: 'var(--fdw)', fontSize: fs(30), lineHeight: 1.15 }}>
          {fever ? `${p || 'Tu familiar'} tiene fiebre. Está recibiendo atención.` : `${p || 'Tu familiar'} está descansando con tranquilidad.`}
        </p>
        <p style={{ margin: 0, fontSize: fs(16), color: 'var(--heroSub)', lineHeight: 1.4 }}>{caregiver}</p>
      </Card>

      {(fever || note || meds.length > 0) && (
        <section aria-labelledby="know-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionLabel id="know-h">Lo que debes saber</SectionLabel>
          {fever && (
            <Alert tone="danger" title="Importante:">
              {`tiene fiebre (${fmtDec(fever.temp)} °C ${aLas(fever.time)}). ${nurse} ${fever.notified ? 'ya avisó' : 'va a avisar'} al médico.`}
            </Alert>
          )}
          {note && (
            <Alert title="Para saber:">
              {`${(note.body || note.title).replace(/\.+$/, '')} (${nameOf(note.authorId) || 'la enfermera'}, ${aLas(note.time)}).`}
            </Alert>
          )}
          {meds.length > 0 && <Alert tone="info" title="Medicación al día:">{`${given} de ${meds.length} dosis.`}</Alert>}
        </section>
      )}

      <section aria-labelledby="vit-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel id="vit-h">Últimos signos · {v ? v.time : 'sin datos'}</SectionLabel>
        {rows.length === 0 ? (
          <EmptyState>Aún no hay signos registrados hoy. Aparecerán aquí en cuanto {nurseFirst || 'la enfermera'} haga el primer control.</EmptyState>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            {rows.map((r) => (
              <Card as="li" key={r.label} gap={4} padding={14}>
                <span style={{ fontSize: fs(15), color: 'var(--ink2)', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontSize: fs(24), fontWeight: 700 }}>{r.value} <span style={{ fontSize: fs(14), color: 'var(--ink2)', fontWeight: 600 }}>{r.unit}</span></span>
                {r.ok != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: fs(14), fontWeight: 700, color: r.ok ? 'var(--ok)' : 'var(--warnInk)' }}>
                    <span aria-hidden="true">{r.ok ? '✓' : '!'}</span>{r.ok ? 'Normal' : 'Revisar'}
                  </span>
                )}
              </Card>
            ))}
          </ul>
        )}
      </section>

      <Button onClick={() => go('mensajes')}>Escribir a {nurseFirst || 'la enfermera'}</Button>
    </Screen>
  );
}
