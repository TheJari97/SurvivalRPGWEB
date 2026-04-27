alter table public.game_content_catalog
  drop constraint if exists game_content_catalog_content_type_check;

alter table public.game_content_catalog
  add constraint game_content_catalog_content_type_check
  check (content_type in (
    'hero', 'item', 'recipe', 'pet', 'monster', 'quest', 'zone', 'world_level',
    'ability', 'npc', 'terrain', 'map', 'system', 'artifact', 'badge', 'achievement', 'season'
  ));

insert into public.game_balance_versions(version_key, title_es, summary_es, status, published_at)
values (
  'balance_0_8_0_zonas_catalogo_meta',
  'Zonas aisladas, mascotas, artefactos e insignias',
  'Actualiza el plan a 8 zonas por teleport, agrega Q/W/E/D/R para heroes y publica mascotas, artefactos, logros e insignias visibles.',
  'published',
  now()
)
on conflict (version_key) do update set
  title_es = excluded.title_es,
  summary_es = excluded.summary_es,
  status = excluded.status,
  published_at = coalesce(public.game_balance_versions.published_at, excluded.published_at);

create table if not exists public.badge_definitions (
  badge_key text primary key,
  name_es text not null,
  summary_es text,
  category text not null default 'general',
  rarity text not null default 'common',
  image_url text,
  rule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_badge_definitions_updated_at on public.badge_definitions;
create trigger trg_badge_definitions_updated_at before update on public.badge_definitions
for each row execute function public.set_updated_at();

create table if not exists public.player_badges (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  badge_key text not null references public.badge_definitions(badge_key) on delete cascade,
  season_id text references public.seasons(season_id),
  awarded_at timestamptz not null default now(),
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_player_badges_steam
on public.player_badges (steam_id, awarded_at desc);

create unique index if not exists idx_player_badges_unique_scope
on public.player_badges (steam_id, badge_key, coalesce(season_id, 'global'));

create table if not exists public.achievement_definitions (
  achievement_key text primary key,
  name_es text not null,
  summary_es text,
  category text not null default 'general',
  points int not null default 10,
  image_url text,
  rule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_achievement_definitions_updated_at on public.achievement_definitions;
create trigger trg_achievement_definitions_updated_at before update on public.achievement_definitions
for each row execute function public.set_updated_at();

create table if not exists public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  achievement_key text not null references public.achievement_definitions(achievement_key) on delete cascade,
  season_id text references public.seasons(season_id),
  progress int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_player_achievements_steam
on public.player_achievements (steam_id, completed desc, completed_at desc);

create unique index if not exists idx_player_achievements_unique_scope
on public.player_achievements (steam_id, achievement_key, coalesce(season_id, 'global'));

alter table public.badge_definitions enable row level security;
alter table public.player_badges enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.player_achievements enable row level security;

drop policy if exists "public can read badge definitions" on public.badge_definitions;
create policy "public can read badge definitions" on public.badge_definitions
for select using (active = true);

drop policy if exists "public can read achievement definitions" on public.achievement_definitions;
create policy "public can read achievement definitions" on public.achievement_definitions
for select using (active = true);

drop policy if exists "service role manages badge definitions" on public.badge_definitions;
create policy "service role manages badge definitions" on public.badge_definitions
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role manages player badges" on public.player_badges;
create policy "service role manages player badges" on public.player_badges
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role manages achievement definitions" on public.achievement_definitions;
create policy "service role manages achievement definitions" on public.achievement_definitions
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role manages player achievements" on public.player_achievements;
create policy "service role manages player achievements" on public.player_achievements
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into public.badge_definitions(badge_key, name_es, summary_es, category, rarity, image_url, rule)
values
  ('season_001_participant', 'Temporada 001', 'Participo durante la temporada fundacional.', 'season', 'common', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_season.png', '{"season_id":"season_001","condition":"played_any_hero"}'::jsonb),
  ('founder_supporter', 'Fundador', 'Apoyo el proyecto durante la etapa inicial.', 'support', 'legendary', '/assets/survival-rpg/02_logos_and_icons/logo/survival_rpg_logo_emblem_1024.png', '{"source":"purchase_or_manual_grant"}'::jsonb),
  ('staff_owner', 'Owner', 'Cuenta con permisos de owner.', 'staff', 'legendary', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_account.png', '{"role":"owner"}'::jsonb),
  ('staff_moderator', 'Moderador', 'Ayuda a moderar comunidad y progreso.', 'staff', 'epic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_community.png', '{"role":"moderator"}'::jsonb),
  ('staff_developer', 'Desarrollador', 'Participa en desarrollo, datos o balance.', 'staff', 'epic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_guides.png', '{"role":"developer"}'::jsonb),
  ('top_world_rank', 'Top Mundo', 'Estuvo entre los mejores por avance de mundo.', 'ranking', 'rare', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_world_map.png', '{"ranking":"world","top":10}'::jsonb),
  ('top_damage_rank', 'Top Daño', 'Marco record de daño o DPS en temporada.', 'ranking', 'rare', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_bosses.png', '{"ranking":"damage","top":10}'::jsonb),
  ('zone_boss_hunter', 'Cazador de Jefes', 'Derroto jefes de zona durante la temporada.', 'combat', 'epic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_bosses.png', '{"boss_kills":1}'::jsonb)
on conflict (badge_key) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  rarity = excluded.rarity,
  image_url = excluded.image_url,
  rule = excluded.rule,
  active = true,
  updated_at = now();

insert into public.achievement_definitions(achievement_key, name_es, summary_es, category, points, image_url, rule)
values
  ('first_save', 'Primer guardado', 'Guarda progreso por primera vez.', 'progress', 10, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_account.png', '{"save_count":1}'::jsonb),
  ('first_craft', 'Primer crafteo', 'Craftea tu primer item custom.', 'crafting', 10, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_crafting.png', '{"craft_count":1}'::jsonb),
  ('pet_unlocked', 'Compañero desbloqueado', 'Completa la mision para desbloquear una mascota.', 'pet', 15, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_heroes.png', '{"pet_count":1}'::jsonb),
  ('zone_1_clear', 'Zona 1 completada', 'Derrota al jefe de la zona 1.', 'zone', 20, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_zones.png', '{"zone_unlocked":2}'::jsonb),
  ('elite_slayer', 'Rompe elites', 'Derrota elites generados en campamentos.', 'combat', 20, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_monsters.png', '{"elite_kills":10}'::jsonb),
  ('artifact_found', 'Artefacto encontrado', 'Obtiene un artefacto de heroe o mascota.', 'artifact', 15, '/assets/survival-rpg/02_logos_and_icons/navigation/nav_map.png', '{"artifact_count":1}'::jsonb)
on conflict (achievement_key) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  points = excluded.points,
  image_url = excluded.image_url,
  rule = excluded.rule,
  active = true,
  updated_at = now();

insert into public.player_badges(steam_id, badge_key, season_id, source, metadata)
values
  ('76561198988350556', 'staff_owner', null, 'seed_admin', '{"reason":"owner steamid inicial"}'::jsonb)
on conflict do nothing;

with zone_rows(content_key, name_es, summary_es, zone_index, image_url, unlock_text, boss_key) as (
  values
    ('zone_0_hub', 'Zona 0 - Refugio Inicial', 'Hub seguro con NPCs, guardado, crafteo y teleport.', 0, '/assets/survival-rpg/01_backgrounds/section_16x9/section_hub_1280x720.png', 'Disponible al iniciar.', 'none'),
    ('zone_1_forest', 'Zona 1 - Bosque Salvaje', 'Zona inicial de campamentos, elites y primer jefe.', 1, '/assets/survival-rpg/01_backgrounds/section_16x9/section_forest_1280x720.png', 'Desbloqueada desde el hub.', 'zone_boss_1'),
    ('zone_2_corrupt_forest', 'Zona 2 - Bosque Corrupto', 'Enemigos con veneno, control y elites agresivos.', 2, '/assets/survival-rpg/01_backgrounds/section_16x9/section_corrupt_forest_1280x720.png', 'Derrota al jefe de Zona 1.', 'zone_boss_2'),
    ('zone_3_crypt', 'Zona 3 - Cripta Hundida', 'No muertos, maldiciones y artefactos defensivos.', 3, '/assets/survival-rpg/01_backgrounds/section_16x9/section_crypt_1280x720.png', 'Derrota al jefe de Zona 2.', 'zone_boss_3'),
    ('zone_4_frost', 'Zona 4 - Frontera Helada', 'Ralentizaciones, resistencia magica y elites de control.', 4, '/assets/survival-rpg/01_backgrounds/section_16x9/section_frost_1280x720.png', 'Derrota al jefe de Zona 3.', 'zone_boss_4'),
    ('zone_5_igneous', 'Zona 5 - Falla Ignea', 'Dano en area, quemaduras y crafteos epicos.', 5, '/assets/survival-rpg/01_backgrounds/section_16x9/section_igneous_1280x720.png', 'Derrota al jefe de Zona 4.', 'zone_boss_5'),
    ('zone_6_forge', 'Zona 6 - Forja Antigua', 'Materiales legendarios, elites blindados y upgrades mayores.', 6, '/assets/survival-rpg/01_backgrounds/section_16x9/section_forge_1280x720.png', 'Derrota al jefe de Zona 5.', 'zone_boss_6'),
    ('zone_7_abyss', 'Zona 7 - Abismo Final', 'Zona final de temporada con jefes mayores y miticos.', 7, '/assets/survival-rpg/01_backgrounds/section_16x9/section_abyss_1280x720.png', 'Derrota al jefe de Zona 6.', 'zone_boss_7')
)
insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'zone',
  content_key,
  name_es,
  summary_es,
  'teleport_zone',
  'zone',
  1,
  10,
  null,
  null,
  jsonb_build_object(
    'zone_index', zone_index,
    'image_url', image_url,
    'unlock_type', case when zone_index = 0 then 'free' when zone_index = 1 then 'hub' else 'boss' end,
    'unlock_text', unlock_text,
    'boss_key', boss_key,
    'travel', 'teleport_menu',
    'camp_respawn_seconds', 45,
    'elite_spawn', jsonb_build_object('normal_camps_can_roll_elite', true, 'fixed_elite_points', true),
    'boss_respawn', 'once_per_season_character_unlock'
  ),
  'published',
  1
from zone_rows
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
values
  ('season', 'season_001', 'Temporada 001 - Fundacional', 'Primera temporada de pruebas, progreso base y Zona 0-1.', 'season', 'season', 1, 10, null, null, '{"season_id":"season_001","image_url":"/assets/survival-rpg/01_backgrounds/banners_21x9/banner_hub_2100x900.png","features":["Zona 0","Zona 1","guardado","crafteo inicial","mascotas base"]}'::jsonb, 'published', 1)
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

with pet_rows(content_key, name_es, summary_es, role, image_url, buffs) as (
  values
    ('wolf_guardian', 'Lobo Guardian', 'Mascota ofensiva/defensiva para heroes frontales.', 'tank', '/assets/survival-rpg/05_placeholders/placeholder_monster_unknown.png', '{"threat": [2, 18], "armor": [1, 8], "damage": [4, 42]}'::jsonb),
    ('ember_cat', 'Gato de Brasa', 'Mascota agil con critico y movilidad.', 'assassin', '/assets/survival-rpg/05_placeholders/placeholder_hero_unknown.png', '{"evasion": [1, 12], "attack_speed": [3, 35], "damage": [3, 38]}'::jsonb),
    ('roshanling', 'Roshancito', 'Mascota tanque rara con vida y resistencia.', 'tank', '/assets/survival-rpg/05_placeholders/placeholder_boss_unknown.png', '{"health": [80, 900], "resistance": [1, 16], "physical_block": [3, 40]}'::jsonb),
    ('moon_owl', 'Buho Lunar', 'Mascota de mago con mana, cooldown y control.', 'mage', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_guides.png', '{"mana": [60, 700], "cooldown_reduction": [1, 10], "control_power": [2, 26]}'::jsonb),
    ('spring_sprite', 'Espiritu de Primavera', 'Mascota healer con curacion y reduccion de amenaza.', 'healer', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_heroes.png', '{"healing_power": [6, 90], "mana_regen": [1, 9], "threat_reduction": [2, 20]}'::jsonb),
    ('banner_wisp', 'Wisp de Estandarte', 'Mascota soporte con auras de equipo.', 'support', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_community.png', '{"aura_power": [2, 30], "utility": [3, 36], "team_damage": [1, 10]}'::jsonb)
)
insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'pet',
  content_key,
  name_es,
  summary_es,
  'pet',
  role,
  1,
  10,
  1,
  5,
  jsonb_build_object(
    'image_url', image_url,
    'source', 'quest_or_drop',
    'active_limit', 1,
    'per_hero_unlock', true,
    'tier_method', 'feeding',
    'artifact_slots', jsonb_build_array('collar', 'charm', 'toy'),
    'buffs_by_tier', jsonb_build_object(
      '1', public.scale_stats(buffs, 0.70, 1.00),
      '2', public.scale_stats(buffs, 1.05, 1.35),
      '3', public.scale_stats(buffs, 1.40, 1.80),
      '4', public.scale_stats(buffs, 1.95, 2.50),
      '5', public.scale_stats(buffs, 2.80, 3.70)
    ),
    'abilities', jsonb_build_array(
      jsonb_build_object('name','Vinculo de Mascota','type','pasiva','target','self','description','Aplica el buff principal mientras esta activa.'),
      jsonb_build_object('name','Instinto de Zona','type','pasiva','target','aura','description','Mejora su rol segun el heroe que la lleva.')
    )
  ),
  'published',
  1
from pet_rows
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

with artifact_rows(content_key, name_es, summary_es, category, role, slot, image_url, stats) as (
  values
    ('hero_iron_oath', 'Juramento de Hierro', 'Artefacto de heroe para tanques.', 'hero_artifact', 'tank', 'relic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_map.png', '{"health":[120,1600],"armor":[2,22],"threat":[5,70]}'::jsonb),
    ('hero_sun_arrowhead', 'Punta de Flecha Solar', 'Artefacto para DPS de rango.', 'hero_artifact', 'ranged_dps', 'relic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_bosses.png', '{"damage":[12,180],"attack_range":[20,160],"attack_speed":[4,58]}'::jsonb),
    ('hero_arcane_seed', 'Semilla Arcana', 'Artefacto para magos.', 'hero_artifact', 'mage', 'relic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_guides.png', '{"spell_damage":[14,220],"mana":[90,1100],"cooldown_reduction":[1,14]}'::jsonb),
    ('hero_mercy_thread', 'Hebra de Misericordia', 'Artefacto healer para curas y amenaza baja.', 'hero_artifact', 'healer', 'relic', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_heroes.png', '{"healing_power":[18,260],"mana_regen":[1,12],"threat_reduction":[3,35]}'::jsonb),
    ('pet_guard_collar', 'Collar de Guardia', 'Artefacto de mascota defensiva.', 'pet_artifact', 'tank', 'collar', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_monsters.png', '{"health":[60,700],"resistance":[1,12]}'::jsonb),
    ('pet_spark_charm', 'Amuleto Chispa', 'Artefacto de mascota ofensiva.', 'pet_artifact', 'general_dps', 'charm', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_crafting.png', '{"damage":[6,90],"attack_speed":[2,24]}'::jsonb),
    ('pet_calm_toy', 'Juguete Sereno', 'Artefacto de mascota soporte.', 'pet_artifact', 'support', 'toy', '/assets/survival-rpg/02_logos_and_icons/navigation/nav_community.png', '{"utility":[3,40],"aura_power":[2,24]}'::jsonb)
)
insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'artifact',
  content_key,
  name_es,
  summary_es,
  category,
  role,
  1,
  10,
  1,
  5,
  jsonb_build_object(
    'source', 'drop_or_achievement',
    'slot', slot,
    'image_url', image_url,
    'rarity', 'rare',
    'stats_by_tier', jsonb_build_object(
      '1', public.scale_stats(stats, 0.70, 1.00),
      '2', public.scale_stats(stats, 1.05, 1.35),
      '3', public.scale_stats(stats, 1.40, 1.80),
      '4', public.scale_stats(stats, 1.95, 2.50),
      '5', public.scale_stats(stats, 2.80, 3.70)
    )
  ),
  'published',
  1
from artifact_rows
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

update public.game_content_catalog hero
set payload = jsonb_set(
  hero.payload,
  '{abilities}',
  jsonb_build_array(
    (hero.payload -> 'abilities' -> 0) || jsonb_build_object('slot','Q','max_level',5,'levels',jsonb_build_array('Efecto base Q.','Mas valor principal.','Menos cooldown.','Efecto secundario por rol.','Escalado fuerte de temporada.')),
    (hero.payload -> 'abilities' -> 1) || jsonb_build_object('slot','W','max_level',5,'levels',jsonb_build_array('Efecto base W.','Mas duracion o potencia.','Mejor consistencia.','Sinergia con equipo o mascota.','Escalado fuerte de temporada.')),
    (hero.payload -> 'abilities' -> 2) || jsonb_build_object('slot','E','max_level',5,'levels',jsonb_build_array('Efecto base E.','Mejora de zona.','Menos cooldown o mas radio.','Efecto secundario avanzado.','Escalado fuerte de temporada.')),
    jsonb_build_object('slot','D','name', case hero.role
      when 'tank' then 'Guardia de Emergencia'
      when 'ranged_dps' then 'Reposicion Tactica'
      when 'assassin' then 'Ventana Letal'
      when 'mage' then 'Reserva Arcana'
      when 'healer' then 'Salvavidas'
      when 'support' then 'Orden de Auxilio'
      else 'Tecnica de Zona' end,
      'type','activa','target', case when hero.role in ('healer','support') then 'ally' else 'self' end,
      'description','Habilidad D de utilidad avanzada para reaccionar ante elites, jefes o errores de posicion.',
      'max_level',5,
      'levels',jsonb_build_array('Desbloquea utilidad D.','Mejora duracion.','Reduce cooldown.','Agrega efecto secundario.','Escalado fuerte de mundo alto.')
    ),
    jsonb_build_object('slot','R','name', case hero.role
      when 'tank' then 'Ultimo Bastion'
      when 'ranged_dps' then 'Tormenta de Proyectiles'
      when 'assassin' then 'Ejecucion Umbria'
      when 'mage' then 'Ruptura Arcana'
      when 'healer' then 'Milagro Vital'
      when 'support' then 'Estandarte Supremo'
      else 'Ruptura de Jefe' end,
      'type','activa','target', case when hero.role in ('ranged_dps','mage','support') then 'aoe' when hero.role = 'healer' then 'ally' else 'single' end,
      'description','Ultimate R pensada para jefes de zona, elites fuertes y momentos de alta presion.',
      'max_level',5,
      'levels',jsonb_build_array('Desbloquea ultimate R.','Aumenta valor principal.','Reduce cooldown.','Agrega mejora de jefe.','Nivel maximo con gran escalado.')
    )
  ),
  true
),
updated_at = now()
where hero.content_type = 'hero'
  and jsonb_array_length(coalesce(hero.payload -> 'abilities', '[]'::jsonb)) >= 3;

delete from public.game_content_catalog
where content_type = 'ability';

insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'ability',
  hero.content_key || '_' || lower(regexp_replace(coalesce(ability.value ->> 'slot','x') || '_' || (ability.value ->> 'name'), '[^a-zA-Z0-9]+', '_', 'g')),
  coalesce(ability.value ->> 'slot','?') || ' - ' || (ability.value ->> 'name'),
  ability.value ->> 'description',
  'hero_ability',
  hero.role,
  1,
  10,
  null,
  null,
  jsonb_build_object(
    'hero_key', hero.content_key,
    'hero_name', hero.name_es,
    'slot', ability.value ->> 'slot',
    'type', ability.value ->> 'type',
    'target', ability.value ->> 'target',
    'max_level', coalesce((ability.value ->> 'max_level')::int, 5),
    'levels', ability.value -> 'levels',
    'source', 'hero'
  ),
  'published',
  1
from public.game_content_catalog hero
cross join lateral jsonb_array_elements(hero.payload -> 'abilities') ability
where hero.content_type = 'hero';

insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'badge',
  badge_key,
  name_es,
  summary_es,
  category,
  'account',
  1,
  10,
  null,
  null,
  jsonb_build_object('source','achievement_or_role','image_url',image_url,'rarity',rarity,'rule',rule),
  'published',
  1
from public.badge_definitions
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

insert into public.game_content_catalog(content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version)
select
  'achievement',
  achievement_key,
  name_es,
  summary_es,
  category,
  'account',
  1,
  10,
  null,
  null,
  jsonb_build_object('source','achievement_system','image_url',image_url,'points',points,'rule',rule),
  'published',
  1
from public.achievement_definitions
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

insert into public.game_balance_change_logs(version_key, content_type, content_key, change_type, title_es, detail_es, after_value)
values
  ('balance_0_8_0_zonas_catalogo_meta', 'hero', 'qwedr_abilities', 'reworked', 'Heroes con Q/W/E/D/R', 'Cada heroe publicado muestra cinco habilidades: Q, W, E, D y R.', '{"slots":["Q","W","E","D","R"]}'::jsonb),
  ('balance_0_8_0_zonas_catalogo_meta', 'zone', 'zones_0_7_teleport', 'reworked', 'Zonas aisladas por teleport', 'El plan cambia a Zona 0-7 con acceso por menu de teleport y desbloqueo por jefes.', '{"zones":8,"travel":"teleport_menu"}'::jsonb),
  ('balance_0_8_0_zonas_catalogo_meta', 'pet', 'pets_catalog', 'added', 'Mascotas visibles', 'El catalogo publica mascotas con buffs por tier y artefactos de mascota.', '{"pets":6}'::jsonb),
  ('balance_0_8_0_zonas_catalogo_meta', 'artifact', 'artifact_catalog', 'added', 'Artefactos visibles', 'El catalogo publica artefactos de heroes y mascotas con tiers.', '{"artifacts":7}'::jsonb),
  ('balance_0_8_0_zonas_catalogo_meta', 'achievement', 'badges_achievements', 'added', 'Insignias y logros', 'Se agregan definiciones de insignias y logros enlazables a jugadores por SteamID.', '{"badges":8,"achievements":6}'::jsonb)
on conflict do nothing;
