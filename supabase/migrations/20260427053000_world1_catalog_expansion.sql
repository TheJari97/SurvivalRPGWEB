alter table public.game_content_catalog
  drop constraint if exists game_content_catalog_content_type_check;

alter table public.game_content_catalog
  add constraint game_content_catalog_content_type_check
  check (content_type in (
    'hero',
    'ability',
    'item',
    'recipe',
    'pet',
    'monster',
    'quest',
    'zone',
    'world_level',
    'system'
  ));

insert into public.admin_role_permissions(role, permission)
values
  ('developer', 'players.read'),
  ('developer', 'progress.read'),
  ('developer', 'balance.read'),
  ('developer', 'items.read'),
  ('developer', 'monsters.read'),
  ('developer', 'audit.read')
on conflict (role, permission) do nothing;

drop view if exists public.admin_staff_profiles;
create view public.admin_staff_profiles as
with staff_roles as (
  select
    pr.*,
    case pr.role
      when 'owner' then 5
      when 'admin' then 4
      when 'moderator' then 3
      when 'developer' then 2
      when 'support' then 1
      else 0
    end as role_rank
  from public.player_roles pr
  where pr.role in ('owner', 'admin', 'moderator', 'developer', 'support')
)
select
  sr.steam_id as id,
  sr.steam_id,
  p.display_name,
  p.avatar_url,
  p.country,
  case max(sr.role_rank)
    when 5 then 'owner'
    when 4 then 'admin'
    when 3 then 'moderator'
    when 2 then 'developer'
    when 1 then 'support'
    else 'support'
  end as role,
  array_agg(distinct sr.role order by sr.role) as roles,
  bool_or(sr.active) as active,
  max(sr.role_rank) as role_rank,
  coalesce(
    array_agg(distinct arp.permission order by arp.permission) filter (where arp.permission is not null),
    array[]::text[]
  ) as permissions,
  min(sr.created_at) as created_at,
  max(sr.updated_at) as updated_at
from staff_roles sr
join public.players p on p.steam_id = sr.steam_id
left join public.admin_role_permissions arp on arp.role = sr.role
group by sr.steam_id, p.display_name, p.avatar_url, p.country;

grant select on public.admin_staff_profiles to authenticated;

insert into public.game_balance_versions(version_key, title_es, summary_es, status, published_at)
values (
  'balance_0_7_0_catalogo_w1',
  'Balance 0.7.0 - Catalogo Mundo 1',
  'Expansion inicial con 15 heroes, habilidades, recursos, drops, tienda fija y crafteos por rol para Zona 0 y Zona 1.',
  'published',
  now()
)
on conflict (version_key) do update set
  title_es = excluded.title_es,
  summary_es = excluded.summary_es,
  status = excluded.status,
  published_at = coalesce(public.game_balance_versions.published_at, excluded.published_at);

with hero_rows(content_key, name_es, summary_es, category, role, image_url, tags, abilities) as (
  values
    ('guardian_de_hierro', 'Guardian de Hierro', 'Tanque frontal de amenaza, armadura y control de zona.', 'Fuerza', 'tank', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png', array['tanque','amenaza','armadura'], '[{"name":"Golpe Provocador","type":"activa","target":"single","description":"Golpea y aumenta amenaza."},{"name":"Piel de Hierro","type":"pasiva","target":"self","description":"Aumenta armadura por vida perdida."},{"name":"Muro de Guardia","type":"activa","target":"aoe","description":"Reduce dano recibido por aliados cercanos."}]'::jsonb),
    ('rompeescudos', 'Rompeescudos', 'Tanque agresivo que rompe armadura y sostiene elites.', 'Fuerza', 'tank', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/centaur.png', array['tanque','debuff','elite'], '[{"name":"Aplastamiento","type":"activa","target":"aoe","description":"Dano fisico y reduccion de armadura."},{"name":"Placas Reforzadas","type":"pasiva","target":"self","description":"Gana bloqueo contra golpes repetidos."},{"name":"Carga de Bastion","type":"activa","target":"line","description":"Avanza y empuja enemigos."}]'::jsonb),
    ('berserker_salvaje', 'Berserker Salvaje', 'DPS melee de fuerza que escala con vida y velocidad.', 'Fuerza', 'general_dps', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/troll_warlord.png', array['dps','melee','velocidad'], '[{"name":"Furia Salvaje","type":"activa","target":"self","description":"Aumenta velocidad de ataque temporalmente."},{"name":"Sangre Caliente","type":"pasiva","target":"self","description":"Gana dano cuando baja su vida."},{"name":"Corte Brutal","type":"activa","target":"single","description":"Golpe fuerte contra objetivo marcado."}]'::jsonb),
    ('vigilante_del_alba', 'Vigilante del Alba', 'DPS de rango que escala con alcance y critico.', 'Agilidad', 'ranged_dps', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/drow_ranger.png', array['rango','critico','velocidad'], '[{"name":"Disparo Claro","type":"activa","target":"single","description":"Flecha de alto alcance."},{"name":"Pulso del Alba","type":"pasiva","target":"self","description":"Gana critico al atacar desde lejos."},{"name":"Lluvia Precisa","type":"activa","target":"aoe","description":"Zona de flechas repetidas."}]'::jsonb),
    ('arquera_de_la_brisas', 'Arquera de la Brisas', 'DPS de rango movil con ataques rapidos.', 'Agilidad', 'ranged_dps', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/windrunner.png', array['rango','movilidad','ataque'], '[{"name":"Tiro de Brisa","type":"activa","target":"line","description":"Dano a enemigos en linea."},{"name":"Paso Ligero","type":"activa","target":"self","description":"Movimiento y evasion breve."},{"name":"Cadencia Verde","type":"pasiva","target":"self","description":"Cada tercer ataque gana velocidad."}]'::jsonb),
    ('cazador_de_tormenta', 'Cazador de Tormenta', 'Rango hibrido con dano electrico y control ligero.', 'Agilidad', 'ranged_dps', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/sniper.png', array['rango','rayo','control'], '[{"name":"Municion Estatica","type":"activa","target":"single","description":"Dano y mini aturdimiento."},{"name":"Mira de Tormenta","type":"pasiva","target":"self","description":"Aumenta alcance por mundo."},{"name":"Campo Cargado","type":"activa","target":"aoe","description":"Zona que ralentiza."}]'::jsonb),
    ('corte_umbrio', 'Corte Umbrio', 'Asesino de burst, movilidad y evasion.', 'Agilidad', 'assassin', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/riki.png', array['asesino','burst','evasion'], '[{"name":"Tajo Umbrio","type":"activa","target":"single","description":"Dano alto por espalda."},{"name":"Paso Velado","type":"activa","target":"self","description":"Reposicionamiento corto."},{"name":"Instinto Sombrio","type":"pasiva","target":"self","description":"Evasion y critico contra enemigos aislados."}]'::jsonb),
    ('cuchilla_lunar', 'Cuchilla Lunar', 'Asesina con dano sostenido y sangrado.', 'Agilidad', 'assassin', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/phantom_assassin.png', array['asesino','sangrado','critico'], '[{"name":"Marca Lunar","type":"activa","target":"single","description":"Marca para recibir mas critico."},{"name":"Corte Creciente","type":"activa","target":"aoe","description":"Dano en cono."},{"name":"Sombra Paciente","type":"pasiva","target":"self","description":"El primer golpe tras no atacar pega mas fuerte."}]'::jsonb),
    ('arcanista_del_claro', 'Arcanista del Claro', 'Mago de dano y control con escalado de mana.', 'Inteligencia', 'mage', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png', array['mago','mana','control'], '[{"name":"Chispa Clara","type":"activa","target":"single","description":"Dano magico directo."},{"name":"Circulo Arcano","type":"activa","target":"aoe","description":"Zona de dano y slow."},{"name":"Intelecto Vivo","type":"pasiva","target":"self","description":"Convierte mana maximo en spell damage."}]'::jsonb),
    ('invocador_de_ceniza', 'Invocador de Ceniza', 'Mago de fuego con dano en area.', 'Inteligencia', 'mage', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png', array['mago','fuego','aoe'], '[{"name":"Brote de Ceniza","type":"activa","target":"aoe","description":"Explosion de fuego."},{"name":"Marca Ardiente","type":"activa","target":"single","description":"DoT magico."},{"name":"Combustion","type":"pasiva","target":"self","description":"Los criticos magicos dejan quemadura."}]'::jsonb),
    ('marea_de_runas', 'Marea de Runas', 'Mago de agua arcana con control defensivo.', 'Inteligencia', 'mage', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/morphling.png', array['mago','control','defensa'], '[{"name":"Runa Liquida","type":"activa","target":"single","description":"Dano y slow."},{"name":"Oleada de Mana","type":"activa","target":"aoe","description":"Dano en area y escudo menor."},{"name":"Flujo Arcano","type":"pasiva","target":"self","description":"Reduce cooldown tras lanzar habilidades."}]'::jsonb),
    ('tejedor_vital', 'Tejedor Vital', 'Healer principal con curacion y reduccion de amenaza.', 'Inteligencia', 'healer', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/dazzle.png', array['healer','curacion','soporte'], '[{"name":"Hebra Vital","type":"activa","target":"ally","description":"Cura a un aliado."},{"name":"Manto Sereno","type":"activa","target":"aoe","description":"Reduce dano del grupo."},{"name":"Manos Calmas","type":"pasiva","target":"self","description":"Reduce amenaza al curar."}]'::jsonb),
    ('oraculo_del_bosque', 'Oraculo del Bosque', 'Healer preventivo con escudos y purga.', 'Inteligencia', 'healer', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/oracle.png', array['healer','escudo','purga'], '[{"name":"Semilla Protectora","type":"activa","target":"ally","description":"Escudo de absorcion."},{"name":"Luz del Claro","type":"activa","target":"aoe","description":"Curacion de area."},{"name":"Lectura Natural","type":"pasiva","target":"self","description":"Aumenta curacion sobre aliados con poca vida."}]'::jsonb),
    ('portador_de_estandarte', 'Portador de Estandarte', 'Soporte de auras, utilidad y resistencia.', 'Inteligencia', 'support', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/omniknight.png', array['soporte','aura','resistencia'], '[{"name":"Estandarte Vivo","type":"activa","target":"aoe","description":"Aura temporal de dano y defensa."},{"name":"Orden de Avance","type":"activa","target":"ally","description":"Velocidad y resistencia."},{"name":"Disciplina","type":"pasiva","target":"aura","description":"Aura menor permanente."}]'::jsonb),
    ('custodio_runal', 'Custodio Runal', 'Soporte tactico con barreras y control.', 'Inteligencia', 'support', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/keeper_of_the_light.png', array['soporte','barrera','control'], '[{"name":"Barrera Runal","type":"activa","target":"aoe","description":"Escudo en zona."},{"name":"Pulso de Custodia","type":"activa","target":"aoe","description":"Empuja enemigos."},{"name":"Sello de Equipo","type":"pasiva","target":"aura","description":"Aumenta utilidad del grupo."}]'::jsonb)
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'hero',
  content_key,
  name_es,
  summary_es,
  category,
  role,
  1,
  10,
  null,
  null,
  jsonb_build_object(
    'source', 'design',
    'image_url', image_url,
    'tags', tags,
    'abilities', abilities,
    'primary_attribute', lower(category)
  ),
  'published',
  1
from hero_rows
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  world_min = excluded.world_min,
  world_max = excluded.world_max,
  payload = excluded.payload,
  status = excluded.status;

insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'ability',
  hero.content_key || '_' || lower(regexp_replace(ability.value ->> 'name', '[^a-zA-Z0-9]+', '_', 'g')),
  ability.value ->> 'name',
  ability.value ->> 'description',
  hero.category,
  hero.role,
  1,
  10,
  null,
  null,
  jsonb_build_object(
    'source', 'hero',
    'hero_key', hero.content_key,
    'type', ability.value ->> 'type',
    'target', ability.value ->> 'target',
    'description', ability.value ->> 'description'
  ),
  'published',
  1
from public.game_content_catalog hero
cross join lateral jsonb_array_elements(hero.payload -> 'abilities') ability
where hero.content_type = 'hero'
  and hero.status = 'published'
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status;

with resource_rows(content_key, name_es, summary_es, category, image_url, rarity, drop_roles) as (
  values
    ('wild_core', 'Nucleo Salvaje', 'Recurso comun de Zona 1 usado en crafteos iniciales.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ultimate_orb.png', 'common', array['normal','elite','boss']),
    ('zone_1_essence', 'Esencia de Zona 1', 'Recurso clave para equipo crafteado de Mundo 1.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/energy_booster.png', 'rare', array['elite','boss']),
    ('iron_bark', 'Corteza de Hierro', 'Material defensivo de arboles endurecidos.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/vanguard.png', 'common', array['normal','elite']),
    ('sharp_branch', 'Rama Afilada', 'Material basico para armas de rango.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/branches.png', 'common', array['normal','elite']),
    ('sunthread', 'Hilo Solar', 'Fibra usada en arcos y guantes de DPS.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/yasha.png', 'common', array['normal','elite']),
    ('living_leaf', 'Hoja Viva', 'Componente natural para curaciones y auras.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/mekansm.png', 'common', array['normal','elite']),
    ('clear_sap', 'Savia Clara', 'Fluido magico para focos y amuletos.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/holy_locket.png', 'rare', array['elite','boss']),
    ('shadow_cloth', 'Tela Sombria', 'Fibra ligera para asesinos.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/butterfly.png', 'common', array['normal','elite']),
    ('wolf_claw', 'Garra de Lobo', 'Material de burst y sangrado.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/desolator.png', 'common', array['normal','elite']),
    ('arcane_dust', 'Polvo Arcano', 'Base de dano magico.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/kaya.png', 'common', array['normal','elite']),
    ('banner_scrap', 'Retazo de Estandarte', 'Material de soporte y auras.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/vladmir.png', 'common', array['normal','elite']),
    ('hardened_shell', 'Caparazon Endurecido', 'Material de supervivencia general.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/crimson_guard.png', 'rare', array['elite','boss']),
    ('venom_gland', 'Glandula Venenosa', 'Componente para efectos de dano en tiempo.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/orb_of_venom.png', 'rare', array['elite']),
    ('elder_seed', 'Semilla Antigua', 'Material raro para recetas especiales de Zona 1.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ultimate_orb.png', 'epic', array['boss']),
    ('clearwater_vial', 'Frasco de Agua Clara', 'Material comun para consumibles y soporte.', 'resource', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/bottle.png', 'common', array['normal','elite'])
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'item',
  content_key,
  name_es,
  summary_es,
  category,
  'resource',
  1,
  2,
  null,
  null,
  jsonb_build_object('source', 'drop_resource', 'image_url', image_url, 'rarity', rarity, 'drop_roles', drop_roles),
  'published',
  1
from resource_rows
on conflict (content_type, content_key, version) do update set
  name_es = excluded.name_es,
  summary_es = excluded.summary_es,
  category = excluded.category,
  role = excluded.role,
  payload = excluded.payload,
  status = excluded.status;

create or replace function public.scale_stats(p_stats jsonb, p_min numeric, p_max numeric)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(key, jsonb_build_array(greatest(1, floor((value->>0)::numeric * p_min)::int), greatest(1, ceil((value->>1)::numeric * p_max)::int))), '{}'::jsonb)
  from jsonb_each(p_stats);
$$;

with craft_rows(content_key, name_es, summary_es, rarity, role, slot, image_url, stats, materials, uses) as (
  values
    ('iron_heart_plate','Placa Corazon de Hierro','Pieza defensiva para tanques que aumenta vida, armadura y amenaza.','rare','tank','chest','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/heart.png','{"health":[120,1350],"armor":[3,30],"threat":[4,36]}'::jsonb,'[{"key":"iron_bark","qty":6},{"key":"wild_core","qty":3},{"key":"zone_1_essence","qty":1}]'::jsonb,'["bulwark_oath"]'::jsonb),
    ('barkshield_gauntlets','Guantes Escudo de Corteza','Guantes tank con bloqueo y amenaza.','common','tank','gloves','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/vanguard.png','{"health":[80,920],"block":[6,58],"threat":[3,28]}'::jsonb,'[{"key":"iron_bark","qty":4},{"key":"hardened_shell","qty":1}]'::jsonb,'["iron_heart_plate"]'::jsonb),
    ('sentinel_root_helm','Yelmo Raiz Centinela','Casco tank de vida y resistencia.','rare','tank','head','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/hood_of_defiance.png','{"health":[100,1100],"resistance":[3,26],"armor":[2,22]}'::jsonb,'[{"key":"living_leaf","qty":4},{"key":"iron_bark","qty":4}]'::jsonb,'["thornwall_cloak"]'::jsonb),
    ('stoneguard_belt','Cinto Guardia de Piedra','Cinto para sostener golpes fisicos.','common','tank','belt','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/belt_of_strength.png','{"health":[90,980],"armor":[2,24],"damage_reduction":[1,12]}'::jsonb,'[{"key":"hardened_shell","qty":2},{"key":"wild_core","qty":2}]'::jsonb,'[]'::jsonb),
    ('thornwall_cloak','Capa Muro de Espinas','Capa tank con devolucion de dano moderada.','epic','tank','cape','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/crimson_guard.png','{"health":[130,1450],"return_damage":[2,18],"armor":[4,32]}'::jsonb,'[{"key":"iron_bark","qty":8},{"key":"hardened_shell","qty":3},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb),
    ('dawnstring_bow','Arco Cuerda del Alba','Arma de DPS rango enfocada en rango, velocidad y critico.','rare','ranged_dps','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/butterfly.png','{"damage":[18,205],"attack_speed":[8,60],"attack_range":[45,330]}'::jsonb,'[{"key":"sunthread","qty":5},{"key":"sharp_branch","qty":4},{"key":"zone_1_essence","qty":1}]'::jsonb,'["hawk_eye_relic"]'::jsonb),
    ('falconstring_gloves','Guantes Cuerda de Halcon','Guantes de velocidad para DPS rango.','common','ranged_dps','gloves','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/gloves.png','{"attack_speed":[10,72],"critical":[1,12],"damage":[8,120]}'::jsonb,'[{"key":"sunthread","qty":4},{"key":"wild_core","qty":2}]'::jsonb,'["dawnstring_bow"]'::jsonb),
    ('longwatch_quiver','Carcaj Guardia Larga','Carcaj de alcance y precision.','rare','ranged_dps','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/dragon_lance.png','{"attack_range":[55,360],"critical":[2,18],"damage":[10,150]}'::jsonb,'[{"key":"sharp_branch","qty":6},{"key":"sunthread","qty":2},{"key":"zone_1_essence","qty":1}]'::jsonb,'[]'::jsonb),
    ('swiftleaf_greaves','Grebas Hoja Veloz','Botas de kiteo para rango.','common','ranged_dps','boots','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/power_treads.png','{"movement_speed":[14,96],"attack_speed":[5,42],"evasion":[1,10]}'::jsonb,'[{"key":"living_leaf","qty":3},{"key":"sunthread","qty":3}]'::jsonb,'[]'::jsonb),
    ('stormneedle_lens','Lente Aguja de Tormenta','Lente de mayor golpe para rango.','epic','ranged_dps','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/maelstrom.png','{"damage":[20,230],"proc_chance":[3,18],"attack_range":[30,240]}'::jsonb,'[{"key":"arcane_dust","qty":3},{"key":"sharp_branch","qty":5},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb),
    ('umbra_step_boots','Botas Paso Umbrio','Botas para asesinos con evasion, movilidad y dano explosivo.','epic','assassin','boots','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/phase_boots.png','{"damage":[14,180],"evasion":[3,30],"movement_speed":[12,92]}'::jsonb,'[{"key":"shadow_cloth","qty":5},{"key":"wolf_claw","qty":4},{"key":"zone_1_essence","qty":1}]'::jsonb,'["nightfall_contract"]'::jsonb),
    ('nightfang_dagger','Daga Colmillo Nocturno','Daga de burst para asesinos.','rare','assassin','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/diffusal_blade.png','{"damage":[20,240],"critical":[2,22],"bleed":[3,26]}'::jsonb,'[{"key":"wolf_claw","qty":6},{"key":"shadow_cloth","qty":2}]'::jsonb,'[]'::jsonb),
    ('mistveil_hood','Capucha Velo de Niebla','Capucha de evasion y amenaza reducida.','common','assassin','head','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/butterfly.png','{"evasion":[4,34],"threat_reduction":[3,30],"movement_speed":[8,70]}'::jsonb,'[{"key":"shadow_cloth","qty":6},{"key":"clear_sap","qty":1}]'::jsonb,'[]'::jsonb),
    ('silent_hunter_ring','Anillo Cazador Silente','Anillo de primer golpe.','rare','assassin','ring','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/desolator.png','{"damage":[14,190],"first_hit_bonus":[4,32],"critical":[1,16]}'::jsonb,'[{"key":"wolf_claw","qty":4},{"key":"venom_gland","qty":2}]'::jsonb,'[]'::jsonb),
    ('backstab_charm','Dije de Punzada','Dije para golpes por espalda y movilidad.','epic','assassin','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/blink.png','{"backstab_damage":[5,44],"movement_speed":[10,85],"evasion":[2,20]}'::jsonb,'[{"key":"shadow_cloth","qty":7},{"key":"venom_gland","qty":2},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb),
    ('clear_arcane_focus','Foco Arcano Claro','Catalizador magico para magos con dano de hechizo, mana y control.','epic','mage','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/kaya.png','{"spell_damage":[22,285],"mana":[90,1050],"control_power":[3,31]}'::jsonb,'[{"key":"arcane_dust","qty":5},{"key":"clear_sap","qty":4},{"key":"zone_1_essence","qty":1}]'::jsonb,'["stormbound_focus"]'::jsonb),
    ('emberleaf_codex','Codice Hoja de Brasa','Libro de dano magico en area.','rare','mage','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/dagon.png','{"spell_damage":[18,240],"aoe_damage":[3,28],"mana":[70,850]}'::jsonb,'[{"key":"arcane_dust","qty":5},{"key":"living_leaf","qty":2}]'::jsonb,'[]'::jsonb),
    ('stormglass_orb','Orbe Vidrio de Tormenta','Orbe de proc magico y mana.','rare','mage','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/aether_lens.png','{"spell_damage":[16,210],"proc_chance":[2,18],"mana_regen":[1,12]}'::jsonb,'[{"key":"arcane_dust","qty":4},{"key":"clear_sap","qty":3}]'::jsonb,'[]'::jsonb),
    ('manaweave_sash','Faja Tejemana','Cinturon de mana y cooldown.','common','mage','belt','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/energy_booster.png','{"mana":[110,1200],"cooldown_reduction":[1,14],"spell_damage":[6,130]}'::jsonb,'[{"key":"sunthread","qty":3},{"key":"arcane_dust","qty":4}]'::jsonb,'[]'::jsonb),
    ('rootbind_staff','Baston Raiz Vinculante','Baston magico de control.','epic','mage','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/sheepstick.png','{"control_power":[5,42],"spell_damage":[18,260],"mana":[80,900]}'::jsonb,'[{"key":"living_leaf","qty":4},{"key":"arcane_dust","qty":6},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb),
    ('vital_weaver_charm','Amuleto Tejedor Vital','Amuleto healer con curacion, mana y reduccion de amenaza.','rare','healer','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/holy_locket.png','{"healing_power":[18,220],"mana_regen":[1,12],"threat_reduction":[3,32]}'::jsonb,'[{"key":"living_leaf","qty":5},{"key":"clear_sap","qty":4},{"key":"zone_1_essence","qty":1}]'::jsonb,'["sanctuary_lantern"]'::jsonb),
    ('springwater_lantern','Linterna Agua de Primavera','Linterna de curacion en area.','rare','healer','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/mekansm.png','{"healing_power":[15,210],"aoe_healing":[2,24],"mana_regen":[1,10]}'::jsonb,'[{"key":"clearwater_vial","qty":5},{"key":"living_leaf","qty":3}]'::jsonb,'[]'::jsonb),
    ('mercyroot_staff','Baston Raiz de Misericordia','Baston de curacion directa.','epic','healer','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/guardian_greaves.png','{"healing_power":[25,300],"shield_power":[3,28],"mana":[80,900]}'::jsonb,'[{"key":"living_leaf","qty":6},{"key":"clear_sap","qty":3},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb),
    ('calmwind_sandals','Sandalias Viento Calmo','Botas healer de posicionamiento.','common','healer','boots','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/arcane_boots.png','{"movement_speed":[10,78],"mana_regen":[1,9],"threat_reduction":[3,26]}'::jsonb,'[{"key":"sunthread","qty":2},{"key":"clearwater_vial","qty":4}]'::jsonb,'[]'::jsonb),
    ('lifebloom_brooch','Broche Flor de Vida','Broche de curacion preventiva.','rare','healer','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/lotus_orb.png','{"healing_power":[12,190],"shield_power":[2,24],"resistance":[1,14]}'::jsonb,'[{"key":"living_leaf","qty":5},{"key":"elder_seed","qty":1}]'::jsonb,'[]'::jsonb),
    ('bannerbearer_crest','Cresta del Estandarte','Soporte utilitario con auras, resistencia y seguridad de equipo.','rare','support','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/vladmir.png','{"aura_power":[3,40],"resistance":[2,29],"utility":[4,43]}'::jsonb,'[{"key":"banner_scrap","qty":5},{"key":"living_leaf","qty":3},{"key":"zone_1_essence","qty":1}]'::jsonb,'["warband_standard"]'::jsonb),
    ('wardens_signal','Senal del Guardian','Item de soporte para marcar objetivos.','common','support','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/solar_crest.png','{"utility":[5,46],"team_damage":[1,12],"resistance":[1,14]}'::jsonb,'[{"key":"banner_scrap","qty":4},{"key":"sharp_branch","qty":2}]'::jsonb,'[]'::jsonb),
    ('harmony_drum','Tambor de Armonia','Aura de velocidad y sustain.', 'rare','support','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ancient_janggo.png','{"aura_power":[4,42],"movement_speed":[5,48],"mana_regen":[1,10]}'::jsonb,'[{"key":"banner_scrap","qty":5},{"key":"clearwater_vial","qty":3}]'::jsonb,'[]'::jsonb),
    ('rescue_thread','Hilo de Rescate','Utilidad para reducir amenaza de aliados.','rare','support','belt','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/force_staff.png','{"utility":[5,50],"threat_reduction":[4,36],"movement_speed":[4,38]}'::jsonb,'[{"key":"sunthread","qty":4},{"key":"banner_scrap","qty":3},{"key":"zone_1_essence","qty":1}]'::jsonb,'[]'::jsonb),
    ('barrier_totem','Totem de Barrera','Totem soporte defensivo.', 'epic','support','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/pipe.png','{"aura_power":[5,55],"shield_power":[4,40],"resistance":[4,34]}'::jsonb,'[{"key":"hardened_shell","qty":3},{"key":"banner_scrap","qty":5},{"key":"zone_1_essence","qty":2}]'::jsonb,'[]'::jsonb)
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'item',
  content_key,
  name_es,
  summary_es,
  rarity,
  role,
  1,
  10,
  1,
  5,
  jsonb_build_object(
    'source', 'craft',
    'slot', slot,
    'image_url', image_url,
    'stats_by_tier', jsonb_build_object(
      '1', scale_stats(stats, 0.08, 0.16),
      '2', scale_stats(stats, 0.22, 0.36),
      '3', scale_stats(stats, 0.40, 0.56),
      '4', scale_stats(stats, 0.62, 0.78),
      '5', scale_stats(stats, 0.82, 1.00)
    ),
    'stat_profile', stats,
    'materials', materials,
    'uses', uses,
    'tier_roll', jsonb_build_object('1', 55, '2', 28, '3', 12, '4', 4, '5', 1)
  ),
  'published',
  1
from craft_rows
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

with drop_rows(content_key, name_es, summary_es, rarity, role, slot, image_url, fixed_stats) as (
  values
    ('rugged_sword','Espada Rustica','Drop comun de dano fisico para empezar Mundo 1.','common','general_dps','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/broadsword.png','{"damage":[8,18]}'::jsonb),
    ('ranger_sling','Honda de Explorador','Drop basico para DPS de rango temprano.','common','ranged_dps','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/dragon_lance.png','{"damage":[6,16],"attack_range":[20,45]}'::jsonb),
    ('novice_tome','Tomo Novato','Drop basico de mago con mana y spell damage.','common','mage','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/kaya.png','{"spell_damage":[7,18],"mana":[40,90]}'::jsonb),
    ('acolyte_band','Banda de Acolito','Drop basico de healer.','common','healer','ring','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ring_of_regen.png','{"healing_power":[6,16],"mana_regen":[1,2]}'::jsonb),
    ('recruit_shield','Escudo de Recluta','Drop de supervivencia para tanques y soporte.','common','general_survival','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/buckler.png','{"health":[60,130],"armor":[1,3]}'::jsonb),
    ('scout_boots','Botas de Explorador','Drop comun de movimiento.','common','general_survival','boots','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/boots.png','{"movement_speed":[8,18]}'::jsonb),
    ('forest_amulet','Amuleto del Bosque','Drop hibrido de resistencia.','rare','support','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/cloak.png','{"resistance":[2,7],"utility":[2,6]}'::jsonb),
    ('small_spellstone','Piedrahechizo Pequena','Drop raro para magos de Zona 1.','rare','mage','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/void_stone.png','{"spell_damage":[14,34],"mana_regen":[2,4]}'::jsonb),
    ('wolfhide_wrap','Envoltura de Piel de Lobo','Drop de asesino con evasion.','rare','assassin','cape','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/shadow_amulet.png','{"evasion":[3,9],"damage":[7,22]}'::jsonb),
    ('old_banner_pin','Pin de Estandarte Viejo','Drop soporte de aura menor.','rare','support','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/headdress.png','{"aura_power":[2,8],"resistance":[1,5]}'::jsonb)
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'item',
  content_key,
  name_es,
  summary_es,
  rarity,
  role,
  1,
  1,
  1,
  3,
  jsonb_build_object('source', 'drop', 'slot', slot, 'image_url', image_url, 'stats_by_tier', jsonb_build_object('1', scale_stats(fixed_stats, 0.70, 1.00), '2', scale_stats(fixed_stats, 1.05, 1.35), '3', scale_stats(fixed_stats, 1.40, 1.80)), 'drop_roles', jsonb_build_array('normal','elite','boss')),
  'published',
  1
from drop_rows
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

with shop_rows(content_key, name_es, summary_es, rarity, role, slot, image_url, fixed_stats, price_gold) as (
  values
    ('hunter_training_blade','Hoja de Entrenamiento del Cazador','Item comprable fijo de dano basico. No se craftea.','common','general_dps','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/broadsword.png','{"damage":18,"attack_speed":5}'::jsonb,120),
    ('apprentice_guard_vest','Chaleco Guardia Aprendiz','Item comprable fijo de supervivencia. No se craftea.','common','general_survival','chest','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/vanguard.png','{"health":150,"armor":2}'::jsonb,140),
    ('novice_mana_bottle','Botella de Mana Novata','Compra fija para magos/healers de Mundo 1.','common','mage','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/bottle.png','{"mana":120,"mana_regen":1}'::jsonb,110),
    ('militia_buckler','Rodela de Milicia','Compra fija de armadura temprana.','common','tank','offhand','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/buckler.png','{"armor":4,"health":80}'::jsonb,130),
    ('trainee_focus','Foco de Aprendiz','Compra fija de spell damage bajo.','common','mage','weapon','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/null_talisman.png','{"spell_damage":16,"mana":70}'::jsonb,135),
    ('field_menders_band','Banda de Curador de Campo','Compra fija de curacion inicial.','common','healer','ring','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ring_of_regen.png','{"healing_power":18,"mana_regen":1}'::jsonb,125),
    ('stable_quiver','Carcaj Estable','Compra fija de rango y dano bajo.','common','ranged_dps','trinket','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/dragon_lance.png','{"damage":12,"attack_range":55}'::jsonb,135),
    ('warding_cloak','Capa de Resguardo','Compra fija de resistencia.','common','support','cape','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/cloak.png','{"resistance":5,"utility":4}'::jsonb,150),
    ('travel_rations','Raciones de Viaje','Consumible futuro para recuperacion entre campamentos.','common','general_survival','consumable','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/faerie_fire.png','{"health_restore":120}'::jsonb,45),
    ('recall_flare','Bengala de Retorno','Consumible futuro de utilidad.','rare','support','consumable','https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/tpscroll.png','{"utility":10}'::jsonb,220)
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'item',
  content_key,
  name_es,
  summary_es,
  rarity,
  role,
  1,
  1,
  1,
  1,
  jsonb_build_object('source', 'shop', 'slot', slot, 'image_url', image_url, 'fixed_stats', fixed_stats, 'price_gold', price_gold, 'not_craftable', true),
  'published',
  1
from shop_rows
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

insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'recipe',
  'recipe_' || item.content_key,
  'Receta: ' || item.name_es,
  'Permite craftear ' || item.name_es || ' con resultado variable de tier 1 a 5.',
  item.category,
  item.role,
  item.world_min,
  item.world_max,
  item.tier_min,
  item.tier_max,
  jsonb_build_object(
    'source', 'recipe',
    'creates', item.content_key,
    'image_url', 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/recipe.png',
    'materials', item.payload -> 'materials',
    'tier_roll', coalesce(item.payload -> 'tier_roll', jsonb_build_object('1', 55, '2', 28, '3', 12, '4', 4, '5', 1)),
    'npc', 'npc_sirv_crafting_master'
  ),
  'published',
  1
from public.game_content_catalog item
where item.content_type = 'item'
  and item.status = 'published'
  and item.payload ->> 'source' = 'craft'
  and item.world_min = 1
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
  version_key, content_type, content_key, change_type, title_es, detail_es, after_value
)
values
  ('balance_0_7_0_catalogo_w1', 'hero', 'world1_heroes', 'added', '15 heroes base registrados', 'El catalogo ahora registra 15 heroes con rol, atributo y habilidades en BD.', '{"heroes":15}'::jsonb),
  ('balance_0_7_0_catalogo_w1', 'item', 'world1_items', 'added', 'Variedad de items Mundo 1', 'Se agregaron recursos, drops, tienda fija y crafteos por rol para Mundo 1.', '{"world":1}'::jsonb),
  ('balance_0_7_0_catalogo_w1', 'recipe', 'world1_recipes', 'added', 'Recetas generadas desde crafteos', 'Cada item crafteable de Mundo 1 genera su receta publica con materiales y probabilidad de tier.', '{"tier_roll":"1-5"}'::jsonb),
  ('balance_0_7_0_catalogo_w1', 'ability', 'hero_abilities', 'added', 'Habilidades en catalogo', 'Las habilidades de heroes quedan registradas como contenido consultable.', '{"content_type":"ability"}'::jsonb)
on conflict do nothing;
