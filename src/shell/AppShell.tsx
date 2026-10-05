import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { useCare } from '../care/useCare';
import type { ScreenId } from '../care/useCare';
import { useUnread } from '../care/useUnread';
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
  { id: 'mensajes', label: 'Mensajes', icon: 'chat' },
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
  const unread = useUnread();
  const mainRef = useRef<HTMLElement>(null);
  const shown = useRef(screen);

  // Layout effect: runs before the new screen's own effects, so a screen may scroll itself (the chat goes to the bottom).
  useLayoutEffect(() => {
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
              <TabIcon icon={t.icon} count={t.id === 'mensajes' ? unread : 0} />{t.label}<Unread count={t.id === 'mensajes' ? unread : 0} />
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
                style={{ flex: 1, minWidth: 0, minHeight: 64, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 0 4px',
                  color: a ? 'var(--priText)' : 'var(--ink2)' }}>
                <span aria-hidden="true" style={{ width: 40, height: 4, borderRadius: '0 0 4px 4px', background: a ? 'var(--pri)' : 'transparent', marginBottom: 6 }} />
                <TabIcon icon={t.icon} count={t.id === 'mensajes' ? unread : 0} />
                {/* At 200 % five labels don't fit one line on a phone: let a long word break (hyphenated, lang=es) rather than overflow. */}
                <span style={{ fontSize: 'calc(var(--u)*13)', fontWeight: a ? 800 : 600, maxWidth: '100%', overflowWrap: 'anywhere', hyphens: 'auto', textAlign: 'center', lineHeight: 1.15 }}>{t.label}<Unread count={t.id === 'mensajes' ? unread : 0} /></span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// Icon with a count bubble (the number, not just a dot, so it isn't color-only). Screen readers get <Unread>.
// ponytail: fixed 12px like Avatar initials, scaled text would overflow the bubble at 200%.
function TabIcon({ icon, count }: { icon: IconName; count: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Icon name={icon} size={24} />
      {count > 0 && (
        <span aria-hidden="true" style={{ position: 'absolute', top: -6, right: -10, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 99,
          background: 'var(--danger)', color: '#fff', border: '2px solid var(--surface)', fontSize: 12, fontWeight: 800, lineHeight: '16px', textAlign: 'center' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  );
}

const Unread = ({ count }: { count: number }) =>
  count > 0 ? <span className="sr-only">{count === 1 ? ', 1 mensaje sin leer' : `, ${count} mensajes sin leer`}</span> : null;

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
