import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './auth/useAuth';
import { useMembership } from './auth/useMembership';
import { AuthFlow } from './auth/AuthFlow';
import Onboarding from './auth/Onboarding';
import { AppShell } from './shell/AppShell';
import NInicio from './views/nurse/Inicio';
import NSignos from './views/nurse/Signos';
import NMeds from './views/nurse/Medicacion';
import NRelevo from './views/nurse/Relevo';
import FEstado from './views/family/Estado';
import FActividad from './views/family/Actividad';
import FMensajes from './views/family/Mensajes';
import FPerfil from './views/family/Perfil';

export default function App() {
  const { session, loading } = useAuth();
  const { membership, loading: mLoading } = useMembership();
  const [screen, setScreen] = useState('inicio');

  if (loading || (session && mLoading)) return null;
  if (!session) return <AuthFlow />;
  if (!membership) return <Onboarding />;

  const role: 'nurse' | 'family' = membership.role === 'nurse' ? 'nurse' : 'family';
  const nurseViews: Record<string, ReactNode> = {
    inicio: <NInicio setScreen={setScreen} />,
    signos: <NSignos setScreen={setScreen} />,
    meds: <NMeds />,
    relevo: <NRelevo setScreen={setScreen} />,
  };
  const familyViews: Record<string, ReactNode> = {
    inicio: <FEstado setScreen={setScreen} />,
    actividad: <FActividad />,
    mensajes: <FMensajes />,
    perfil: <FPerfil />,
  };
  const views = role === 'nurse' ? nurseViews : familyViews;
  const view = views[screen] ?? views.inicio;

  return (
    <AppShell role={role} screen={screen} setScreen={setScreen}>
      {view}
    </AppShell>
  );
}
