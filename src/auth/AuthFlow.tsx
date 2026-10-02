import { useEffect, useState } from 'react';
import Welcome from './Welcome';
import Login from './Login';
import Signup from './Signup';
import Privacidad from '../views/settings/Privacidad';

export type AuthMode = 'welcome' | 'login' | 'signup' | 'privacidad';

export function AuthFlow() {
  const [mode, setMode] = useState<AuthMode>('welcome');

  // Like the app shell: a new screen moves focus to its h1 (which also scrolls it into view). On mount too, so
  // signing out never leaves focus on a button that is gone.
  // The first h1 in the document is the visible one: the hidden signup form comes after the policy.
  useEffect(() => {
    const h = document.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }, [mode]);

  const go = (m: AuthMode) => () => setMode(m);
  return (
    <main>
      {mode === 'login' ? <Login goSignup={go('signup')} goWelcome={go('welcome')} />
        : mode === 'welcome' ? <Welcome goSignup={go('signup')} goLogin={go('login')} />
        : (
          // The signup form stays mounted under the policy so what was typed survives the round trip.
          <>
            {mode === 'privacidad' && <Privacidad onBack={go('signup')} />}
            <div hidden={mode === 'privacidad'}>
              <Signup goLogin={go('login')} goWelcome={go('welcome')} goPrivacy={go('privacidad')} />
            </div>
          </>
        )}
    </main>
  );
}
