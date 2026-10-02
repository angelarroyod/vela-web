import { useState } from 'react';
import { useCare } from '../../care/useCare';
import { refetchLive } from '../../care/hooks';
import { VITALS, aLas, checkVital, handoffSummary, pendingTasks, watchText } from '../../care/logic';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../components/Icon';
import { Button } from '../../ui/controls';
import { EmptyState, Sheet } from '../../ui/feedback';
import { Card, Screen, ScreenHeader, SectionLabel } from '../../ui/layout';
import { fs, removeRow, shiftLabel, useShift } from './shared';

const list = (parts: string[]) => new Intl.ListFormat('es', { type: 'conjunction' }).format(parts);

export default function Relevo() {
  const { patientId, me, membership, toast } = useCare();
  const s = useShift();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = s.nextName;
  const who = next || 'el siguiente turno';
  const shift = shiftLabel(membership.shift);

  // A vigilar: out-of-range controls (the fever has its own line) and other warnings noted this shift. Oldest first, no repeats.
  const watch: { text: string; time: string }[] = [];
  for (const v of [...s.shiftVitals].reverse()) {
    const out = VITALS.filter((d) => !(s.fever && d.k === 'temp') && ['low', 'high'].includes(checkVital(d, v[d.k])));
    const text = out.length ? `${list(out.map((d) => d.label.split(' (')[0].toLowerCase()))} fuera de lo normal` : '';
    if (text && !watch.some((w) => w.text === text)) watch.push({ text, time: v.time });
  }
  const timeline = [...s.shiftEvents].reverse();
  for (const e of timeline) if (e.tone === 'anomaly' && e.type !== 'vitals' && e.type !== 'doctor_notified') watch.push({ text: e.body || e.title, time: e.time });

  const watchLine = watchText({ fever: s.fever, watch });
  const watchCount = (s.fever ? 1 : 0) + watch.length;
  const tasks = pendingTasks({ fever: s.fever, pendingMeds: s.meds.filter((m) => m.status === 'pending') });
  const summary = handoffSummary({ fever: !!s.fever, watchCount, records: timeline.length });

  const handoff = async () => {
    setBusy(true);
    const { data, error } = await supabase.from('shift_handoffs').insert({
      patient_id: patientId, nurse_id: me.id, summary, recommendation: tasks.join(' '),
      started_at: new Date(s.since).toISOString(), ended_at: new Date().toISOString(),
    }).select('id').single();
    setBusy(false);
    setOpen(false);
    if (error || !data) return toast('No se pudo entregar el turno. Revisa la conexión e inténtalo de nuevo.');
    refetchLive();
    toast(next ? `Turno entregado a ${next}.` : 'Turno entregado.', async () => {
      const ok = await removeRow('shift_handoffs', (data as { id: string }).id);
      refetchLive();
      if (!ok) toast('No se pudo deshacer.');
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Relevo de turno" sub={shift ? `${shift} · para ${who}` : `Para ${who}`} />

      {s.handedOff && (
        <Card tone="soft" style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx={12} cy={12} r={10} fill="currentColor" />
            <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: fs(17) }}>Turno entregado{next ? ` a ${next}` : ''} {aLas(s.handedOff.time)}</p>
            <p style={{ margin: '4px 0 0', fontSize: fs(15), lineHeight: 1.4, color: 'var(--ink)' }}>
              {next || 'El siguiente turno'} y la familia ya pueden ver este resumen.
            </p>
          </div>
        </Card>
      )}

      <Card as="section" aria-labelledby="sum-h" gap={6}>
        <SectionLabel id="sum-h" eyebrow>RESUMEN</SectionLabel>
        <p style={{ margin: 0, fontSize: fs(19), fontWeight: 700, lineHeight: 1.35 }}>{summary}</p>
      </Card>

      {watchLine && (
        <Card as="section" tone="warn" aria-labelledby="watch-h" gap={6}>
          <h2 id="watch-h" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: fs(14), fontWeight: 700, letterSpacing: '.06em' }}>
            <Icon name="warning" size={18} strokeWidth={2.4} />A VIGILAR
          </h2>
          <p style={{ margin: 0, fontSize: fs(17), lineHeight: 1.4, fontWeight: 700 }}>{watchLine}</p>
        </Card>
      )}

      <Card as="section" aria-labelledby="pend-h">
        <SectionLabel id="pend-h" eyebrow>PARA {who.toUpperCase()}</SectionLabel>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: fs(16), lineHeight: 1.4 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--pri)', marginTop: 8, flexShrink: 0 }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="tl-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel id="tl-h">Lo que pasó en el turno</SectionLabel>
        {timeline.length === 0 ? <EmptyState>Aún no hay nada anotado en este turno. Lo que registres aparecerá aquí.</EmptyState> : (
          <ol style={{ margin: '0 0 0 6px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', borderLeft: '2px solid var(--line)' }}>
            {timeline.map((e) => (
              <li key={e.id} style={{ position: 'relative', padding: '0 0 16px 20px' }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: -8, top: 4, width: 14, height: 14, borderRadius: 99, background: e.tone === 'anomaly' ? 'var(--warn)' : 'var(--pri)', border: '3px solid var(--bg)' }} />
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 10, fontWeight: 700, fontSize: fs(16) }}>
                  <span>{e.tone === 'anomaly' && <span className="sr-only">Importante: </span>}{e.title}</span>
                  <span style={{ color: 'var(--ink2)', fontWeight: 600 }}>{e.time}</span>
                </p>
                {e.body && <p style={{ margin: '2px 0 0', fontSize: fs(15), lineHeight: 1.4, color: 'var(--ink2)' }}>{e.body}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {!s.handedOff && <Button onClick={() => setOpen(true)}>{next ? `Entregar turno a ${next}` : 'Entregar turno'}</Button>}

      <Sheet open={open} title={next ? `¿Entregar el turno a ${next}?` : '¿Entregar el turno?'} confirmLabel="Sí, entregar turno" busy={busy}
        onConfirm={handoff} onClose={() => setOpen(false)}
        items={[
          'Resumen del turno',
          ...(watchCount ? [watchCount === 1 ? '1 cosa a vigilar' : `${watchCount} cosas a vigilar`] : []),
          tasks.length === 1 ? `1 tarea para ${who}` : `${tasks.length} tareas para ${who}`,
          'La familia verá el resumen',
        ]} />
    </Screen>
  );
}
