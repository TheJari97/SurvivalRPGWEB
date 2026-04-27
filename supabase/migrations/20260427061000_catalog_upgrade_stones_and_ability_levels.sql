insert into public.game_balance_versions(version_key, title_es, summary_es, status, published_at)
values (
  'balance_0_7_1_catalogo_upgrades',
  'Catalogo con upgrades y niveles de habilidades',
  'Agrega piedras de upgrade, estabilizadores de crafteo y niveles legibles para habilidades de heroes.',
  'published',
  now()
)
on conflict (version_key) do update set
  title_es = excluded.title_es,
  summary_es = excluded.summary_es,
  status = excluded.status,
  published_at = coalesce(public.game_balance_versions.published_at, excluded.published_at);

with upgrade_rows(content_key, name_es, summary_es, rarity, world_min, world_max, image_url, use_text, drop_note) as (
  values
    ('common_tempering_stone', 'Piedra de Afinado Comun', 'Material para subir piezas basicas hacia comun y estabilizar crafteos iniciales.', 'common', 1, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/energy_booster.png', 'Basico a comun; reduce fallo en crafteos de Mundo 1.', 'Campamentos normales Mundo 1, elites y jefe de zona.'),
    ('rare_azure_stone', 'Piedra Azul de Mejora', 'Material para intentar subir piezas comunes hacia raras.', 'rare', 2, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/void_stone.png', 'Comun a raro; mejora probabilidad de tier alto.', 'Empieza en Mundo 2. Mejor tasa en elites y jefes.'),
    ('epic_violet_stone', 'Piedra Morada de Ascenso', 'Material para subir piezas raras hacia epicas.', 'epic', 4, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ultimate_orb.png', 'Raro a epico; puede agregar efecto secundario.', 'Empieza en Mundo 4. Pensada para retos de zona.'),
    ('legendary_gold_core', 'Nucleo Dorado de Ascenso', 'Material avanzado para convertir piezas epicas en legendarias.', 'legendary', 6, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/reaver.png', 'Epico a legendario; exige materiales de jefes.', 'Empieza en Mundo 6. Baja tasa fuera de jefes.'),
    ('mythic_season_fragment', 'Fragmento Mitico de Temporada', 'Material estacional para upgrades legendarios a miticos.', 'mythic', 8, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/apex.png', 'Legendario a mitico; reservado a mundos altos.', 'Empieza en Mundo 8, eventos y jefes mayores.'),
    ('craft_safety_powder', 'Polvo de Estabilizacion', 'Material consumible para mitigar fallo de crafteo sin convertir rareza.', 'common', 1, 10, 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/dust.png', 'Reduce tasa de fallo y protege materiales menores.', 'Mundo 1 en adelante, alta tasa en recursos.')
)
insert into public.game_content_catalog(
  content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, status, version
)
select
  'item',
  content_key,
  name_es,
  summary_es,
  'resource',
  'resource',
  world_min,
  world_max,
  1,
  1,
  jsonb_build_object(
    'source', 'drop_resource',
    'image_url', image_url,
    'rarity', rarity,
    'drop_roles', jsonb_build_array('normal','elite','boss'),
    'upgrade_use', use_text,
    'drop_note', drop_note,
    'tags', jsonb_build_array('upgrade','crafteo','estabilizador')
  ),
  'published',
  1
from upgrade_rows
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
  status = excluded.status,
  updated_at = now();

with enriched as (
  select
    hero.content_key,
    jsonb_agg(
      ability.value
      || jsonb_build_object(
        'max_level', 5,
        'levels', jsonb_build_array(
          'Desbloquea el efecto base.',
          'Aumenta el valor principal y mejora consistencia.',
          'Reduce enfriamiento o mejora duracion.',
          'Agrega efecto secundario segun rol.',
          'Nivel maximo con escalado fuerte para mundos altos.'
        )
      )
      order by ability.ordinality
    ) as abilities
  from public.game_content_catalog hero
  cross join lateral jsonb_array_elements(hero.payload -> 'abilities') with ordinality ability(value, ordinality)
  where hero.content_type = 'hero'
  group by hero.content_key
)
update public.game_content_catalog hero
set
  payload = jsonb_set(hero.payload, '{abilities}', enriched.abilities, true),
  updated_at = now()
from enriched
where hero.content_type = 'hero'
  and hero.content_key = enriched.content_key;

update public.game_content_catalog ability
set
  payload = ability.payload
    || jsonb_build_object(
      'max_level', 5,
      'levels', jsonb_build_array(
        'Desbloquea el efecto base.',
        'Aumenta el valor principal y mejora consistencia.',
        'Reduce enfriamiento o mejora duracion.',
        'Agrega efecto secundario segun rol.',
        'Nivel maximo con escalado fuerte para mundos altos.'
      )
    ),
  updated_at = now()
where ability.content_type = 'ability';

insert into public.game_balance_change_logs(version_key, content_type, content_key, change_type, title_es, detail_es, after_value)
values
  ('balance_0_7_1_catalogo_upgrades', 'item', 'upgrade_stones', 'added', 'Piedras de upgrade y estabilizacion', 'El catalogo explica materiales para mejorar rareza y mitigar fallos de crafteo.', '{"category":"resource","source":"drop_resource"}'::jsonb),
  ('balance_0_7_1_catalogo_upgrades', 'ability', 'hero_ability_levels', 'reworked', 'Niveles visibles de habilidades', 'Las habilidades de heroes muestran nivel maximo y progreso por nivel en la web.', '{"max_level":5}'::jsonb)
on conflict do nothing;
