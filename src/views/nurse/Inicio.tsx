import { useState } from 'react';
import { useCare } from '../../care/useCare';
import { refetchLive } from '../../care/hooks';
import { aLas, firstName, fmtDec, greeting, initials, nextStep } from '../../care/logic';
import { writeOrQueue } from '../../lib/offline';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../ui/brand';
import { Button } from '../../ui/controls';
import { Avatar, Card, Chip, ListRow, Screen, ScreenHeader, SectionLabel } from '../../ui/layout';
import { fs, shiftLabel, useShift } from './shared';

// ponytail: module-level so a notice queued offline survives leaving Inicio; the real event takes over once sent.
let queuedNotice = ''; // takenAt of the fever reading whose "Avisó al médico" is in the outbox

export default function Inicio() {
  const { patientId, patient, me, membership, go, toast } = useCare();
  const s = useShift();
  const [busy, setBusy] = useState(false);
  const meFirst = firstName(me.fullName);
  const feverAt = s.vitals[0]?.takenAt;
  const next = nextStep({
    fever: s.fever, feverNotified: !!s.fever?.notified || queuedNotice === feverAt, hasVitals: s.vitals.length > 0, nextMed: s.nextMed,
    handoffDone: !!s.handedOff, patientFirst: firstName(patient?.fullName), nextShiftName: s.nextName, meFirst,
  });
  const done = s.meds.filter((m) => m.status === 'administered').length;
  const lastVital = s.shiftVitals[0];

  const notify = async () => {
    if (!s.fever) return;
    setBusy(true);
    const r = await writeOrQueue('care_events', {
      patient_id: patientId, author_id: me.id, type: 'doctor_notified', title: 'Avisó al médico',
      body: `Por la fiebre de ${fmtDec(s.fever.temp)} °C.`, severity: 'warning', occurred_at: new Date().toISOString(),
    });
    if ('queued' in r) queuedNotice = feverAt ?? ''; // the hero moves on: a second tap would queue a duplicate
    setBusy(false);
    if ('error' in r) return toast('No se pudo anotar el aviso. Inténtalo de nuevo.');
    if ('queued' in r) return toast('Guardado en el teléfono. Se enviará al volver la conexión.');
    refetchLive();
    toast('Queda anotado que avisaste al médico.');
  };
  const t = next.target;
  const act = t === 'notify' ? notify : () => go(t);

  return (
    <Screen gap={20}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* the sidebar carries the logo from 900px */}
        <div className="lz-mobile-only" style={{ marginRight: 'auto' }}><LogoMark withName /></div>
        <Avatar text={initials(me.fullName)} label={me.fullName ? `Tu perfil, ${me.fullName}` : 'Tu perfil'} onClick={() => go('perfil')} />
      </div>
      <ScreenHeader title={meFirst ? `${greeting()}, ${meFirst}` : greeting()} sub={shiftLabel(membership.shift) || undefined} size={34} />

      <Card as="section" tone={next.tone === 'danger' ? 'heroDanger' : 'hero'} aria-labelledby="next-h" padding={20} gap={6}>
        <h2 id="next-h" style={{ margin: 0, fontSize: fs(14), fontWeight: 700, letterSpacing: '.08em', color: 'var(--heroSub)' }}>{next.eyebrow}</h2>
        <p style={{ margin: 0, fontSize: fs(22), fontWeight: 700, lineHeight: 1.25 }}>{next.title}</p>
        <p style={{ margin: 0, fontSize: fs(16), color: 'var(--heroSub)', lineHeight: 1.4 }}>{next.sub}</p>
        <Button variant="white" onClick={act} disabled={busy} style={{ marginTop: 12 }}>
          {next.cta}<Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Button>
      </Card>

      {patient && (
        <Card as="section" aria-label="Paciente" padding={18} gap={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar text={initials(patient.fullName).charAt(0)} size={52} radius={16} display fontSize={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: fs(18) }}>{patient.fullName}</p>
              <p style={{ margin: '2px 0 0', fontSize: fs(15), color: 'var(--ink2)' }}>
                {[patient.age != null && `${patient.age} años`, patient.room || 'en casa'].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* An open fever outranks the stored status (the family hero says "Necesita atención" too). */}
            {s.fever
              ? <Chip tone="warn" icon="warning">Fiebre</Chip>
              : /estable/i.test(patient.status)
                ? <Chip tone="status" icon="check">{patient.status}</Chip>
                : <Chip tone="warn" icon="warning">{patient.status}</Chip>}
            {patient.conditions.map((c) => <Chip key={c}>{c}</Chip>)}
          </div>
        </Card>
      )}

      <section aria-labelledby="shift-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel id="shift-h">En este turno</SectionLabel>
        <ListRow title="Medicación" sub={s.meds.length ? `${done} de ${s.meds.length} dosis dadas` : 'Sin dosis programadas hoy'} onClick={() => go('meds')} />
        <ListRow title="Signos vitales" sub={lastVital ? `Último control ${aLas(lastVital.time)}` : 'Aún no hay controles en este turno'} onClick={() => go('signos')} />
        <ListRow title="Relevo de turno" onClick={() => go('relevo')}
          sub={s.handedOff ? (s.nextName ? `Entregado a ${s.nextName}` : 'Turno entregado') : (s.nextName ? `Entregar a ${s.nextName}` : 'Entregar al siguiente turno')} />
      </section>
    </Screen>
  );
}
