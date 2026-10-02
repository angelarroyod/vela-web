import { useCare } from '../../care/useCare';
import { Alert, EmptyState } from '../../ui/feedback';
import { Avatar, Card, ListRow, Screen } from '../../ui/layout';
import { shiftLabel } from '../../care/logic';

const fs = (n: number) => `calc(var(--u)*${n})`;
const ROLE = { nurse: 'Enfermería', family: 'Familia', doctor: 'Medicina' } as const;

// The patient's profile, seen by the family. Conditions/allergies are display-only (set in the Supabase dashboard).
export default function Perfil() {
  const { patient, team, me, go } = useCare();
  const name = patient?.fullName || 'Paciente';
  const facts = [patient?.age != null && `${patient.age} años`, 'en casa', patient?.status.toLowerCase()].filter(Boolean).join(' · ');

  return (
    <Screen gap={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar text={name.charAt(0).toUpperCase()} size={60} radius={20} display fontSize={28} />
        <div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: fs(24) }}>{name}</h1>
          <p style={{ margin: '2px 0 0', fontSize: fs(15), color: 'var(--ink2)' }}>{facts}</p>
        </div>
      </div>

      {!!patient?.allergies.length && <Alert tone="danger">Alergias: {patient.allergies.join(', ')}</Alert>}

      {patient?.conditions.length ? (
        <Card as="section" aria-labelledby="cond-h">
          <h2 id="cond-h" style={{ margin: 0, fontSize: fs(17), fontWeight: 700 }}>Condiciones</h2>
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: fs(16), lineHeight: 1.4 }}>
            {patient.conditions.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Card>
      ) : <EmptyState>Aún no hay condiciones anotadas.</EmptyState>}

      {team.length > 0 && (
        <Card as="section" aria-labelledby="team-h" gap={6}>
          <h2 id="team-h" style={{ margin: '0 0 4px', fontSize: fs(17), fontWeight: 700 }}>Equipo de cuidado</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {team.map((t) => (
              <li key={t.profileId} style={{ padding: '8px 0' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: fs(16) }}>{t.fullName || ROLE[t.role]}{t.profileId === me.id && ' (tú)'}</p>
                <p style={{ margin: '2px 0 0', fontSize: fs(14), color: 'var(--ink2)' }}>{[ROLE[t.role], shiftLabel(t.shift).toLowerCase()].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <a href="tel:112" className="press"
        style={{ width: '100%', minHeight: 56, padding: '14px 20px', borderRadius: 'var(--rb)', background: 'var(--danger)', color: '#fff', fontWeight: 700, fontSize: fs(17),
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
        Emergencia: llamar al 112
      </a>
      <ListRow title="Configuración y tamaño de texto" onClick={() => go('ajustes')} />
    </Screen>
  );
}
