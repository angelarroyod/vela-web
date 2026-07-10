import { useState } from 'react';
import Welcome from './Welcome';
import Login from './Login';
import Signup from './Signup';

export function AuthFlow() {
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [role, setRole] = useState<'nurse' | 'family' | undefined>(undefined);

  if (mode === 'login') return <Login goSignup={() => setMode('signup')} />;
  if (mode === 'signup') return <Signup role={role} goLogin={() => setMode('login')} />;
  return <Welcome goSignup={(r) => { setRole(r); setMode('signup'); }} goLogin={() => setMode('login')} />;
}
