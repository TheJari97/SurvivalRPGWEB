import { getSupabaseAdminClient } from "./admin-auth";

export type AdminDashboardData = {
  playersCount: number;
  heroesCount: number;
  acceptedSavesCount: number;
  auditLogsCount: number;
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
    latestSaveAt: summary?.latest_save_at ?? null,
    recentHeroes: recentHeroes ?? [],
    recentSaves: recentSaves ?? [],
  };
}
