import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useCare } from '../../care/useCare';
import { firstName } from '../../care/logic';
import { supabase } from '../../lib/supabase';
import { useTextScale } from '../../lib/textScale';
import { Button } from '../../ui/controls';
import { Sheet } from '../../ui/feedback';
import { Card, ListRow, Screen, ScreenHeader } from '../../ui/layout';

const fs = (n: number) => `calc(var(--u)*${n})`;
// ponytail: px glyphs as in the design — they live in fixed 56px boxes and must not outgrow them.
const stepBtn = { width: 56, height: 56, borderRadius: 14, border: '1.5px solid var(--field)', background: 'var(--surface)', fontWeight: 700, flexShrink: 0 } as const;
// At a bound the button is aria-disabled, not disabled: a disabled button drops keyboard focus to <body>. setScale clamps.
const dim = { opacity: 0.5, cursor: 'not-allowed' } as const;

export default function Ajustes() {
  const { go, me, patient, toast } = useCare();
  const { signOut } = useAuth();
  const [scale, setScale] = useTextScale();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const who = firstName(patient?.fullName);

  const deleteAccount = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke('delete-account');
    setBusy(false);
    if (!error) return signOut();
    setConfirm(false); // the scrim would cover the toast
    toast('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
  };

  return (
    <Screen gap={14}>
      <ScreenHeader title="Configuración" onBack={() => go('perfil')} backLabel="Volver al perfil" />
      <Card as="section" aria-labelledby="ts-h" gap={12}>
        <h2 id="ts-h" style={{ margin: 0, fontSize: fs(17), fontWeight: 700 }}>Tamaño del texto</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="press" aria-label="Texto más pequeño" aria-disabled={scale <= 100} onClick={() => setScale(scale - 10)} style={{ ...stepBtn, fontSize: 18, ...(scale <= 100 && dim) }}>A−</button>
          <p aria-live="polite" style={{ flex: 1, margin: 0, textAlign: 'center', fontWeight: 700, fontSize: fs(22) }}>{`${scale} %`}</p>
          <button type="button" className="press" aria-label="Texto más grande" aria-disabled={scale >= 200} onClick={() => setScale(scale + 10)} style={{ ...stepBtn, fontSize: 24, ...(scale >= 200 && dim) }}>A+</button>
        </div>
        <p style={{ margin: 0, fontSize: fs(16), color: 'var(--ink2)', lineHeight: 1.4 }}>Así se verá el texto en toda la app.</p>
      </Card>
      <Card gap={4}>
        <p style={{ margin: 0, fontSize: fs(15), color: 'var(--ink2)' }}>Cuenta</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: fs(17), wordBreak: 'break-all' }}>{me.email}</p>
      </Card>
      <ListRow title="Privacidad y aviso médico" onClick={() => go('privacidad')} />
      <ListRow title="Cerrar sesión" chevron={false} onClick={() => void signOut()} />
      <Button variant="dangerOutline" onClick={() => setConfirm(true)} style={{ marginTop: 8 }}>Eliminar mi cuenta</Button>
      <Sheet open={confirm} title="¿Eliminar tu cuenta?" tone="danger" confirmLabel="Sí, eliminar mi cuenta" busy={busy}
        onConfirm={() => void deleteAccount()} onClose={() => setConfirm(false)}
        items={['Se borrarán tu cuenta y tus mensajes.', 'No se puede deshacer.',
          `El cuidado ${who ? `de ${who}` : 'del paciente'} seguirá para el resto del equipo.`]} />
    </Screen>
  );
}
