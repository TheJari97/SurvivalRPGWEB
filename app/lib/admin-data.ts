import { getSupabaseAdminClient } from "./admin-auth";

export type AdminDashboardData = {
  playersCount: number;
  heroesCount: number;
  acceptedSavesCount: number;
  auditLogsCount: number;
  publishedContentCount: number;
  latestSaveAt: string | null;
  recentActivityCount: number;
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
    status: string | null;
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

export type AdminStaffRow = {
  id: string;
  steam_id: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  role: string;
  roles: string[];
  active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string | null;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();
  const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: summary }, { data: recentHeroes }, { data: recentSaves }, { count: recentActivityCount }] = await Promise.all([
    supabase.from("admin_dashboard_summary").select("*").maybeSingle(),
    supabase
      .from("player_heroes")
      .select("steam_id, hero_name, level, world_level, gear_score, last_save_at")
      .order("last_save_at", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("game_save_events")
      .select("steam_id, hero_name, season_id, status, addon_version, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", recentSince),
  ]);

  return {
    playersCount: Number(summary?.players_count ?? 0),
    heroesCount: Number(summary?.heroes_count ?? 0),
    acceptedSavesCount: Number(summary?.accepted_saves_count ?? 0),
    auditLogsCount: Number(summary?.audit_logs_count ?? 0),
    publishedContentCount: Number(summary?.published_content_count ?? 0),
    latestSaveAt: summary?.latest_save_at ?? null,
    recentActivityCount: recentActivityCount ?? 0,
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

export async function getAdminStaffMembers(query = ""): Promise<AdminStaffRow[]> {
  const supabase = getSupabaseAdminClient();
  const search = query.trim().toLowerCase();
  const { data } = await supabase
    .from("admin_staff_profiles")
    .select("id, steam_id, display_name, avatar_url, country, role, roles, active, permissions, created_at, updated_at")
    .order("role_rank", { ascending: false })
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((staff) => {
      if (!search) return true;
      return String(staff.display_name ?? "").toLowerCase().includes(search)
        || String(staff.steam_id).toLowerCase().includes(search)
        || String(staff.role).toLowerCase().includes(search);
    })
    .map((staff) => ({
      id: String(staff.id),
      steam_id: String(staff.steam_id),
      display_name: staff.display_name,
      avatar_url: staff.avatar_url,
      country: staff.country,
      role: String(staff.role),
      roles: Array.isArray(staff.roles) ? staff.roles.map(String) : [String(staff.role)],
      active: Boolean(staff.active),
      permissions: Array.isArray(staff.permissions) ? staff.permissions.map(String) : [],
      created_at: staff.created_at,
      updated_at: staff.updated_at,
    }));
}
