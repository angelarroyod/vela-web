# Lazo redesign — implementation plan (vela-web)

**Source design:** Claude Design handoff, `Vela Rediseño.dc.html`, extracted at
`C:\Users\angel\Claude\Projects\inc-app-redesign\app-ui-ux-redesign\project\`.
Call that folder `DESIGN/` below.

- `DESIGN/Vela Rediseño.dc.html`: the target. Lines 1–357 are the markup for every screen. Lines 371–697 are the state machine (copy, ranges, logic). **Read the parts for your screens in full.** The markup uses `{{ binding }}`, `<sc-if value=…>` and `<sc-for list=… as=…>`. These are template constructs; translate them to JSX.
- `DESIGN/readme.md`: the Lazo Design System rules (copy tone, sizes, a11y).
- `DESIGN/components/**.jsx` + `*.prompt.md`: reference implementations of the primitives (VitalField, Sheet, Toast, TabBar…).
- `DESIGN/tokens/*.css`: the tokens.
- Ignore `support.js`, `_dev_loader.js`, the `<aside>` "Guía del prototipo" panel, "SIMULAR ESTADOS" buttons, Tweaks (identity themes Refinada/Evolucionada), and the fake phone status bar and frame. Those belong to the prototype canvas, not the product.

## Decisions (already made, don't revisit)

1. **Target is vela-web only** (web is the priority). The Expo mobile repo is not touched.
2. **Brand is "Lazo"** in all UI copy, the `<title>`, the favicon and the logo. Repo and package names stay `vela-web`. The README gets a rebrand note (done in the final step, not by screen agents).
3. **Only the Lazo theme** (`THEMES.Lazo` from the dc script). No Refinada/Evolucionada switcher.
4. **Responsive layout.** Below 900px the screens match the 390px design: single column, 20px side padding (24px on forms), and a fixed bottom tab bar. At 900px and above, a 260px left sidebar replaces the tab bar and content sits in a centered column (max-width 680px, 32px padding). Auth screens use a centered column with max-width 440px.
5. **Real data, honest copy.** Everything comes from Supabase. The design's sample names (Carmen, Elena, Lucía, Rosa, Dr. Méndez) are **never hardcoded**. Use real names from `useCare()` (patient, me, team). When a name is unknown, use neutral wording: "la enfermera", "el siguiente turno", "el médico". Sample medical data (allergies, conditions, contacts) is **never hardcoded**: render it only when the data exists, otherwise show the empty state.
6. **Skipped (YAGNI):** "Continuar con Apple" on web (no Apple Services ID; the spec already excluded SiwA), the prototype simulators, per-contact phone numbers (no phone column; "Llamar" exists only for the 112 emergency, via `tel:112`), and editing conditions/allergies (display only; set them in the Supabase dashboard for now).
7. **Text size** setting is 100–200% in steps of 10. It is persisted in `localStorage['lazo.textScale']` and applied as CSS var `--u` on `<html>` (`--u: 1px` at 100%). **Every font-size uses `calc(var(--u)*N)`** exactly like the design. Spacing and widths stay in px.
8. **Edge states are real:**
   - **Offline:** a `navigator.onLine` banner. Nurse writes (vitals, med given) go to a localStorage outbox when offline and flush on the `online` event, with a toast like "Conexión recuperada. Se enviaron N registros."
   - **Failed save:** a Supabase error on save keeps the form and shows the design's failed-save block with "Reintentar".
   - **First shift:** no vitals yet means "Lo siguiente" says "Registrar los primeros signos vitales" and lists show their empty states.
   - **Unlinked family:** handled by onboarding. No membership routes to the role step.
   - **Fever:** latest vitals with `temp_c > 37.5` and no `doctor_notified` care_event after it. Then the nurse home hero turns danger with the CTA "Ya avisé al médico", which inserts `care_events {type:'doctor_notified', title:'Avisó al médico', severity:'warning'}`. The family sees it in plain words.
9. **Undo** (toast, 7s) for: med given (update back to `pending`), vitals saved (delete the inserted vitals row and its care_event), and turno entregado (delete the shift_handoffs row). Deletes need migration 0003. Always `.delete().eq('id', id).select('id')` and treat 0 rows as failure ("No se pudo deshacer.") so a missing policy never fails silently.

## Backend: `supabase/migrations/0003_lazo.sql` (idempotent)

- `alter table patients add column if not exists conditions text[] not null default '{}'`, plus `allergies` the same way.
- Delete policies, author-only (create with `drop policy if exists` then `create policy`):
  - `vitals_undo`: `for delete using (recorded_by = auth.uid() and is_nurse(patient_id))`
  - `events_undo`: `for delete using (author_id = auth.uid() and is_nurse(patient_id))`
  - `handoff_undo`: `for delete using (nurse_id = auth.uid() and is_nurse(patient_id))`
- `care_team(p_patient uuid) returns table(profile_id uuid, full_name text, role care_role, shift text)`: `security definer`, `stable`, `set search_path = public`. Returns rows only when `is_member(p_patient)`. Then `grant execute … to authenticated`.
- Add `vitals, medications, care_events, messages, shift_handoffs` to the `supabase_realtime` publication when they're not already in it (a DO block that checks `pg_publication_tables`). Without this, realtime never fires on a fresh project.
- Copy `../vela/supabase/functions/delete-account/` into `supabase/functions/delete-account/` so the web repo stays self-contained.

## Architecture (Foundation builds this; screen agents consume it)

```
index.html                 lang="es", <title>Lazo</title>, fonts: Atkinson Hyperlegible Next 400;700 + Bricolage Grotesque (opsz,wght 12..96,800)
public/favicon.svg         Lazo app icon (mint tile + bow + coral knot), no metadata
src/theme.css              Lazo tokens (exact THEMES.Lazo values), --u, base, :focus-visible, keyframes lazoDraw/Pop/Tie/Rise, reduced-motion, .sr-only, .press (hover brightness / active scale .98)
src/main.tsx               applies stored text scale before first render
src/lib/supabase.ts        (exists) client, hhmm, mutate
src/lib/textScale.ts       useTextScale(): [scale, setScale]; applyStoredScale()
src/lib/offline.ts         useOnline(); writeOrQueue(table,row) → {queued}|{error}|{id}; flushOutbox(); useOutboxCount()
src/care/logic.ts          VITALS defs + checkVital + fmtDec ("36,7") + isFever + nextStep + greeting + dayLabel + handoff summary builders (pure, tested)
src/care/CareProvider.tsx  <CareProvider> + useCare(): { role, patientId, patient, me, team, go(screen), screen, toast(text, undo?) }
src/care/hooks.ts          useVitals (numeric rows), useMedications, useCareEvents, useTimeline, useMessages, useHandoffs, usePatient, useCareTeam
src/ui/*.tsx               primitives (see below)
src/shell/AppShell.tsx     responsive shell: OfflineBar + Sidebar (≥900) | TabBar (<900) + <main> with h1 focus on screen change + ToastHost + Sheet portal
src/App.tsx                session → AuthFlow | Onboarding | CareProvider+AppShell+view
```

**Screen ids.** Nurse: `inicio, signos, meds, relevo, perfil`. Family: `inicio, actividad, mensajes, perfil`. Shared: `ajustes, privacidad`. Nurse tabs: Inicio, Signos, Relevo, Perfil (`meds` highlights Inicio). Family tabs: Estado, Actividad, Mensajes, Perfil. `ajustes` back target is the role's `perfil`. `privacidad` back target is `ajustes`, or, inside AuthFlow, signup.

**ui primitives** (props match the design's markup; all font sizes use `calc(var(--u)*N)`):
`Logo` (animated welcome mark + wordmark; `LogoMark` small tile), `Button` (variant primary|outline|danger|dangerOutline|white, full-width 56px pill), `BackButton`, `TextField` (visible label, hint, error with role=alert, aria-describedby), `PasswordField` (show/hide), `CheckboxRow`, `RadioCard`, `SwitchRow`, `VitalField`, `Alert` (tone danger|warn|info, icon + text), `ProgressBar` (role=progressbar), `StepProgress` ("Paso n de 3" + segments), `ScreenHeader` (h1 + sub), `Card`, `ListRow`, `Avatar` (initials), `Chip`, `SectionLabel`, `EmptyState`, `Sheet` (dialog, aria-modal, focus trap-lite, Esc closes, scrim), `ToastHost` and `useToast` via CareProvider (role=status aria-live=polite, optional "Deshacer", 7s), `OfflineBar`, `TabBar`, `Sidebar`.

## Screen agents (parallel after Foundation)

- **Auth:** Welcome, Login (labels, show/hide, inline errors, "¿Olvidaste tu contraseña?" → `supabase.auth.resetPasswordForEmail`), Signup (Paso 1 de 3 + consent CheckboxRow + privacy link), Onboarding (role = Paso 2, patient = Paso 3 → `create_patient_with_nurse`, code → `redeem_invite`), Ajustes (text size, account email, privacy, sign out, delete account → Sheet → `supabase.functions.invoke('delete-account')`), Privacidad.
- **Nurse:** Inicio, Signos, Medicacion, Relevo, Perfil (invite code: reuse the latest unexpired `invites` row or insert a new 6-char A-Z0-9 code; "Compartir código" uses `navigator.share` when available, else clipboard).
- **Family:** Estado, Actividad, Mensajes, Perfil (paciente).

Each screen agent edits only its own files plus its own test file. Contracts in `src/ui`, `src/care`, `src/lib` are owned by Foundation. If one is missing something, add it in the smallest backwards-compatible way and mention it in the report.

## Gates

`npm test`, `npm run typecheck` (`tsc -b`), `npm run lint` (oxlint), `npm run build`. All green before commit.

## Addendum (2026-10-05): nurse chat

The live two-account test showed that family messages never reached the nurse: neither the design nor the mobile app gave the nurse a chat. Added:
- **One shared `src/views/Mensajes.tsx` for both roles.** It is one thread per patient. The nurse's header names the family members, and the nurse gets neutral quick replies ("Todo tranquilo por aquí.", "Ahora lo reviso.", "Te aviso si hay cambios.").
- **A 5th nurse tab** (Inicio, Signos, Relevo, Mensajes, Perfil).
- **An unread badge on the Mensajes tab for both roles.** It is a number, so it isn't color-only, and screen readers hear "Mensajes, N mensajes sin leer". "Seen" is stored per device in localStorage (`lazo.seen.<patient>.<user>`), not as read receipts; `messages.read_at` would need an update policy.
