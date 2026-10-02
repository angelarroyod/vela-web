import { useEffect, useId, useRef, useState } from 'react';
import { useCare } from '../../care/useCare';
import { useMessages, refetchLive } from '../../care/hooks';
import { firstName, initials, shiftLabel } from '../../care/logic';
import { supabase, mutate } from '../../lib/supabase';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../ui/feedback';
import { Avatar, Screen } from '../../ui/layout';

const fs = (n: number) => `calc(var(--u)*${n})`;

export default function Mensajes() {
  const { patientId, me, team, nameOf, toast } = useCare();
  const messages = useMessages(patientId, me.id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const inputId = useId();
  // ponytail: the chat is the patient's whole team; the header names the first nurse, like the design.
  const nurse = team.find((t) => t.role === 'nurse');
  const nurseFirst = firstName(nurse?.fullName);
  const to = nurseFirst || 'la enfermera';

  // New message → scroll the app's scrolling <main> to the bottom.
  useEffect(() => {
    const main = listRef.current?.closest('main');
    if (main) main.scrollTop = main.scrollHeight;
  }, [messages.length]);

  const send = async (text: string, fromDraft = false) => {
    const body = text.trim();
    if (!body) return;
    if (fromDraft) setDraft(''); // cleared up front so a second Enter can't send it twice
    const err = await mutate(supabase.from('messages').insert({ patient_id: patientId, sender_id: me.id, body }));
    if (err) {
      toast('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      if (fromDraft) setDraft((d) => (d ? `${body} ${d}` : body)); // keep anything typed while it was sending
      return;
    }
    refetchLive(); // show it now, don't wait for realtime
  };

  return (
    <Screen gap={0} style={{ padding: 0, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 14px', borderBottom: '1.5px solid var(--line)', background: 'var(--surface)' }}>
        {nurse?.fullName && <Avatar text={initials(nurse.fullName)} size={44} />}
        <div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: fs(18) }}>{nurse?.fullName || 'Mensajes'}</h1>
          {nurse && (
            <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: fs(14), fontWeight: 700, color: nurse.shift ? 'var(--ok)' : 'var(--ink2)' }}>
              {nurse.shift && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--ok)', flexShrink: 0 }} />}
              {nurse.shift ? `Enfermería · ${shiftLabel(nurse.shift).toLowerCase()}` : 'Enfermería'}
            </p>
          )}
        </div>
      </div>

      {messages.length === 0 && <div style={{ padding: '16px 20px 0' }}><EmptyState>Aún no hay mensajes. Escribe el primero aquí abajo.</EmptyState></div>}
      <ol ref={listRef} role="log" aria-live="polite" aria-label={nurseFirst ? `Mensajes con ${nurseFirst}` : 'Mensajes'}
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
              {/* The header names one nurse; anyone else on the team is named so their words aren't read as hers (sr-only line already says who). */}
              {!m.fromSelf && m.senderId !== nurse?.profileId && <span aria-hidden="true">{nameOf(m.senderId) || 'Alguien del equipo'} · </span>}{m.time}
            </span>
          </li>
        ))}
      </ol>

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1.5px solid var(--line)', padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div role="group" aria-label="Respuestas rápidas" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[nurseFirst ? `Gracias, ${nurseFirst}` : 'Gracias', '¿Cómo durmió?', '¿Tiene fiebre?'].map((q) => (
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
