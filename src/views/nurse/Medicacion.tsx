import { useState } from 'react';
import { useCare } from '../../care/useCare';
import { refetchLive, useMedications } from '../../care/hooks';
import { dayLabel, firstName } from '../../care/logic';
import type { Medication } from '../../care/data';
import { hhmm } from '../../lib/supabase';
import { unqueue, writeOrQueue } from '../../lib/offline';
import { Icon } from '../../components/Icon';
import { Button } from '../../ui/controls';
import { EmptyState, ProgressBar } from '../../ui/feedback';
import { Card, Screen, ScreenHeader } from '../../ui/layout';
import { fs, todays, undoWrite } from './shared';

export default function Medicacion() {
  const { patientId, patient, me, go, toast } = useCare();
  // id → HH:MM given here, shown until the list catches up (or the outbox is sent, when offline).
  const [given, setGiven] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const meds = todays(useMedications(patientId)).map((m): Medication =>
    m.status === 'pending' && given[m.id] ? { ...m, status: 'administered', atTime: given[m.id] } : m);
  const done = meds.filter((m) => m.status === 'administered').length;
  const nextId = meds.find((m) => m.status === 'pending')?.id;
  const pFirst = firstName(patient?.fullName);

  const give = async (m: Medication) => {
    const row = { status: 'administered', administered_by: me.id, administered_at: new Date().toISOString() };
    setBusy(m.id);
    const r = await writeOrQueue('medications', row, m.id); // offline: queued, sent on reconnect
    if ('error' in r) {
      setBusy('');
      return toast('No se pudo marcar la dosis. Inténtalo de nuevo.');
    }
    // The log line the family feed ("dio la medicación") and the handoff timeline read. Best effort: the dose is already given.
    const eRow = { patient_id: patientId, author_id: me.id, type: 'medication', title: 'Medicación', severity: 'info',
      body: `${[m.name, m.dose].filter(Boolean).join(' ')}.`, occurred_at: row.administered_at };
    const re = await writeOrQueue('care_events', eRow);
    setBusy('');
    const at = hhmm(row.administered_at);
    setGiven((g) => ({ ...g, [m.id]: at }));
    refetchLive();
    toast(`${m.name} marcada como dada a las ${at}.`, async () => {
      const ok = ('queued' in r
        ? unqueue('medications', row)
        : !('error' in await writeOrQueue('medications', { status: 'pending', administered_by: null, administered_at: null }, m.id)))
        && ('error' in re || await undoWrite('care_events', eRow, re));
      setGiven((g) => ({ ...g, [m.id]: '' }));
      refetchLive();
      if (!ok) toast('No se pudo deshacer.');
    });
  };

  return (
    <Screen gap={14}>
      <ScreenHeader title="Medicación" sub={pFirst ? `${pFirst} · ${dayLabel()}` : dayLabel()} onBack={() => go('inicio')} backLabel="Volver al inicio" />
      {meds.length === 0 ? <EmptyState>Aún no hay dosis programadas para hoy.</EmptyState> : (
        <>
          <Card><ProgressBar value={done} max={meds.length} label={`${done} de ${meds.length} dosis dadas hoy`} /></Card>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meds.map((m) => {
              const pending = m.status === 'pending';
              return (
                <Card as="li" key={m.id} padding="14px 16px" gap={12} style={{ border: `2px solid ${pending ? 'var(--pri)' : 'var(--line)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {pending
                      ? <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 99, border: '2.5px dashed var(--pri)', flexShrink: 0 }} />
                      : <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="check" size={18} strokeWidth={2.8} color="#fff" />
                        </span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p id={`med-${m.id}`} style={{ margin: 0, fontWeight: 700, fontSize: fs(17) }}>{m.name} <span style={{ fontWeight: 600, color: 'var(--ink2)' }}>{m.dose}</span></p>
                      {m.reason && <p style={{ margin: '2px 0 0', fontSize: fs(15), color: 'var(--ink2)' }}>{m.reason}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: fs(17) }}>{m.time}</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: fs(14), color: pending ? 'var(--priText)' : 'var(--ok)' }}>
                        {pending ? (m.id === nextId ? 'Próxima' : 'Pendiente') : m.atTime ? `Dada · ${m.atTime}` : 'Dada'}
                      </p>
                    </div>
                  </div>
                  {pending && <Button size="md" aria-describedby={`med-${m.id}`} onClick={() => give(m)} disabled={busy === m.id}>Marcar como dada</Button>}
                </Card>
              );
            })}
          </ul>
        </>
      )}
    </Screen>
  );
}
