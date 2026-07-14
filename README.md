# Vela Web

**Home nursing-care app for the web.** Two people share one patient: the **nurse** records vitals, medication, notes and the shift handoff — and the **family** sees it all appear **live**, and can message the nurse.

Built with **React + TypeScript + Vite** on **Supabase** (Postgres + Auth + Realtime + Row-Level Security). Spanish-language UI. Runs with one command via Docker.

> There's a companion **React Native / Expo mobile app** on the same backend: [vela](https://github.com/angelarroyod/vela). Same accounts, same data, realtime across both.

---

## Screens

| Nurse | Family |
|---|---|
| **Inicio del turno** — patient card, upcoming tasks, tonight's timeline | **Estado** — reassurance hero + latest vitals |
| **Signos vitales** — record BP / HR / temp / SpO₂, flag an anomaly | **Actividad** — live feed of everything the nurse logs |
| **Medicación** — dose list, tap to mark administered | **Mensajes** — live chat with the nurse |
| **Relevo de turno** — shift timeline + handoff to the day team | **Perfil** — conditions, allergies, care team, emergency contacts |

Access is patient-scoped: a user only ever sees patients they're a member of. That's enforced by **Postgres RLS**, not by the client.

---

## Quick start (Docker)

You need **Docker** and a **Supabase project** (free tier is fine).

**1. Create the database**

Create a project at [supabase.com](https://supabase.com), then in its **SQL Editor** run, in order:

```
supabase/migrations/0001_schema.sql   # tables + profile trigger
supabase/migrations/0002_rls.sql      # row-level security, helpers, RPCs
```

Both are idempotent — safe to re-run.

**2. Configure**

```bash
cp .env.example .env
```

Fill it from **Supabase → Project Settings → API**:

```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> The anon key is **public by design** — it ships in every browser bundle. RLS is the security boundary, not key secrecy. Never put the **service-role** key here.

**3. Run**

```bash
docker compose up --build
```

→ **http://localhost:8080**

> ⚠️ Vite inlines `VITE_*` at **build** time, so the config is baked into the image. If you change `.env`, re-run with `--build`.

**4. Use it**

Sign up → choose **Soy enfermera/o** → create a patient. Then in the nurse's sidebar you can generate a **family invite code**; sign up a second account, choose **Soy familiar**, and redeem the code. Now record a vital as the nurse and watch it appear on the family screen instantly.

> For local testing, turn **off** email confirmation in Supabase → Authentication → Sign In / Providers → Email, so signup returns a session immediately.

---

## Run without Docker

```bash
npm install
cp .env.example .env    # fill in as above
npm run dev             # http://localhost:5173
```

## Quality gates

```bash
npm test            # vitest
npm run typecheck   # tsc -b
npm run build       # tsc -b && vite build → dist/
```

---

## Architecture

```
src/
  lib/supabase.ts     # client + hhmm() + mutate() (surfaces write errors)
  theme.css           # design tokens as CSS custom properties
  auth/               # AuthProvider, useAuth, useMembership, Welcome/Login/Signup/Onboarding
  care/               # useLiveList (realtime) + per-resource hooks + row→view mappers
  shell/              # AppShell, Sidebar, Topbar
  views/nurse|family/ # the 8 role views
  components/Icon.tsx
supabase/migrations/  # schema + RLS (run these in your Supabase project)
```

**One realtime primitive.** Everything live flows through a single hook:

```ts
useLiveList(table, patientId, order, map)  // initial fetch + postgres_changes subscription
```

Per-resource hooks (`useVitals`, `useMedications`, `useCareEvents`, `useMessages`, `useTimeline`) are one-liners over it. Writes are plain `supabase.from(...).insert/update` wrapped in `mutate()` so a failed save raises an error instead of silently vanishing.

**Role comes from the database.** `useMembership()` reads the user's row in `care_memberships` → `{ role, patient_id }`. That decides which sidebar and which views render. There's no client-side role switch.

**Security model.** Every table has RLS. Members of a patient can read; only `role = 'nurse'` members can write clinical rows. Two `SECURITY DEFINER` RPCs bootstrap access without leaking anything: `create_patient_with_nurse` (a new nurse creates their patient) and `redeem_invite` (a family member joins by code, before they're a member of anything).

---

## Deploy

The build output is a **static SPA** (`dist/`), so anything that serves files works:

- **Docker / any VPS** — `docker compose up --build` (nginx, included).
- **Vercel / Netlify / Cloudflare Pages** — build `npm run build`, publish `dist/`, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as build env vars.

## License

MIT — see [LICENSE](LICENSE).
