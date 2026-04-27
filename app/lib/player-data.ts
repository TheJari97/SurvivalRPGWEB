import { getSupabaseAdminClient } from "./admin-auth";

export type PlayerProfileData = {
  player: {
    steam_id: string;
    display_name: string | null;
    avatar_url: string | null;
    country: string | null;
    updated_at: string | null;
  } | null;
  heroes: Array<{
    hero_name: string;
    level: number;
    xp: number;
    gold: number;
    world_level: number;
    zone_unlocked: number;
    gear_score: number;
    skill_points: number;
    last_save_at: string | null;
  }>;
  cosmeticsCount: number;
};

export async function getPlayerProfileData(steamId: string): Promise<PlayerProfileData> {
  const supabase = getSupabaseAdminClient();
  const [{ data: player }, { data: heroes }, { count: cosmeticsCount }] = await Promise.all([
    supabase
      .from("players")
      .select("steam_id, display_name, avatar_url, country, updated_at")
      .eq("steam_id", steamId)
      .maybeSingle(),
    supabase
      .from("player_heroes")
      .select("hero_name, level, xp, gold, world_level, zone_unlocked, gear_score, skill_points, last_save_at")
      .eq("steam_id", steamId)
      .order("world_level", { ascending: false })
      .order("level", { ascending: false }),
    supabase
      .from("account_cosmetics")
      .select("id", { count: "exact", head: true })
      .eq("steam_id", steamId),
  ]);

  return {
    player: player ?? null,
    heroes: heroes ?? [],
    cosmeticsCount: cosmeticsCount ?? 0,
  };
}
