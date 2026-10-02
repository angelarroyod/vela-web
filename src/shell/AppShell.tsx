import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { useCare } from '../care/useCare';
import type { ScreenId } from '../care/useCare';
import { useOnline, useOutboxCount } from '../lib/offline';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { LogoMark } from '../ui/brand';
import { ToastHost } from '../ui/feedback';

type Tab = { id: ScreenId; label: string; icon: IconName };
const NURSE_TABS: Tab[] = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'signos', label: 'Signos', icon: 'pulse' },
  { id: 'relevo', label: 'Relevo', icon: 'clipboard' },
  { id: 'perfil', label: 'Perfil', icon: 'user' },
];
const FAMILY_TABS: Tab[] = [
  { id: 'inicio', label: 'Estado', icon: 'home' },
  { id: 'actividad', label: 'Actividad', icon: 'pulse' },
  { id: 'mensajes', label: 'Mensajes', icon: 'chat' },
  { id: 'perfil', label: 'Perfil', icon: 'user' },
];

// Responsive shell: sidebar from 900px, bottom tab bar below. On every screen change the main area
// scrolls to the top and its first <h1> takes focus, so screen readers announce the new screen.
export function AppShell({ children }: { children: ReactNode }) {
  const { role, screen, go } = useCare();
  const { signOut } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const shown = useRef(screen);

  useEffect(() => {
    if (shown.current === screen) return;
    shown.current = screen;
    const m = mainRef.current;
    if (!m) return;
    m.scrollTop = 0;
    const h = m.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }, [screen]);

  const tabs = role === 'nurse' ? NURSE_TABS : FAMILY_TABS;
  const active = screen === 'meds' ? 'inicio' : screen;
  const inSettings = screen === 'ajustes' || screen === 'privacidad';

  return (
    <div className="lz-app">
      <nav className="lz-side" aria-label="Navegación principal">
        <LogoMark withName />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" className="lz-side-item" aria-current={t.id === active ? 'page' : undefined} onClick={() => go(t.id)}>
              <Icon name={t.icon} size={24} />{t.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button type="button" className="lz-side-item" aria-current={inSettings ? 'page' : undefined} onClick={() => go('ajustes')}>Configuración</button>
          <button type="button" className="lz-side-item" onClick={() => void signOut()}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="lz-body">
        <OfflineBar role={role} />
        <main ref={mainRef} className="lz-main">{children}</main>
        <ToastHost />
      </div>

      {!inSettings && (
        <nav className="lz-tabs" aria-label="Navegación principal">
          {tabs.map((t) => {
            const a = t.id === active;
            return (
              <button key={t.id} type="button" aria-current={a ? 'page' : undefined} onClick={() => go(t.id)}
                style={{ flex: 1, minHeight: 64, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 0 4px',
                  color: a ? 'var(--priText)' : 'var(--ink2)' }}>
                <span aria-hidden="true" style={{ width: 40, height: 4, borderRadius: '0 0 4px 4px', background: a ? 'var(--pri)' : 'transparent', marginBottom: 6 }} />
                <Icon name={t.icon} size={24} />
                <span style={{ fontSize: 'calc(var(--u)*13)', fontWeight: a ? 800 : 600 }}>{t.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// The status region is always mounted so the message is announced when the connection drops.
function OfflineBar({ role }: { role: 'nurse' | 'family' }) {
  const online = useOnline();
  const n = useOutboxCount();
  const text = role === 'family'
    ? 'Estás viendo lo último que se guardó. Se actualizará al volver la conexión.'
    : 'Lo que anotes se guarda en el teléfono y se enviará al volver la conexión.';
  const outbox = n ? (n === 1 ? ' 1 registro pendiente de enviar.' : ` ${n} registros pendientes de enviar.`) : '';
  return (
    <div role="status" style={{ flexShrink: 0 }}>
      {!online && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 20px', background: 'var(--ink)', color: 'var(--surface)' }}>
          <Icon name="wifiOff" size={20} style={{ marginTop: 1 }} />
          <span style={{ fontSize: 'calc(var(--u)*15)', lineHeight: 1.35 }}><b>Sin conexión.</b> {text}{outbox}</span>
        </div>
      )}
    </div>
  );
}
