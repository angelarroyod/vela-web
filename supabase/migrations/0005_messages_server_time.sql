-- Messages carry the server's time, never the client's. Apply after 0004_hardening.sql. Idempotent.
-- The unread badge compares created_at; a client-chosen future date would otherwise freeze it for everyone,
-- and read_at isn't for the sender to set.
create or replace function public.messages_server_time() returns trigger
  language plpgsql set search_path = public as $$
begin
  new.created_at := now();
  new.read_at := null;
  return new;
end; $$;

drop trigger if exists messages_server_time on public.messages;
create trigger messages_server_time before insert on public.messages
  for each row execute function public.messages_server_time();
