import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import './ui/ui.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './ui/feedback';
import { applyStoredScale } from './lib/textScale';

applyStoredScale();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
