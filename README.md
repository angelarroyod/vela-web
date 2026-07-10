# Vela Web

Desktop web version of **Vela** (home nursing-care app) — Vite + React + TypeScript on the **same live Supabase backend** as the mobile app. A nurse who signed up on mobile logs in here and sees the same patient, live.

Sidebar shell + role-scoped views: nurse (Inicio, Signos vitales, Medicación, Relevo) and family (Estado, Actividad, Mensajes, Perfil). Live reads/writes + realtime (family ⇄ nurse), email/password auth + onboarding.

## Run

```bash
npm install
cp .env.example .env   # then set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (same values as the mobile app)
npm run dev            # http://localhost:5173
```

## Quality gates

```bash
npm test            # vitest (9 tests)
npm run typecheck   # tsc -b
npm run build       # tsc -b && vite build → dist/
```

## Layout

```
src/
  lib/supabase.ts     # client + hhmm + mutate helpers
  theme.css           # CSS variables (Salvia palette) + base
  auth/               # AuthProvider, useAuth, useMembership, Welcome/Login/Signup/Onboarding, AuthFlow
  care/               # useLiveList (realtime) + hooks + mappers (ported from mobile)
  shell/              # AppShell, Sidebar, Topbar
  views/nurse|family/ # the 8 role views
  components/Icon.tsx
```

## Notes
- **Same Supabase project** as the mobile app (shared tables/RLS/RPCs). No backend here.
- Role comes from `care_memberships`; the sidebar sign-out replaces the design's role toggle.
- Skipped for v1 (YAGNI): Sign in with Apple (mobile-only), URL routing, the dynamic palette generator (ships default Salvia).
- Design + plan: `../vela/docs/superpowers/{specs,plans}/2026-07-03-vela-web*`.
