import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useMembership } from '../../auth/useMembership';
import { useMessages } from '../../care/hooks';
import { supabase, mutate } from '../../lib/supabase';
import { Icon } from '../../components/Icon';

export default function Mensajes() {
  const { session } = useAuth();
  const { membership } = useMembership();
  const messages = useMessages(membership?.patient_id, session?.user.id ?? '');
  const [draft, setDraft] = useState('');

  const send = async () => {
    if (!draft.trim() || !membership) return;
    const body = draft.trim();
    setDraft('');
    const err = await mutate(supabase.from('messages').insert({ patient_id: membership.patient_id, sender_id: session?.user.id, body }));
    if (err) { setDraft(body); alert('No se pudo enviar: ' + err); }
  };

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 78px)', boxShadow: '0 6px 20px rgba(53,94,80,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--tint2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--onTint)' }}>CM</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Carmen Morales</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} /><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--brand)' }}>En turno ahora</span></div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 13, background: 'var(--page2)' }}>
          <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 11, color: 'var(--faint)' }}>HOY</div>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.fromSelf ? 'flex-end' : 'flex-start', maxWidth: '66%' }}>
              <div style={{ background: m.fromSelf ? 'var(--brand)' : 'var(--card)', color: m.fromSelf ? '#fff' : 'var(--ink2)', border: m.fromSelf ? 'none' : '1px solid var(--line)', borderRadius: m.fromSelf ? '18px 18px 6px 18px' : '18px 18px 18px 6px', padding: '12px 16px', fontWeight: 500, fontSize: 14, lineHeight: 1.5 }}>{m.body}</div>
              <div style={{ textAlign: m.fromSelf ? 'right' : 'left', fontWeight: 600, fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>{m.time}</div>
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, background: 'var(--card)', borderTop: '1px solid var(--line)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Escribe un mensaje…"
            style={{ flex: 1, background: 'var(--page)', borderRadius: 99, padding: '13px 18px', fontWeight: 500, fontSize: 14, color: 'var(--ink)', border: 'none', outline: 'none' }} />
          <button aria-label="Enviar" onClick={send} className="hoverable" style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 6px 14px rgba(92,138,119,.34)' }}>
            <Icon name="send" size={20} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
