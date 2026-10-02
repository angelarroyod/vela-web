import { useEffect, useState } from 'react';
import { useCare } from '../../care/useCare';
import { firstName, initials } from '../../care/logic';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/controls';
import { Avatar, Card, ListRow, Screen, ScreenHeader } from '../../ui/layout';
import { fs, shiftLabel } from './shared';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// ponytail: byte % 36 has a tiny bias toward A–D; irrelevant for a 7-day, single-use code.
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ABC[b % 36]).join('');

export default function Perfil() {
  const { patientId, patient, me, membership, go, toast } = useCare();
  const [code, setCode] = useState<string | null>(null); // null: loading, '': could not get one
  const shift = shiftLabel(membership.shift);
  const pFirst = firstName(patient?.fullName);

  // Reuse the latest open invite for this patient, or create one.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('invites').select('code').eq('patient_id', patientId).is('accepted_at', null)
        .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1);
      let c = (data as { code: string }[] | null)?.[0]?.code ?? '';
      // A taken code (unique violation 23505) gets one more try with a fresh one.
      for (let i = 0; !c && i < 2; i++) {
        const n = newCode();
        const { error } = await supabase.from('invites').insert({ patient_id: patientId, code: n, invited_by: me.id });
        if (!error) c = n;
        else if (error.code !== '23505') break;
      }
      if (active) setCode(c);
    })();
    return () => { active = false; };
  }, [patientId, me.id]);

  const share = async () => {
    if (!code) return;
    if (navigator.share) {
      try {
        return await navigator.share({ text: `Únete al cuidado${pFirst ? ` de ${pFirst}` : ''} en Lazo con este código: ${code}` });
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // closed the share sheet; anything else falls back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(code);
      toast(`Código ${code} copiado. Ya puedes enviarlo.`);
    } catch {
      toast(`No se pudo copiar. Escribe el código a mano: ${code}.`);
    }
  };

  return (
    <Screen gap={14}>
      <ScreenHeader title="Perfil" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar text={initials(me.fullName)} size={60} radius={20} fontSize={21} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: fs(19) }}>{me.fullName}</p>
          <p style={{ margin: '2px 0 0', fontSize: fs(15), color: 'var(--ink2)' }}>Enfermera{shift ? ` · ${shift.toLowerCase()}` : ''}</p>
        </div>
      </div>
      <Card gap={12}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: fs(17) }}>Invitar a la familia</p>
        <p style={{ margin: 0, fontSize: fs(15), color: 'var(--ink2)', lineHeight: 1.4 }}>
          Comparte este código para que sigan el cuidado {pFirst ? `de ${pFirst}` : 'del paciente'}.
        </p>
        {code ? (
          <p style={{ margin: 0, fontSize: fs(30), fontWeight: 700, letterSpacing: '.3em', textAlign: 'center', padding: 10, borderRadius: 12, background: 'var(--bg)' }}>
            {/* read letter by letter, not as a word */}
            <span aria-hidden="true">{code}</span><span className="sr-only">Código {code.split('').join(' ')}</span>
          </p>
        ) : (
          <p role={code === '' ? 'alert' : undefined} style={{ margin: 0, fontSize: fs(15), color: code === '' ? 'var(--danger)' : 'var(--ink2)', fontWeight: code === '' ? 700 : 400 }}>
            {code === '' ? 'No se pudo preparar el código. Revisa la conexión y vuelve a abrir esta pantalla.' : 'Preparando el código…'}
          </p>
        )}
        <Button variant="outline" size="md" onClick={share} disabled={!code}>Compartir código</Button>
      </Card>
      <ListRow title="Configuración y tamaño de texto" onClick={() => go('ajustes')} />
    </Screen>
  );
}
