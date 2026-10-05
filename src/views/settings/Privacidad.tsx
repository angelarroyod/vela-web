import type { ReactNode } from 'react';
import { Card, Screen, ScreenHeader } from '../../ui/layout';

const SECTIONS: [string, string, ReactNode[]][] = [
  ['pv-h', 'Tus datos', [
    'Guardamos tu cuenta y lo que se anota del cuidado: signos, medicación, novedades y mensajes.',
    'Solo lo ve el equipo de cuidado del paciente.',
    'Nunca vendemos tus datos ni los usamos para publicidad.',
    'Puedes borrar tu cuenta cuando quieras, en Configuración.',
  ]],
  ['md-h', 'Aviso médico', [
    'Lazo sirve para anotar y compartir el cuidado.',
    'Lazo no es un aparato médico. No diagnostica ni sustituye a un profesional de la salud.',
    <b key="112">En una emergencia, llama al 112.</b>,
  ]],
];

// Used in the app (back → ajustes) and in AuthFlow (back → signup).
export default function Privacidad({ onBack }: { onBack: () => void }) {
  return (
    <Screen gap={14}>
      <ScreenHeader title="Privacidad y aviso médico" onBack={onBack} size={28} />
      {SECTIONS.map(([id, title, items]) => (
        <Card key={id} as="section" aria-labelledby={id}>
          <h2 id={id} style={{ margin: 0, fontSize: 'calc(var(--u)*19)', fontWeight: 700 }}>{title}</h2>
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'calc(var(--u)*16)', lineHeight: 1.45 }}>
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </Card>
      ))}
    </Screen>
  );
}
