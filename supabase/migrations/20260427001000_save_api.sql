create table if not exists public.game_save_events (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null,
  player_hero_id uuid references public.player_heroes(id) on delete set null,
  season_id text not null,
  hero_name text not null,
  addon_version text,
  match_id text,
  source text not null default 'dota',
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'error')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_save_events_steam on public.game_save_events (steam_id, created_at desc);
create index if not exists idx_game_save_events_hero on public.game_save_events (player_hero_id, created_at desc);
create index if not exists idx_game_save_events_status on public.game_save_events (status, created_at desc);

alter table public.game_save_events enable row level security;

drop policy if exists "service role manages game save events" on public.game_save_events;
create policy "service role manages game save events" on public.game_save_events
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop view if exists public.admin_dashboard_summary;
create view public.admin_dashboard_summary as
select
  (select count(*) from public.players) as players_count,
  (select count(*) from public.player_heroes) as heroes_count,
  (select count(*) from public.game_save_events where status = 'accepted') as accepted_saves_count,
  (select count(*) from public.audit_logs) as audit_logs_count,
  (select max(last_save_at) from public.player_heroes) as latest_save_at;
