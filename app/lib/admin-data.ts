import { getSupabaseAdminClient } from "./admin-auth";

export type AdminDashboardData = {
  playersCount: number;
  heroesCount: number;
  acceptedSavesCount: number;
  auditLogsCount: number;
  publishedContentCount: number;
  latestSaveAt: string | null;
  recentHeroes: Array<{
    steam_id: string;
    hero_name: string;
    level: number;
    world_level: number;
    gear_score: number;
    last_save_at: string | null;
  }>;
  recentSaves: Array<{
    steam_id: string;
    hero_name: string;
    season_id: string;
    addon_version: string | null;
    created_at: string;
  }>;
};

export type AdminPlayerRow = {
  steam_id: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  updated_at: string | null;
  hero_count: number;
  max_level: number;
  max_world: number;
  total_gold: number;
};

export type AdminPlayerDetail = {
  player: {
    steam_id: string;
    display_name: string | null;
    avatar_url: string | null;
    country: string | null;
    updated_at: string | null;
  } | null;
  heroes: Array<Record<string, unknown>>;
  cosmetics: Array<Record<string, unknown>>;
  recentSaves: Array<Record<string, unknown>>;
  auditLogs: Array<Record<string, unknown>>;
};

export type AdminAccountRow = {
  id: string;
  steam_id: string | null;
  username: string;
  must_change_password: boolean;
  active: boolean;
  password_changed_at: string | null;
  created_at: string;
  reset_requests_count: number;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();
  const [{ data: summary }, { data: recentHeroes }, { data: recentSaves }] = await Promise.all([
    supabase.from("admin_dashboard_summary").select("*").maybeSingle(),
    supabase
      .from("player_heroes")
      .select("steam_id, hero_name, level, world_level, gear_score, last_save_at")
      .order("last_save_at", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("game_save_events")
      .select("steam_id, hero_name, season_id, addon_version, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    playersCount: Number(summary?.players_count ?? 0),
    heroesCount: Number(summary?.heroes_count ?? 0),
    acceptedSavesCount: Number(summary?.accepted_saves_count ?? 0),
    auditLogsCount: Number(summary?.audit_logs_count ?? 0),
    publishedContentCount: Number(summary?.published_content_count ?? 0),
    latestSaveAt: summary?.latest_save_at ?? null,
    recentHeroes: recentHeroes ?? [],
    recentSaves: recentSaves ?? [],
  };
}

export async function getAdminPlayers(query = ""): Promise<AdminPlayerRow[]> {
  const supabase = getSupabaseAdminClient();
  const search = query.trim().toLowerCase();
  const [{ data: players }, { data: heroes }] = await Promise.all([
    supabase
      .from("players")
      .select("steam_id, display_name, avatar_url, country, updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(150),
    supabase
      .from("player_heroes")
      .select("steam_id, level, world_level, gold"),
  ]);

  const heroStats = new Map<string, { hero_count: number; max_level: number; max_world: number; total_gold: number }>();
  for (const hero of heroes ?? []) {
    const steamId = String(hero.steam_id);
    const previous = heroStats.get(steamId) ?? { hero_count: 0, max_level: 0, max_world: 0, total_gold: 0 };
    previous.hero_count += 1;
    previous.max_level = Math.max(previous.max_level, Number(hero.level ?? 0));
    previous.max_world = Math.max(previous.max_world, Number(hero.world_level ?? 0));
    previous.total_gold += Number(hero.gold ?? 0);
    heroStats.set(steamId, previous);
  }

  return (players ?? [])
    .filter((player) => {
      if (!search) return true;
      return String(player.steam_id).toLowerCase().includes(search)
        || String(player.display_name ?? "").toLowerCase().includes(search);
    })
    .map((player) => ({
      steam_id: player.steam_id,
      display_name: player.display_name,
      avatar_url: player.avatar_url,
      country: player.country,
      updated_at: player.updated_at,
      ...(heroStats.get(player.steam_id) ?? { hero_count: 0, max_level: 0, max_world: 0, total_gold: 0 }),
    }));
}

export async function getAdminPlayerDetail(steamId: string): Promise<AdminPlayerDetail> {
  const supabase = getSupabaseAdminClient();
  const [{ data: player }, { data: heroes }, { data: cosmetics }, { data: recentSaves }, { data: auditLogs }] = await Promise.all([
    supabase
      .from("players")
      .select("steam_id, display_name, avatar_url, country, updated_at")
      .eq("steam_id", steamId)
      .maybeSingle(),
    supabase
      .from("player_heroes")
      .select("id, season_id, hero_name, level, xp, gold, world_level, zone_unlocked, gear_score, skill_points, payload, last_save_at")
      .eq("steam_id", steamId)
      .order("last_save_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("account_cosmetics")
      .select("cosmetic_id, source, created_at")
      .eq("steam_id", steamId)
      .order("created_at", { ascending: false }),
    supabase
      .from("game_save_events")
      .select("hero_name, season_id, addon_version, source, status, created_at")
      .eq("steam_id", steamId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_logs")
      .select("action, actor_role, target_type, target_id, created_at")
      .eq("actor_steam_id", steamId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    player: player ?? null,
    heroes: heroes ?? [],
    cosmetics: cosmetics ?? [],
    recentSaves: recentSaves ?? [],
    auditLogs: auditLogs ?? [],
  };
}

export async function getAdminAccounts(query = ""): Promise<AdminAccountRow[]> {
  const supabase = getSupabaseAdminClient();
  const search = query.trim().toLowerCase();
  const [{ data: accounts }, { data: resets }] = await Promise.all([
    supabase
      .from("admin_accounts")
      .select("id, steam_id, username, must_change_password, active, password_changed_at, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_password_reset_requests")
      .select("admin_account_id, status"),
  ]);

  const resetCounts = new Map<string, number>();
  for (const reset of resets ?? []) {
    if (reset.status !== "requested") continue;
    const accountId = String(reset.admin_account_id);
    resetCounts.set(accountId, (resetCounts.get(accountId) ?? 0) + 1);
  }

  return (accounts ?? [])
    .filter((account) => {
      if (!search) return true;
      return String(account.username).toLowerCase().includes(search)
        || String(account.steam_id ?? "").toLowerCase().includes(search);
    })
    .map((account) => ({
      id: account.id,
      steam_id: account.steam_id,
      username: account.username,
      must_change_password: account.must_change_password,
      active: account.active,
      password_changed_at: account.password_changed_at,
      created_at: account.created_at,
      reset_requests_count: resetCounts.get(account.id) ?? 0,
    }));
}
