-- پرس (Pirs) — schema for auth-backed quizzes + live rooms
-- Run once in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  time_limit int not null default 20 check (time_limit between 5 and 120),
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_owner_idx on public.quizzes (owner_id, created_at desc);

create table if not exists public.rooms (
  pin text primary key,
  host_id uuid references auth.users (id) on delete set null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.rooms enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "quizzes read own" on public.quizzes;
create policy "quizzes read own" on public.quizzes
  for select using (auth.uid() = owner_id);

drop policy if exists "quizzes insert own" on public.quizzes;
create policy "quizzes insert own" on public.quizzes
  for insert with check (auth.uid() = owner_id);

drop policy if exists "quizzes update own" on public.quizzes;
create policy "quizzes update own" on public.quizzes
  for update using (auth.uid() = owner_id);

drop policy if exists "quizzes delete own" on public.quizzes;
create policy "quizzes delete own" on public.quizzes
  for delete using (auth.uid() = owner_id);

-- Rooms are joinable by PIN (anon + auth) for live play
drop policy if exists "rooms read all" on public.rooms;
create policy "rooms read all" on public.rooms
  for select using (true);

drop policy if exists "rooms insert all" on public.rooms;
create policy "rooms insert all" on public.rooms
  for insert with check (true);

drop policy if exists "rooms update all" on public.rooms;
create policy "rooms update all" on public.rooms
  for update using (true);

drop policy if exists "rooms delete host" on public.rooms;
create policy "rooms delete host" on public.rooms
  for delete using (auth.uid() = host_id or host_id is null);

-- Realtime for live multiplayer
alter publication supabase_realtime add table public.rooms;
