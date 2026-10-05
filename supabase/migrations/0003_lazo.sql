-- Lazo redesign (web). Apply after 0002_rls.sql.
-- Idempotent: safe to re-run.

-- Patient profile: display-only lists (set them in the Supabase dashboard for now).
alter table public.patients add column if not exists conditions text[] not null default '{}';
alter table public.patients add column if not exists allergies text[] not null default '{}';

-- Undo: an author can delete their own rows. The app checks the deleted row count,
-- so a missing policy shows "No se pudo deshacer." instead of failing silently.
drop policy if exists vitals_undo on public.vitals;
create policy vitals_undo on public.vitals
  for delete using (recorded_by = auth.uid() and public.is_nurse(patient_id));
drop policy if exists events_undo on public.care_events;
create policy events_undo on public.care_events
  for delete using (author_id = auth.uid() and public.is_nurse(patient_id));
drop policy if exists handoff_undo on public.shift_handoffs;
create policy handoff_undo on public.shift_handoffs
  for delete using (nurse_id = auth.uid() and public.is_nurse(patient_id));

-- Names and roles of the patient's care team (profiles RLS only exposes your own row).
create or replace function public.care_team(p_patient uuid)
  returns table (profile_id uuid, full_name text, role care_role, shift text)
  language sql security definer stable set search_path = public as $$
  select m.profile_id, p.full_name, m.role, m.shift
  from public.care_memberships m
  join public.profiles p on p.id = m.profile_id
  where m.patient_id = p_patient and public.is_member(p_patient)
  order by m.created_at;
$$;

revoke execute on function public.care_team(uuid) from public, anon;
grant execute on function public.care_team(uuid) to authenticated;

-- Account deletion (functions/delete-account) deletes the auth user, which cascades to profiles. With the 0001
-- defaults any row a user wrote blocked that. Care records stay for the team without their author; the user's
-- own messages go ("Se borrarán tu cuenta y tus mensajes").
alter table public.vitals drop constraint if exists vitals_recorded_by_fkey,
  add constraint vitals_recorded_by_fkey foreign key (recorded_by) references public.profiles(id) on delete set null;
alter table public.medications drop constraint if exists medications_administered_by_fkey,
  add constraint medications_administered_by_fkey foreign key (administered_by) references public.profiles(id) on delete set null;
alter table public.care_events drop constraint if exists care_events_author_id_fkey,
  add constraint care_events_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.shift_handoffs drop constraint if exists shift_handoffs_nurse_id_fkey,
  add constraint shift_handoffs_nurse_id_fkey foreign key (nurse_id) references public.profiles(id) on delete set null;
alter table public.invites drop constraint if exists invites_invited_by_fkey,
  add constraint invites_invited_by_fkey foreign key (invited_by) references public.profiles(id) on delete set null;
alter table public.messages drop constraint if exists messages_sender_id_fkey,
  add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade;

-- Realtime: postgres_changes never fires for tables outside this publication.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['vitals', 'medications', 'care_events', 'messages', 'shift_handoffs'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Hardening (Supabase linter: function_search_path_mutable): pin the RLS helpers' search_path.
alter function public.is_member(uuid) set search_path = public;
alter function public.is_nurse(uuid) set search_path = public;
