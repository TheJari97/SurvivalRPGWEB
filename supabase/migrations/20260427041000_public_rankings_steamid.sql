drop view if exists public.public_rankings;

create view public.public_rankings as
select
  ph.steam_id,
  ph.season_id,
  ph.hero_name,
  ph.level,
  ph.world_level,
  ph.zone_unlocked,
  ph.gear_score,
  p.display_name,
  p.avatar_url,
  ph.last_save_at
from public.player_heroes ph
join public.players p on p.steam_id = ph.steam_id
order by ph.world_level desc, ph.level desc, ph.gear_score desc, ph.last_save_at desc;

grant select on public.public_rankings to anon, authenticated;
