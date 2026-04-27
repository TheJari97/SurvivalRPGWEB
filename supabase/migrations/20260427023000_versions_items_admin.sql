create table if not exists public.game_balance_versions (
  version_key text primary key,
  title_es text not null,
  summary_es text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.game_balance_change_logs (
  id uuid primary key default gen_random_uuid(),
  version_key text not null references public.game_balance_versions(version_key) on delete cascade,
  content_type text not null,
  content_key text not null,
  change_type text not null check (change_type in ('added', 'buffed', 'nerfed', 'reworked', 'fixed', 'removed')),
  title_es text not null,
  detail_es text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_balance_change_logs_version
on public.game_balance_change_logs (version_key, content_type, created_at desc);

create unique index if not exists idx_game_balance_change_logs_unique_seed
on public.game_balance_change_logs (version_key, content_type, content_key, change_type, title_es);

alter table public.game_balance_versions enable row level security;
alter table public.game_balance_change_logs enable row level security;

drop policy if exists "public can read published balance versions" on public.game_balance_versions;
create policy "public can read published balance versions" on public.game_balance_versions
for select using (status = 'published');

drop policy if exists "service role manages balance versions" on public.game_balance_versions;
create policy "service role manages balance versions" on public.game_balance_versions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "public can read published balance change logs" on public.game_balance_change_logs;
create policy "public can read published balance change logs" on public.game_balance_change_logs
for select using (
  exists (
    select 1
    from public.game_balance_versions v
    where v.version_key = game_balance_change_logs.version_key
      and v.status = 'published'
  )
);

drop policy if exists "service role manages balance change logs" on public.game_balance_change_logs;
create policy "service role manages balance change logs" on public.game_balance_change_logs
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace view public.public_balance_change_log as
select
  v.version_key,
  v.title_es as version_title_es,
  v.summary_es as version_summary_es,
  v.published_at,
  l.content_type,
  l.content_key,
  l.change_type,
  l.title_es,
  l.detail_es,
  l.before_value,
  l.after_value,
  l.created_at
from public.game_balance_versions v
join public.game_balance_change_logs l on l.version_key = v.version_key
where v.status = 'published'
order by v.published_at desc nulls last, l.created_at desc;

grant select on public.public_balance_change_log to anon, authenticated;

insert into public.game_balance_versions(version_key, title_es, summary_es, status, published_at)
values (
  'balance_0_6_0_pre',
  'Balance 0.6.0-pre',
  'Primera version publica de catalogo base con heroes, items iniciales, recetas y estructura de cambios visibles.',
  'published',
  now()
)
on conflict (version_key) do update set
  title_es = excluded.title_es,
  summary_es = excluded.summary_es,
  status = excluded.status,
  published_at = coalesce(public.game_balance_versions.published_at, excluded.published_at);

insert into public.game_content_catalog(
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
  status,
  version
)
values
  ('item', 'iron_heart_plate', 'Placa Corazon de Hierro', 'Pieza defensiva para tanques que aumenta vida, armadura y amenaza.', 'rare', 'tank', 1, 10, 1, 5, '{"source":"craft","slot":"chest","stats_by_tier":{"1":{"health":[120,180],"armor":[3,5],"threat":[4,7]},"2":{"health":[220,320],"armor":[6,9],"threat":[8,12]},"3":{"health":[380,520],"armor":[10,14],"threat":[13,18]},"4":{"health":[620,860],"armor":[15,21],"threat":[19,26]},"5":{"health":[980,1350],"armor":[22,30],"threat":[27,36]}},"materials":["iron_bark","wild_core","zone_1_essence"],"uses":["bulwark_oath"]}'::jsonb, 'published', 1),
  ('item', 'dawnstring_bow', 'Arco Cuerda del Alba', 'Arma de DPS rango enfocada en rango, velocidad y critico.', 'rare', 'ranged_dps', 1, 10, 1, 5, '{"source":"craft","slot":"weapon","stats_by_tier":{"1":{"damage":[18,28],"attack_speed":[8,13],"attack_range":[45,70]},"2":{"damage":[35,52],"attack_speed":[14,20],"attack_range":[80,115]},"3":{"damage":[58,84],"attack_speed":[22,30],"attack_range":[125,170]},"4":{"damage":[92,132],"attack_speed":[32,43],"attack_range":[180,240]},"5":{"damage":[145,205],"attack_speed":[45,60],"attack_range":[250,330]}},"materials":["sunthread","sharp_branch","zone_1_essence"],"uses":["hawk_eye_relic"]}'::jsonb, 'published', 1),
  ('item', 'vital_weaver_charm', 'Amuleto Tejedor Vital', 'Amuleto healer con curacion, mana y reduccion de amenaza.', 'rare', 'healer', 1, 10, 1, 5, '{"source":"craft","slot":"trinket","stats_by_tier":{"1":{"healing_power":[18,30],"mana_regen":[1,2],"threat_reduction":[3,6]},"2":{"healing_power":[35,54],"mana_regen":[2,3],"threat_reduction":[7,10]},"3":{"healing_power":[62,88],"mana_regen":[4,5],"threat_reduction":[11,15]},"4":{"healing_power":[96,135],"mana_regen":[6,8],"threat_reduction":[16,22]},"5":{"healing_power":[150,220],"mana_regen":[9,12],"threat_reduction":[23,32]}},"materials":["living_leaf","clear_sap","zone_1_essence"],"uses":["sanctuary_lantern"]}'::jsonb, 'published', 1),
  ('item', 'umbra_step_boots', 'Botas Paso Umbrio', 'Botas para asesinos con evasion, movilidad y dano explosivo.', 'epic', 'assassin', 1, 10, 1, 5, '{"source":"craft","slot":"boots","stats_by_tier":{"1":{"damage":[14,24],"evasion":[3,5],"movement_speed":[12,18]},"2":{"damage":[28,42],"evasion":[6,9],"movement_speed":[20,28]},"3":{"damage":[48,70],"evasion":[10,14],"movement_speed":[32,44]},"4":{"damage":[78,112],"evasion":[15,20],"movement_speed":[48,64]},"5":{"damage":[125,180],"evasion":[22,30],"movement_speed":[70,92]}},"materials":["shadow_cloth","wolf_claw","zone_1_essence"],"uses":["nightfall_contract"]}'::jsonb, 'published', 1),
  ('item', 'clear_arcane_focus', 'Foco Arcano Claro', 'Catalizador magico para magos con dano de hechizo, mana y control.', 'epic', 'mage', 1, 10, 1, 5, '{"source":"craft","slot":"weapon","stats_by_tier":{"1":{"spell_damage":[22,34],"mana":[90,140],"control_power":[3,5]},"2":{"spell_damage":[44,66],"mana":[170,250],"control_power":[6,9]},"3":{"spell_damage":[76,110],"mana":[290,420],"control_power":[10,14]},"4":{"spell_damage":[125,178],"mana":[470,660],"control_power":[15,21]},"5":{"spell_damage":[200,285],"mana":[740,1050],"control_power":[22,31]}},"materials":["arcane_dust","clear_sap","zone_1_essence"],"uses":["stormbound_focus"]}'::jsonb, 'published', 1),
  ('item', 'bannerbearer_crest', 'Cresta del Estandarte', 'Soporte utilitario con auras, resistencia y seguridad de equipo.', 'rare', 'support', 1, 10, 1, 5, '{"source":"craft","slot":"trinket","stats_by_tier":{"1":{"aura_power":[3,6],"resistance":[2,4],"utility":[4,7]},"2":{"aura_power":[7,11],"resistance":[5,8],"utility":[8,12]},"3":{"aura_power":[12,17],"resistance":[9,13],"utility":[14,19]},"4":{"aura_power":[19,26],"resistance":[14,19],"utility":[21,28]},"5":{"aura_power":[29,40],"resistance":[21,29],"utility":[31,43]}},"materials":["banner_scrap","living_leaf","zone_1_essence"],"uses":["warband_standard"]}'::jsonb, 'published', 1),
  ('item', 'hunter_training_blade', 'Hoja de Entrenamiento del Cazador', 'Item comprable de mundo 1 para dano basico fijo. No se craftea.', 'common', 'general_dps', 1, 1, 1, 1, '{"source":"shop","slot":"weapon","fixed_stats":{"damage":18,"attack_speed":5},"price_gold":120,"not_craftable":true}'::jsonb, 'published', 1),
  ('item', 'apprentice_guard_vest', 'Chaleco Guardia Aprendiz', 'Item comprable de mundo 1 para supervivencia fija. No se craftea.', 'common', 'general_survival', 1, 1, 1, 1, '{"source":"shop","slot":"chest","fixed_stats":{"health":150,"armor":2},"price_gold":140,"not_craftable":true}'::jsonb, 'published', 1),
  ('item', 'wild_core', 'Nucleo Salvaje', 'Recurso comun de Zona 1 usado en crafteos iniciales.', 'common', 'resource', 1, 2, null, null, '{"source":"drop","drop_roles":["normal","elite","boss"],"drop_notes":"Base para recetas de mundo 1."}'::jsonb, 'published', 1),
  ('item', 'zone_1_essence', 'Esencia de Zona 1', 'Recurso clave para convertir materiales iniciales en equipo crafteado.', 'rare', 'resource', 1, 2, null, null, '{"source":"drop","drop_roles":["elite","boss"],"drop_notes":"Mayor probabilidad en elites y jefe de zona."}'::jsonb, 'published', 1),
  ('recipe', 'recipe_iron_heart_plate', 'Receta: Placa Corazon de Hierro', 'Crafteo tank inicial con resultado variable de tier 1 a 5.', 'rare', 'tank', 1, 10, 1, 5, '{"creates":"iron_heart_plate","materials":[{"key":"iron_bark","qty":6},{"key":"wild_core","qty":3},{"key":"zone_1_essence","qty":1}],"tier_roll":{"1":55,"2":28,"3":12,"4":4,"5":1},"npc":"npc_sirv_crafting_master"}'::jsonb, 'published', 1),
  ('recipe', 'recipe_dawnstring_bow', 'Receta: Arco Cuerda del Alba', 'Crafteo DPS rango inicial con resultado variable de tier 1 a 5.', 'rare', 'ranged_dps', 1, 10, 1, 5, '{"creates":"dawnstring_bow","materials":[{"key":"sunthread","qty":5},{"key":"sharp_branch","qty":4},{"key":"zone_1_essence","qty":1}],"tier_roll":{"1":55,"2":28,"3":12,"4":4,"5":1},"npc":"npc_sirv_crafting_master"}'::jsonb, 'published', 1),
  ('recipe', 'recipe_vital_weaver_charm', 'Receta: Amuleto Tejedor Vital', 'Crafteo healer inicial con resultado variable de tier 1 a 5.', 'rare', 'healer', 1, 10, 1, 5, '{"creates":"vital_weaver_charm","materials":[{"key":"living_leaf","qty":5},{"key":"clear_sap","qty":4},{"key":"zone_1_essence","qty":1}],"tier_roll":{"1":55,"2":28,"3":12,"4":4,"5":1},"npc":"npc_sirv_crafting_master"}'::jsonb, 'published', 1)
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  world_min = excluded.world_min,
  world_max = excluded.world_max,
  tier_min = excluded.tier_min,
  tier_max = excluded.tier_max,
  payload = excluded.payload,
  status = excluded.status;

insert into public.game_balance_change_logs(
  version_key,
  content_type,
  content_key,
  change_type,
  title_es,
  detail_es,
  after_value
)
values
  ('balance_0_6_0_pre', 'system', 'steam_profile', 'added', 'Login Steam publico', 'Los jugadores pueden iniciar sesion con Steam y ver personajes asociados a su SteamID.', '{"web":true}'::jsonb),
  ('balance_0_6_0_pre', 'system', 'content_catalog', 'added', 'Catalogo versionado', 'Heroes, items y recetas empiezan a publicarse desde Supabase con versionado visible.', '{"catalog":"public_content_catalog"}'::jsonb),
  ('balance_0_6_0_pre', 'item', 'iron_heart_plate', 'added', 'Nuevo item tank', 'Se agrego Placa Corazon de Hierro como crafteo defensivo inicial.', '{"tier_min":1,"tier_max":5}'::jsonb),
  ('balance_0_6_0_pre', 'item', 'dawnstring_bow', 'added', 'Nuevo item DPS rango', 'Se agrego Arco Cuerda del Alba como crafteo de rango y velocidad.', '{"tier_min":1,"tier_max":5}'::jsonb),
  ('balance_0_6_0_pre', 'item', 'vital_weaver_charm', 'added', 'Nuevo item healer', 'Se agrego Amuleto Tejedor Vital con curacion y reduccion de amenaza.', '{"tier_min":1,"tier_max":5}'::jsonb)
on conflict do nothing;
