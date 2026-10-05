import { useEffect, useState } from 'react';
import { useCare } from '../../care/useCare';
import { refetchLive } from '../../care/hooks';
import { VITALS, checkVital, fmtDec, isFever, parseDec } from '../../care/logic';
import type { VitalKey } from '../../care/logic';
import { writeOrQueue } from '../../lib/offline';
import { Button, SwitchRow, VitalField } from '../../ui/controls';
import { Alert } from '../../ui/feedback';
import { Screen, ScreenHeader } from '../../ui/layout';
import { fs, undoWrite } from './shared';

type Vit = Record<VitalKey, string>;
const EMPTY: Vit = { sys: '', dia: '', hr: '', temp: '', spo2: '' };
// ponytail: module-level so "Deshacer" can refill the form after the screen remounts.
let undone: { vit: Vit; note: string } | null = null;

export default function Signos() {
  const { patientId, patient, me, go, toast } = useCare();
  const [vit, setVit] = useState<Vit>(() => undone?.vit ?? EMPTY);
  const [note, setNote] = useState(() => undone?.note ?? '');
  useEffect(() => { undone = null; }, []);
  const [notify, setNotify] = useState<boolean | null>(null);
  const [vitErr, setVitErr] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const outCount = VITALS.filter((v) => ['low', 'high'].includes(checkVital(v, vit[v.k]))).length;
  const notifyOn = notify ?? outCount > 0;
  const tNow = parseDec(vit.temp);

  const save = async () => {
    const missing = VITALS.filter((v) => ['empty', 'invalid'].includes(checkVital(v, vit[v.k]))).map((v) => v.label.split(' (')[0].toLowerCase());
    if (missing.length) return setVitErr('Revisa: ' + missing.join(', ') + '.');
    setBusy(true);
    const int = (k: VitalKey) => Math.round(parseDec(vit[k])); // integer columns
    const [sys, dia, hr, spo2] = [int('sys'), int('dia'), int('hr'), int('spo2')];
    const temp = Math.round(parseDec(vit.temp) * 10) / 10;
    const at = new Date().toISOString(); // client time, so a queued control keeps when it was taken
    const vRow = { patient_id: patientId, recorded_by: me.id, bp_sys: sys, bp_dia: dia, hr, temp_c: temp, spo2, note: note.trim() || null, has_anomaly: outCount > 0, taken_at: at };
    // ponytail: web has no push. "Avisar" = a 'warning' event, highlighted in the family's feed.
    const eRow = { patient_id: patientId, author_id: me.id, type: 'vitals', title: 'Signos vitales', severity: notifyOn ? 'warning' : 'info', occurred_at: at,
      body: `Presión ${sys}/${dia}, pulso ${hr}, ${fmtDec(temp)} °C, oxígeno ${spo2} %.${isFever(temp) ? ' Fiebre.' : ''}` };
    const rv = await writeOrQueue('vitals', vRow);
    const re = 'error' in rv ? rv : await writeOrQueue('care_events', eRow);
    if ('error' in rv || 'error' in re) {
      if (!('error' in rv)) await undoWrite('vitals', vRow, rv); // no half-saved control
      setBusy(false);
      return setSaveFailed(true);
    }
    const kept = { vit, note };
    go('inicio');
    toast('queued' in rv ? 'Guardado en el teléfono. Se enviará al volver la conexión.' : notifyOn ? 'Control guardado. La familia ha sido avisada.' : 'Control guardado.', async () => {
      const ok = (await undoWrite('care_events', eRow, re)) && (await undoWrite('vitals', vRow, rv));
      refetchLive();
      if (!ok) return toast('No se pudo deshacer.');
      undone = kept;
      go('signos');
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Signos vitales" sub={patient?.fullName ? `${patient.fullName} · nuevo control` : 'Nuevo control'} />
      {isFever(tNow) && <Alert tone="danger" role="alert">Fiebre: {fmtDec(tNow)} °C. Después de guardar, avisa al médico.</Alert>}
      {outCount > 0 && (
        <Alert role="alert">
          {outCount === 1 ? 'Hay 1 valor fuera de lo normal. Revísalo antes de guardar.' : `Hay ${outCount} valores fuera de lo normal. Revísalos antes de guardar.`}
        </Alert>
      )}
      {VITALS.map((v) => (
        <VitalField key={v.k} def={v} value={vit[v.k]} onChange={(val) => { setVit((x) => ({ ...x, [v.k]: val })); setVitErr(''); }} />
      ))}
      <SwitchRow checked={notifyOn} onChange={setNotify} label="Avisar a la familia"
        description={outCount > 0 ? 'Recomendado: hay valores fuera de lo normal.' : 'Recibirán un aviso con este control.'} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="v-note" style={{ fontWeight: 700, fontSize: fs(16) }}>Nota <span style={{ fontWeight: 400, color: 'var(--ink2)' }}>(opcional)</span></label>
        <textarea id="v-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
          style={{ border: '1.5px solid var(--field)', borderRadius: 14, padding: '12px 14px', fontSize: fs(17), lineHeight: 1.4, background: 'var(--surface)', resize: 'vertical' }} />
      </div>
      {vitErr && <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 700, fontSize: fs(15) }}>{vitErr}</p>}
      {saveFailed && (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--dangerSoft)', border: '2px solid var(--danger)', borderRadius: 'var(--r)', padding: '14px 16px', color: 'var(--danger)' }}>
          <p style={{ margin: 0, fontSize: fs(16), lineHeight: 1.4, fontWeight: 700 }}>No se pudo guardar el control. Tus datos siguen aquí: no se ha perdido nada.</p>
          <Button variant="dangerOutline" size="md" onClick={save} disabled={busy} style={{ minHeight: 48, fontSize: fs(16) }}>Reintentar</Button>
        </div>
      )}
      <Button onClick={save} disabled={busy}>{notifyOn ? 'Guardar y avisar a la familia' : 'Guardar control'}</Button>
    </Screen>
  );
}
