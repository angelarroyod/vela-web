import type { ComponentType } from 'react';
import { useAuth } from './auth/useAuth';
import { useMembership } from './auth/useMembership';
import { AuthFlow } from './auth/AuthFlow';
import Onboarding from './auth/Onboarding';
import { CareProvider } from './care/CareProvider';
import { useCare } from './care/useCare';
import type { ScreenId } from './care/useCare';
import { AppShell } from './shell/AppShell';
import { ToastHost } from './ui/feedback';
import NInicio from './views/nurse/Inicio';
import NSignos from './views/nurse/Signos';
import NMeds from './views/nurse/Medicacion';
import NRelevo from './views/nurse/Relevo';
import NPerfil from './views/nurse/Perfil';
import FEstado from './views/family/Estado';
import FActividad from './views/family/Actividad';
import FMensajes from './views/family/Mensajes';
import FPerfil from './views/family/Perfil';
import Ajustes from './views/settings/Ajustes';
import Privacidad from './views/settings/Privacidad';

type Views = Partial<Record<ScreenId, ComponentType>> & { inicio: ComponentType };
const NURSE: Views = { inicio: NInicio, signos: NSignos, meds: NMeds, relevo: NRelevo, perfil: NPerfil };
const FAMILY: Views = { inicio: FEstado, actividad: FActividad, mensajes: FMensajes, perfil: FPerfil };

function CurrentView() {
  const { role, screen, go } = useCare();
  if (screen === 'ajustes') return <Ajustes />;
  if (screen === 'privacidad') return <Privacidad onBack={() => go('ajustes')} />;
  const views = role === 'nurse' ? NURSE : FAMILY;
  const View = views[screen] ?? views.inicio;
  return <View />;
}

export default function App() {
  const { session, loading } = useAuth();
  const { membership, loading: mLoading } = useMembership();

  if (loading || (session && mLoading)) return null;
  if (!session) return <><AuthFlow /><ToastHost /></>;
  if (!membership) return <><Onboarding /><ToastHost /></>;

  return (
    <CareProvider membership={membership}>
      <AppShell>
        <CurrentView />
      </AppShell>
    </CareProvider>
  );
}
