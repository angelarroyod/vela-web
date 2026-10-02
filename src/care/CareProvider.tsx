import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Membership } from '../auth/useMembership';
import { CareContext } from './useCare';
import type { ScreenId } from './useCare';
import { useCareTeam, useMe, usePatient, refetchLive } from './hooks';
import { firstName } from './logic';
import { flushOutbox } from '../lib/offline';
import { useToast } from '../ui/toast';

export function CareProvider({ membership, children }: { membership: Membership; children: ReactNode }) {
  const patientId = membership.patient_id;
  const patient = usePatient(patientId);
  const me = useMe();
  const team = useCareTeam(patientId);
  const [screen, go] = useState<ScreenId>('inicio');
  const toast = useToast();

  // Send what was saved offline: now (if online) and whenever the connection comes back.
  useEffect(() => {
    const flush = () => flushOutbox().then((n) => {
      if (!n) return;
      refetchLive();
      toast(n === 1 ? 'Conexión recuperada. Se envió 1 registro.' : `Conexión recuperada. Se enviaron ${n} registros.`);
    });
    if (navigator.onLine) flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [toast]);

  const nameOf = (id: string | null | undefined) =>
    id ? firstName(team.find((t) => t.profileId === id)?.fullName || (id === me.id ? me.fullName : '')) : '';

  return (
    <CareContext.Provider value={{
      role: membership.role === 'nurse' ? 'nurse' : 'family', patientId, membership, patient, me, team, nameOf, screen, go, toast,
    }}>
      {children}
    </CareContext.Provider>
  );
}
