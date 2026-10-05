import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  // needsConfirm: the project asks for email confirmation, so no session yet.
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
