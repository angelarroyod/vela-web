# Lazo (vela-web)

> *Quien cuida y quien quiere, siempre unidos.*

**Home nursing-care app for the web.** Two people share one patient: the **nurse** records vitals, medication, events notes and the shift handoff — and the **family** sees it all appear **live**, and can message the nurse.

Built with **React + TypeScript + Vite** on **Supabase** (Postgres + Auth + Realtime + Row-Level Security). Spanish-language UI. Runs with one command via Docker.

**Accessible by design** (Lazo design system): Atkinson Hyperlegible type, an in-app text size setting from 100 to 200%, WCAG AA contrast, status never shown by color alone, plain-language vitals with the clinical term in brackets, and screen-reader live regions for chat and toasts. It also handles edge states: offline (writes queue and sync on reconnect), failed saves (data kept, "Reintentar"), fever alerts, first-shift empty states, and undo on every write. Phone-first layout with a bottom tab bar; on desktop a sidebar takes its place.

> *Lazo* was formerly *Vela*; the repos keep their original names.

> There's a companion **React Native / Expo mobile app** on the same backend: [vela](https://github.com/angelarroyod/vela). Same accounts, same data, realtime across both.

---

## Screens

| Nurse | Family |
|---|---|
| **Inicio**: "Lo siguiente" (the one next step: fever → notify the doctor, first vitals, next dose, handoff), patient card, shift rows | **Estado**: plain-language status, "Lo que debes saber", latest vitals with Normal/Revisar words |
| **Signos**: each value checked against its normal range as you type, fever alert, "Avisar a la familia" | **Actividad**: live feed with a "Para saber" filter |
| **Medicación**: today's doses, "Marcar como dada" with undo | **Mensajes**: live chat with quick replies |
| **Relevo**: structured handoff (resumen → a vigilar → tareas → timeline) | **Perfil**: allergies, conditions, care team, 112 |
| **Perfil**: family invite code (share or copy) | **Ajustes**: text size, privacy, delete account |

Access is patient-scoped: a user only ever sees patients they're a member of. That's enforced by **Postgres RLS**, not by the client.

---

## Quick start (Docker)

You need **Docker** and a **Supabase project** (free tier is fine).

**1. Create the database**

Create a project at [supabase.com](https://supabase.com), then in its **SQL Editor** run, in order:

```
supabase/migrations/0001_schema.sql   # tables + profile trigger
supabase/migrations/0002_rls.sql      # row-level security, helpers, RPCs
supabase/migrations/0003_lazo.sql     # conditions/allergies, undo policies, care_team(), realtime publication
supabase/migrations/0004_hardening.sql # security-advisor fixes: search_path, no RPCs for signed-out users
```

All four are idempotent, so they're safe to re-run. Without `0003`, realtime updates won't fire on a fresh project.

Optional, for **Eliminar mi cuenta**: `supabase functions deploy delete-account`.

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

Sign up → choose **Soy enfermera o enfermero** → create a patient. Then under the nurse's **Perfil** you'll find the **family invite code**; sign up a second account, choose **Soy familiar**, and redeem the code. Now record a vital as the nurse and watch it appear on the family screen instantly.

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
  lib/                # supabase client, offline outbox, text scale
  theme.css           # Lazo tokens as CSS custom properties (--u = text scale)
  ui/                 # design-system primitives (Button, TextField, VitalField, Sheet, Toast…)
  auth/               # AuthProvider, useMembership, Welcome/Login/Signup/Onboarding
  care/               # useLiveList (realtime), hooks, CareProvider, logic.ts (pure, tested)
  shell/              # AppShell: tab bar (phone) / sidebar (desktop), offline bar
  views/nurse|family|settings/
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
