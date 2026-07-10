import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({ role, screen, setScreen, children }: { role: 'nurse' | 'family'; screen: string; setScreen: (id: string) => void; children: ReactNode }) {
  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '252px 1fr', background: 'var(--page)' }}>
      <Sidebar role={role} screen={screen} setScreen={setScreen} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 40px 44px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
