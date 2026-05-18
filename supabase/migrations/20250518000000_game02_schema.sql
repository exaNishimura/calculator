-- GAME 02 命の配分 — Phase 2 schema
-- Apply via Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  session_set integer not null default 1 check (session_set between 1 and 6),
  active_event_id text,
  active_event_set_number integer check (active_event_set_number between 1 and 6),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  team_code text not null unique,
  current_set integer not null default 1 check (current_set between 1 and 6),
  current_asset integer not null check (current_asset >= 0),
  total_debt integer not null default 0 check (total_debt >= 0),
  net_asset integer not null,
  status text not null check (
    status in (
      'not_started',
      'investing',
      'investment_submitted',
      'waiting_event',
      'completed_set',
      'finished'
    )
  ),
  pending_investments jsonb,
  investment_submitted_at timestamptz,
  borrowed_in_current_set boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.set_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  set_number integer not null check (set_number between 1 and 6),
  starting_asset integer not null check (starting_asset >= 0),
  investments jsonb not null default '[]'::jsonb,
  selected_event text not null,
  result_asset integer not null check (result_asset >= 0),
  borrowed_amount integer not null default 0 check (borrowed_amount >= 0),
  debt_added integer not null default 0 check (debt_added >= 0),
  completed_at timestamptz not null default now(),
  unique (team_id, set_number)
);

create index if not exists teams_team_code_idx on public.teams (team_code);
create index if not exists set_results_team_id_set_number_idx
  on public.set_results (team_id, set_number);

-- Realtime (Supabase Dashboard: Database → Replication で有効化する場合も可)
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.set_results;

-- MVP: クライアントゲート前提の緩い RLS（本番はチーム単位ポリシーへ強化）
alter table public.game_sessions enable row level security;
alter table public.teams enable row level security;
alter table public.set_results enable row level security;

create policy "game_sessions_anon_all"
  on public.game_sessions for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "teams_anon_all"
  on public.teams for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "set_results_anon_all"
  on public.set_results for all
  to anon, authenticated
  using (true)
  with check (true);
