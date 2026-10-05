import { useEffect, useId, useRef, useState } from 'react';
import { useCare } from '../care/useCare';
import { refetchLive } from '../care/hooks';
import { firstName, initials, listEs, shiftLabel } from '../care/logic';
import { writeOrQueue } from '../lib/offline';
import { Icon } from '../components/Icon';
import { Button } from '../ui/controls';
import { EmptyState } from '../ui/feedback';
import { Avatar, Screen } from '../ui/layout';

const fs = (n: number) => `calc(var(--u)*${n})`;

// One thread per patient, shared by the whole care team. Family talk to the nurse; the nurse talks to the family.
export default function Mensajes() {
  const { role, patientId, patient, me, team, messages, nameOf, toast, go } = useCare();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const inputId = useId();
  const isNurse = role === 'nurse';

  // Who the header names. Family: the first nurse, like the design. Nurse: every family member.
  // ponytail: one shared thread; other nurses' messages show their name next to the time.
  const nurse = team.find((t) => t.role === 'nurse');
  const family = team.filter((t) => t.role !== 'nurse' && t.profileId !== me.id);
  const header = isNurse ? family : nurse ? [nurse] : [];
  const headerIds = header.map((h) => h.profileId);
  const names = header.map((h) => firstName(h.fullName)).filter(Boolean);
  const title = isNurse
    ? (names.length ? listEs(names) : 'Familia')
    : (nurse?.fullName || 'Mensajes');
  // A name only for a one-to-one header; anyone unnamed or a group gets the neutral word.
  const to = header.length === 1 && names[0] ? names[0] : isNurse ? 'la familia' : 'la enfermera';
  // "No family yet" only when the thread agrees: team is [] while care_team loads or if it fails.
  const noFamily = isNurse && family.length === 0 && !messages.some((m) => !m.fromSelf);
  const patientFirst = firstName(patient?.fullName);
  const quick = isNurse
    ? ['Todo tranquilo por aquí.', 'Ahora lo reviso.', 'Te aviso si hay cambios.']
    : [names[0] ? `Gracias, ${names[0]}` : 'Gracias', '¿Cómo durmió?', '¿Tiene fiebre?'];

  // New message → scroll the app's scrolling <main> to the bottom.
  useEffect(() => {
    const main = listRef.current?.closest('main');
    if (main) main.scrollTop = main.scrollHeight;
  }, [messages.length]);

  const send = async (text: string, fromDraft = false) => {
    const body = text.trim();
    if (!body) return;
    if (fromDraft) setDraft(''); // cleared up front so a second Enter can't send it twice
    // Offline it waits in the outbox like any other record (the server stamps created_at when it lands).
    const r = await writeOrQueue('messages', { patient_id: patientId, sender_id: me.id, body });
    if ('queued' in r) {
      toast('Sin conexión. Tu mensaje se enviará al volver la conexión.');
      return;
    }
    if ('error' in r) {
      toast('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      if (fromDraft) setDraft((d) => (d ? `${body} ${d}` : body)); // keep anything typed while it was sending
      return;
    }
    refetchLive(); // show it now, don't wait for realtime
  };

  return (
    <Screen gap={0} style={{ padding: 0, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 14px', borderBottom: '1.5px solid var(--line)', background: 'var(--surface)' }}>
        {header[0]?.fullName && <Avatar text={initials(header[0].fullName)} size={44} />}
        <div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: fs(18) }}>{title}</h1>
          {isNurse ? (
            <p style={{ margin: '2px 0 0', fontSize: fs(14), fontWeight: 700, color: 'var(--ink2)' }}>
              {patientFirst ? `Familia de ${patientFirst}` : 'Familia'}
            </p>
          ) : nurse && (
            <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: fs(14), fontWeight: 700, color: nurse.shift ? 'var(--ok)' : 'var(--ink2)' }}>
              {nurse.shift && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--ok)', flexShrink: 0 }} />}
              {nurse.shift ? `Enfermería · ${shiftLabel(nurse.shift).toLowerCase()}` : 'Enfermería'}
            </p>
          )}
        </div>
      </div>

      {noFamily ? (
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EmptyState>Todavía no se ha unido nadie de la familia. Comparte el código de invitación de tu Perfil y podrás escribirles aquí.</EmptyState>
          <Button variant="outline" onClick={() => go('perfil')}>Invitar a la familia</Button>
        </div>
      ) : messages.length === 0 && (
        <div style={{ padding: '16px 20px 0' }}><EmptyState>Aún no hay mensajes. Escribe el primero aquí abajo.</EmptyState></div>
      )}
      <ol ref={listRef} role="log" aria-live="polite" aria-label={names.length ? `Mensajes con ${listEs(names)}` : 'Mensajes'}
        style={{ flex: 1, listStyle: 'none', margin: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => (
          <li key={m.id} style={{ alignSelf: m.fromSelf ? 'flex-end' : 'flex-start', maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="sr-only">{m.fromSelf ? 'Tú dijiste:' : `${nameOf(m.senderId) || 'Alguien del equipo'} dijo:`}</span>
            <p style={{ margin: 0, background: m.fromSelf ? 'var(--pri)' : 'var(--surface)', color: m.fromSelf ? 'var(--onPri)' : 'var(--ink)',
              border: `1.5px solid ${m.fromSelf ? 'var(--pri)' : 'var(--line)'}`, borderRadius: m.fromSelf ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
              padding: '12px 14px', fontSize: fs(16), lineHeight: 1.4, overflowWrap: 'anywhere' }}>
              {m.body}
            </p>
            <span style={{ fontSize: fs(13), color: 'var(--ink2)', textAlign: m.fromSelf ? 'right' : 'left' }}>
              {/* Name the sender unless the header already names exactly them (the sr-only line always says who). */}
              {!m.fromSelf && (headerIds.length !== 1 || m.senderId !== headerIds[0]) && <span aria-hidden="true">{nameOf(m.senderId) || 'Alguien del equipo'} · </span>}{m.time}
            </span>
          </li>
        ))}
      </ol>

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1.5px solid var(--line)', padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div role="group" aria-label="Respuestas rápidas" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {quick.map((q) => (
            <button key={q} type="button" className="press" onClick={() => void send(q)}
              style={{ flexShrink: 0, minHeight: 48, padding: '0 14px', borderRadius: 99, border: '1.5px solid var(--pri)', background: 'var(--surface)', color: 'var(--priText)',
                fontWeight: 700, fontSize: fs(15) }}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label htmlFor={inputId} className="sr-only">Escribe un mensaje a {to}</label>
          <input id={inputId} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 /* IME still composing; 229 = Safari */) void send(draft, true); }}
            placeholder="Escribe un mensaje…"
            style={{ flex: 1, minWidth: 0, minHeight: 52, border: '1.5px solid var(--field)', borderRadius: 99, padding: '0 18px', fontSize: fs(16), background: 'var(--surface)' }} />
          <button type="button" className="press" aria-label="Enviar mensaje" onClick={() => void send(draft, true)}
            style={{ width: 52, height: 52, borderRadius: 99, border: 'none', background: 'var(--pri)', color: 'var(--onPri)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="send" size={22} />
          </button>
        </div>
      </div>
    </Screen>
  );
}
