create table if not exists public.player_activity_sessions (
  steam_id text not null references public.players(steam_id) on delete cascade,
  source text not null default 'web' check (source in ('web', 'game')),
  display_name text,
  avatar_url text,
  path text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (steam_id, source)
);

create index if not exists idx_player_activity_sessions_last_seen
on public.player_activity_sessions (last_seen_at desc);

alter table public.player_activity_sessions enable row level security;

drop policy if exists "service role manages player activity" on public.player_activity_sessions;
create policy "service role manages player activity" on public.player_activity_sessions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop view if exists public.admin_dashboard_summary;
create view public.admin_dashboard_summary as
select
  (select count(*) from public.players) as players_count,
  (select count(*) from public.player_heroes) as heroes_count,
  (select count(*) from public.game_save_events where status = 'accepted') as accepted_saves_count,
  (select count(*) from public.audit_logs) as audit_logs_count,
  (select count(*) from public.game_content_catalog where status = 'published') as published_content_count,
  (select count(*) from public.player_activity_sessions where last_seen_at >= now() - interval '60 seconds') as active_players_count,
  (select max(last_save_at) from public.player_heroes) as latest_save_at;
