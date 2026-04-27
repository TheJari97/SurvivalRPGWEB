create table if not exists public.game_content_catalog (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('hero', 'item', 'recipe', 'pet', 'monster', 'quest', 'zone', 'world_level', 'system')),
  content_key text not null,
  name_es text not null,
  summary_es text,
  category text,
  role text,
  world_min int not null default 1 check (world_min between 1 and 10),
  world_max int not null default 10 check (world_max between 1 and 10),
  tier_min int check (tier_min between 1 and 5),
  tier_max int check (tier_max between 1 and 5),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_key, version)
);

create index if not exists idx_game_content_catalog_lookup
on public.game_content_catalog (content_type, status, world_min, version desc);

drop trigger if exists trg_game_content_catalog_updated_at on public.game_content_catalog;
create trigger trg_game_content_catalog_updated_at before update on public.game_content_catalog
for each row execute function public.set_updated_at();

alter table public.game_content_catalog enable row level security;

drop policy if exists "public can read published game content" on public.game_content_catalog;
create policy "public can read published game content" on public.game_content_catalog
for select using (status = 'published');

drop policy if exists "service role manages game content" on public.game_content_catalog;
create policy "service role manages game content" on public.game_content_catalog
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace view public.public_content_catalog as
select
  content_type,
  content_key,
  name_es,
  summary_es,
  category,
  role,
  world_min,
  world_max,
  tier_min,
  tier_max,
  payload,
  version,
  updated_at
from public.game_content_catalog
where status = 'published'
order by content_type, world_min, category, name_es;

grant select on public.public_content_catalog to anon, authenticated;

drop view if exists public.admin_dashboard_summary;
create view public.admin_dashboard_summary as
select
  (select count(*) from public.players) as players_count,
  (select count(*) from public.player_heroes) as heroes_count,
  (select count(*) from public.game_save_events where status = 'accepted') as accepted_saves_count,
  (select count(*) from public.audit_logs) as audit_logs_count,
  (select count(*) from public.game_content_catalog where status = 'published') as published_content_count,
  (select max(last_save_at) from public.player_heroes) as latest_save_at;

insert into public.game_content_catalog(
  content_type,
  content_key,
  name_es,
  summary_es,
  category,
  role,
  payload,
  status,
  version
)
values
  ('hero', 'guardian_de_hierro', 'Guardian de Hierro', 'Controla amenaza, aguanta golpes y abre espacio para el equipo.', 'Tanque', 'tank', '{"tags":["vida","armadura","aggro"],"primary_stats":["health","armor","threat"]}'::jsonb, 'published', 1),
  ('hero', 'vigilante_del_alba', 'Vigilante del Alba', 'Escala con rango, velocidad de ataque y posicionamiento.', 'DPS rango', 'ranged_dps', '{"tags":["rango","velocidad","critico"],"primary_stats":["attack_range","attack_speed","critical"]}'::jsonb, 'published', 1),
  ('hero', 'tejedor_vital', 'Tejedor Vital', 'Sostiene al equipo con curacion, mana y reduccion de amenaza.', 'Healer', 'healer', '{"tags":["curacion","mana","soporte"],"primary_stats":["healing","mana_regen","threat_reduction"]}'::jsonb, 'published', 1),
  ('hero', 'corte_umbrio', 'Corte Umbrio', 'Busca ventanas de dano, movilidad y evasion.', 'Assassin', 'assassin', '{"tags":["evasion","burst","movilidad"],"primary_stats":["damage","evasion","movement_speed"]}'::jsonb, 'published', 1),
  ('hero', 'arcanista_del_claro', 'Arcanista del Claro', 'Usa dano magico, control y escalado de atributo principal.', 'Mago', 'mage', '{"tags":["magia","mana","control"],"primary_stats":["spell_damage","mana","control"]}'::jsonb, 'published', 1),
  ('hero', 'portador_de_estandarte', 'Portador de Estandarte', 'Aporta utilidad, buffs futuros y seguridad para el equipo.', 'Soporte', 'support', '{"tags":["aura","utilidad","resistencia"],"primary_stats":["aura_power","utility","resistance"]}'::jsonb, 'published', 1)
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status;
