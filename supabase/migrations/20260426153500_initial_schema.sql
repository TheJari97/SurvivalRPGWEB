create extension if not exists pgcrypto;

create table if not exists public.players (
  steam_id text primary key,
  display_name text,
  avatar_url text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  steam_id text references public.players(steam_id) on delete cascade,
  username text unique not null,
  password_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_roles (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'moderator', 'support', 'user')),
  created_at timestamptz not null default now(),
  unique (steam_id, role)
);

create table if not exists public.seasons (
  season_id text primary key,
  name_es text not null,
  name_en text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.player_heroes (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  season_id text not null references public.seasons(season_id),
  hero_name text not null,
  level int not null default 1 check (level between 1 and 100),
  xp int not null default 0 check (xp >= 0),
  gold int not null default 0 check (gold >= 0),
  world_level int not null default 1 check (world_level between 1 and 10),
  zone_unlocked int not null default 1 check (zone_unlocked between 1 and 10),
  gear_score int not null default 0 check (gear_score >= 0),
  skill_points int not null default 0 check (skill_points >= 0),
  payload jsonb not null default '{}'::jsonb,
  last_save_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (steam_id, season_id, hero_name)
);

create table if not exists public.hero_inventory_items (
  item_instance_id uuid primary key default gen_random_uuid(),
  player_hero_id uuid not null references public.player_heroes(id) on delete cascade,
  base_item_name text not null,
  display_name_es text,
  source text not null check (source in ('drop', 'craft', 'shop', 'reward', 'admin')),
  rarity text not null check (rarity in ('basic', 'common', 'rare', 'epic', 'legendary', 'mythic', 'divine')),
  tier int not null default 1 check (tier between 1 and 5),
  slot text not null,
  rolls jsonb not null default '{}'::jsonb,
  affixes jsonb not null default '[]'::jsonb,
  bound_type text not null default 'hero' check (bound_type in ('hero', 'account', 'tradeable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_pets (
  id uuid primary key default gen_random_uuid(),
  player_hero_id uuid not null references public.player_heroes(id) on delete cascade,
  pet_id text not null,
  pet_level int not null default 1 check (pet_level >= 1),
  active boolean not null default false,
  artifacts jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  unique (player_hero_id, pet_id)
);

create table if not exists public.account_cosmetics (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  cosmetic_id text not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (steam_id, cosmetic_id)
);

create table if not exists public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  player_hero_id uuid not null references public.player_heroes(id) on delete cascade,
  quest_id text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'claimed', 'failed')),
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (player_hero_id, quest_id)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'chargeback')),
  product_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.premium_wallets (
  steam_id text primary key references public.players(steam_id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_ledger (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null references public.players(steam_id) on delete cascade,
  delta int not null,
  reason text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.balance_configs (
  id uuid primary key default gen_random_uuid(),
  config_key text not null,
  scope text not null default 'global',
  value jsonb not null,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (config_key, scope, version)
);

create table if not exists public.monster_configs (
  monster_id text primary key,
  zone int not null,
  world_level int,
  stats jsonb not null default '{}'::jsonb,
  abilities jsonb not null default '[]'::jsonb,
  drops jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_steam_id text,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  ip_address text,
  user_agent text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_player_heroes_rankings on public.player_heroes (season_id, world_level desc, level desc, gear_score desc);
create index if not exists idx_player_heroes_steam on public.player_heroes (steam_id);
create index if not exists idx_inventory_hero on public.hero_inventory_items (player_hero_id);
create index if not exists idx_purchases_steam on public.purchases (steam_id, created_at desc);
create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_balance_published on public.balance_configs (config_key, scope, status, version desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_logs(action, target_type, target_id, before_value, after_value)
  values (tg_op, tg_table_name, coalesce(new.id::text, old.id::text), to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists trg_player_heroes_updated_at on public.player_heroes;
create trigger trg_player_heroes_updated_at before update on public.player_heroes
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_accounts_updated_at on public.admin_accounts;
create trigger trg_admin_accounts_updated_at before update on public.admin_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_inventory_updated_at on public.hero_inventory_items;
create trigger trg_inventory_updated_at before update on public.hero_inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_player_heroes_audit on public.player_heroes;
create trigger trg_player_heroes_audit after insert or update or delete on public.player_heroes
for each row execute function public.audit_row_change();

create or replace view public.public_rankings as
select
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

create or replace view public.current_balance_configs as
select distinct on (config_key, scope)
  config_key,
  scope,
  value,
  version,
  published_at
from public.balance_configs
where status = 'published'
order by config_key, scope, version desc;

alter table public.players enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.player_roles enable row level security;
alter table public.seasons enable row level security;
alter table public.player_heroes enable row level security;
alter table public.hero_inventory_items enable row level security;
alter table public.hero_pets enable row level security;
alter table public.account_cosmetics enable row level security;
alter table public.quest_progress enable row level security;
alter table public.purchases enable row level security;
alter table public.premium_wallets enable row level security;
alter table public.premium_ledger enable row level security;
alter table public.balance_configs enable row level security;
alter table public.monster_configs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "public can read active seasons" on public.seasons;
create policy "public can read active seasons" on public.seasons
for select using (active = true);

drop policy if exists "public can read published balance" on public.balance_configs;
create policy "public can read published balance" on public.balance_configs
for select using (status = 'published');

drop policy if exists "public can read monster configs" on public.monster_configs;
create policy "public can read monster configs" on public.monster_configs
for select using (true);

grant select on public.public_rankings to anon, authenticated;
grant select on public.current_balance_configs to anon, authenticated;
grant select on public.seasons to anon, authenticated;
grant select on public.monster_configs to anon, authenticated;

insert into public.seasons(season_id, name_es, name_en, active)
values ('season_001', 'Temporada Fundacional', 'Founding Season', true)
on conflict (season_id) do update set active = excluded.active;

insert into public.players(steam_id, display_name)
values ('76561198988350556', 'TheJari97')
on conflict (steam_id) do update set display_name = excluded.display_name;

insert into public.player_roles(steam_id, role)
values ('76561198988350556', 'owner'), ('76561198988350556', 'admin')
on conflict (steam_id, role) do nothing;
