alter table public.player_roles
  add column if not exists active boolean not null default true,
  add column if not exists notes text,
  add column if not exists granted_by_steam_id text references public.players(steam_id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_player_roles_updated_at on public.player_roles;
create trigger trg_player_roles_updated_at before update on public.player_roles
for each row execute function public.set_updated_at();

create index if not exists idx_player_roles_staff_active
on public.player_roles (steam_id, role)
where active = true and role in ('owner', 'admin', 'moderator', 'support');

insert into public.players(steam_id, display_name)
values ('76561198988350556', 'TheJari97')
on conflict (steam_id) do update set display_name = coalesce(public.players.display_name, excluded.display_name);

insert into public.player_roles(steam_id, role, active, notes)
values
  ('76561198988350556', 'owner', true, 'bootstrap_owner'),
  ('76561198988350556', 'admin', true, 'bootstrap_admin')
on conflict (steam_id, role) do update set
  active = true,
  notes = coalesce(public.player_roles.notes, excluded.notes),
  updated_at = now();

insert into public.admin_role_permissions(role, permission)
values
  ('owner', 'admin.full_access'),
  ('admin', 'staff.read'),
  ('admin', 'staff.edit'),
  ('admin', 'players.read'),
  ('admin', 'players.sanction'),
  ('admin', 'progress.read'),
  ('admin', 'progress.edit'),
  ('admin', 'balance.read'),
  ('admin', 'balance.draft'),
  ('admin', 'balance.publish'),
  ('admin', 'items.read'),
  ('admin', 'items.edit'),
  ('admin', 'monsters.read'),
  ('admin', 'monsters.edit'),
  ('admin', 'payments.read'),
  ('admin', 'audit.read'),
  ('moderator', 'players.read'),
  ('moderator', 'players.sanction'),
  ('moderator', 'audit.read'),
  ('support', 'players.read'),
  ('support', 'payments.read')
on conflict (role, permission) do nothing;

drop view if exists public.admin_staff_profiles;
create view public.admin_staff_profiles as
with staff_roles as (
  select
    pr.*,
    case pr.role
      when 'owner' then 4
      when 'admin' then 3
      when 'moderator' then 2
      when 'support' then 1
      else 0
    end as role_rank
  from public.player_roles pr
  where pr.role in ('owner', 'admin', 'moderator', 'support')
)
select
  sr.steam_id as id,
  sr.steam_id,
  p.display_name,
  p.avatar_url,
  p.country,
  case max(sr.role_rank)
    when 4 then 'owner'
    when 3 then 'admin'
    when 2 then 'moderator'
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
  and l.content_type in (
    'hero',
    'item',
    'recipe',
    'pet',
    'monster',
    'quest',
    'zone',
    'world_level',
    'ability',
    'npc',
    'terrain',
    'map'
  )
order by v.published_at desc nulls last, l.created_at desc;

grant select on public.public_balance_change_log to anon, authenticated;

drop table if exists public.admin_password_reset_requests cascade;
drop table if exists public.admin_accounts cascade;
