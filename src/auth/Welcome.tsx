import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { Logo } from '../ui/brand';
import { Button } from '../ui/controls';
import { Screen } from '../ui/layout';

const fs = (n: number) => `calc(var(--u)*${n})`;

const POINTS: [IconName, string][] = [
  ['pulse', 'La enfermera anota cómo va el turno.'],
  ['heart', 'La familia ve cómo está, en cualquier momento.'],
];

export default function Welcome({ goSignup, goLogin }: { goSignup: () => void; goLogin: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--welcome)' }}>
      <Screen form gap={0} style={{ minHeight: '100dvh', padding: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 28px 40px', textAlign: 'center' }}>
          <Logo />
          <p style={{ margin: 0, fontSize: fs(19), lineHeight: 1.4, color: 'var(--welcomeSub)', maxWidth: 290, textWrap: 'pretty' }}>Quien cuida y quien quiere, siempre unidos.</p>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: '28px 28px 0 0', padding: '28px 24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <p style={{ margin: 0, fontSize: fs(19), lineHeight: 1.4, fontWeight: 700, textWrap: 'pretty' }}>Cuida a tu familiar en equipo, en un solo lugar.</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {POINTS.map(([icon, text]) => (
              <li key={icon} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--priSoft)', color: 'var(--priText)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={icon} size={20} />
                </span>
                <span style={{ fontSize: fs(17), lineHeight: 1.4, paddingTop: 6 }}>{text}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button onClick={goSignup}>Crear cuenta</Button>
            <Button variant="outline" onClick={goLogin}>Ya tengo cuenta</Button>
          </div>
        </div>
      </Screen>
    </div>
  );
}
