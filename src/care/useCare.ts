import { createContext, useContext } from 'react';
import type { Membership } from '../auth/useMembership';
import type { Me, Patient, TeamMember } from './data';
import type { ToastFn } from '../ui/toast';

// Nurse: inicio, signos, meds, relevo, perfil. Family: inicio, actividad, mensajes, perfil. Shared: ajustes, privacidad.
export type ScreenId = 'inicio' | 'signos' | 'meds' | 'relevo' | 'perfil' | 'actividad' | 'mensajes' | 'ajustes' | 'privacidad';

export type Care = {
  role: 'nurse' | 'family'; // a 'doctor' membership is treated as family
  patientId: string;
  membership: Membership;
  patient: Patient | null; // null while loading
  me: Me;
  team: TeamMember[]; // everyone on the care team, me included ([] if unknown)
  nameOf: (profileId: string | null | undefined) => string; // first name, or '' when unknown → use neutral words
  screen: ScreenId;
  go: (screen: ScreenId) => void;
  toast: ToastFn;
};

export const CareContext = createContext<Care | null>(null);

export function useCare(): Care {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare must be used within CareProvider');
  return ctx;
}
