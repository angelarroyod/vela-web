-- Vela row-level security + helpers (M2). Apply after 0001_schema.sql.
-- Idempotent: safe to re-run.

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.care_memberships enable row level security;
alter table public.vitals enable row level security;
alter table public.medications enable row level security;
alter table public.care_events enable row level security;
alter table public.messages enable row level security;
alter table public.shift_handoffs enable row level security;
alter table public.invites enable row level security;
alter table public.push_tokens enable row level security;

-- Membership/role helpers (SECURITY DEFINER to avoid recursive RLS on care_memberships).
create or replace function public.is_member(p_patient uuid) returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.care_memberships m
    where m.patient_id = p_patient and m.profile_id = auth.uid()
  );
$$;

create or replace function public.is_nurse(p_patient uuid) returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.care_memberships m
    where m.patient_id = p_patient and m.profile_id = auth.uid() and m.role = 'nurse'
  );
$$;

-- profiles: own row.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- patients: readable by members; a nurse member can update.
drop policy if exists patients_read on public.patients;
create policy patients_read on public.patients
  for select using (public.is_member(id));
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients
  for update using (public.is_nurse(id)) with check (public.is_nurse(id));

-- care_memberships: a user sees their own memberships.
drop policy if exists memberships_self on public.care_memberships;
create policy memberships_self on public.care_memberships
  for select using (profile_id = auth.uid());

-- Read for any member; write for nurse members. Applied to clinical tables.
drop policy if exists vitals_read on public.vitals;
create policy vitals_read on public.vitals for select using (public.is_member(patient_id));
drop policy if exists vitals_write on public.vitals;
create policy vitals_write on public.vitals for insert with check (public.is_nurse(patient_id));
drop policy if exists meds_read on public.medications;
create policy meds_read on public.medications for select using (public.is_member(patient_id));
drop policy if exists meds_write on public.medications;
create policy meds_write on public.medications for all using (public.is_nurse(patient_id)) with check (public.is_nurse(patient_id));
drop policy if exists events_read on public.care_events;
create policy events_read on public.care_events for select using (public.is_member(patient_id));
drop policy if exists events_write on public.care_events;
create policy events_write on public.care_events for insert with check (public.is_nurse(patient_id));
drop policy if exists handoff_read on public.shift_handoffs;
create policy handoff_read on public.shift_handoffs for select using (public.is_member(patient_id));
drop policy if exists handoff_write on public.shift_handoffs;
create policy handoff_write on public.shift_handoffs for insert with check (public.is_nurse(patient_id));

-- messages: any member reads; sender must be self and a member.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select using (public.is_member(patient_id));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert with check (sender_id = auth.uid() and public.is_member(patient_id));

-- invites: members read; a nurse member inserts.
drop policy if exists invites_read on public.invites;
create policy invites_read on public.invites for select using (public.is_member(patient_id));
drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites for insert with check (public.is_nurse(patient_id));

-- push_tokens: own rows.
drop policy if exists push_self on public.push_tokens;
create policy push_self on public.push_tokens for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Redeem an invite as the current user without prior membership (SECURITY DEFINER).
create or replace function public.redeem_invite(p_code text) returns uuid language plpgsql security definer as $$
declare inv public.invites; begin
  select * into inv from public.invites where code = p_code and accepted_at is null and expires_at > now();
  if inv.id is null then raise exception 'invalid_or_expired_invite'; end if;
  insert into public.care_memberships (patient_id, profile_id, role, relationship)
  values (inv.patient_id, auth.uid(), inv.role, 'family')
  on conflict (patient_id, profile_id) do nothing;
  update public.invites set accepted_at = now() where id = inv.id;
  return inv.patient_id;
end; $$;

-- Let an authenticated user create their first patient + nurse membership atomically.
create or replace function public.create_patient_with_nurse(p_name text, p_age int, p_room text)
  returns uuid language plpgsql security definer as $$
declare new_id uuid; begin
  insert into public.patients (full_name, age, room) values (p_name, p_age, p_room) returning id into new_id;
  insert into public.care_memberships (patient_id, profile_id, role, is_primary, shift)
  values (new_id, auth.uid(), 'nurse', true, 'night');
  return new_id;
end; $$;

grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.create_patient_with_nurse(text, int, text) to authenticated;
