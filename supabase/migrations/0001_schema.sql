-- Vela schema (M2). Apply via Supabase SQL Editor or `supabase db push`.

-- Profiles mirror auth.users (1:1).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age int,
  room text,
  status text not null default 'Estable',
  dob date,
  notes text,
  created_at timestamptz not null default now()
);

create type care_role as enum ('nurse', 'family', 'doctor');

create table public.care_memberships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role care_role not null,
  relationship text,
  is_primary boolean not null default false,
  shift text,
  created_at timestamptz not null default now(),
  unique (patient_id, profile_id)
);

create table public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid references public.profiles(id),
  bp_sys int, bp_dia int, hr int, temp_c numeric(4,1), spo2 int,
  taken_at timestamptz not null default now(),
  note text,
  has_anomaly boolean not null default false
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null, dose text, reason text,
  scheduled_at timestamptz,
  status text not null default 'pending',
  administered_by uuid references public.profiles(id),
  administered_at timestamptz
);

create table public.care_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_id uuid references public.profiles(id),
  type text not null,
  title text, body text,
  severity text not null default 'info',
  occurred_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.shift_handoffs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nurse_id uuid references public.profiles(id),
  summary text, recommendation text,
  started_at timestamptz, ended_at timestamptz
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  email text,
  role care_role not null default 'family',
  code text not null unique,
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table public.push_tokens (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (profile_id, token)
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create index on public.care_memberships (profile_id);
create index on public.care_memberships (patient_id);
create index on public.care_events (patient_id, occurred_at desc);
create index on public.messages (patient_id, created_at);
