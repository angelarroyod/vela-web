-- Hardening from the Supabase security advisor. Apply after 0003_lazo.sql.
-- Idempotent: safe to re-run.

-- Pin search_path on every SECURITY DEFINER function (lint 0011).
alter function public.handle_new_user() set search_path = public;
alter function public.redeem_invite(text) set search_path = public;
alter function public.create_patient_with_nurse(text, int, text) set search_path = public;

-- Signed-out callers get nothing (lint 0028). Signed-in users keep the RPCs the app calls;
-- is_member/is_nurse stay callable because RLS policies evaluate them as the querying role.
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.is_nurse(uuid) from public, anon;
revoke execute on function public.redeem_invite(text) from public, anon;
revoke execute on function public.create_patient_with_nurse(text, int, text) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_nurse(uuid) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.create_patient_with_nurse(text, int, text) to authenticated;

-- Trigger-only: never an RPC (the auth.users trigger fires it without EXECUTE checks).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
