import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

export type RankingRow = {
  rank: number;
  steamId: string;
  player: string;
  avatarUrl: string | null;
  hero: string;
  level: number;
  world: number;
  zone: number;
  gear: number;
  lastSaveAt: string | null;
};

type PublicRankingRow = {
  steam_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  hero_name: string | null;
  level: number | null;
  world_level: number | null;
  zone_unlocked: number | null;
  gear_score: number | null;
  last_save_at: string | null;
};

export async function getPublicRankings(): Promise<RankingRow[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) {
    return [];
  }

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    const { data, error } = await supabase
      .from("public_rankings")
      .select("steam_id, display_name, avatar_url, hero_name, level, world_level, zone_unlocked, gear_score, last_save_at")
      .limit(25);

    if (error || !data || data.length === 0) return [];

    return (data as PublicRankingRow[]).map((row, index) => ({
      rank: index + 1,
      steamId: row.steam_id ?? "",
      player: row.display_name ?? "Jugador Steam",
      avatarUrl: row.avatar_url,
      hero: row.hero_name ?? "Heroe sin registrar",
      level: row.level ?? 1,
      world: row.world_level ?? 1,
      zone: row.zone_unlocked ?? 1,
      gear: row.gear_score ?? 0,
      lastSaveAt: row.last_save_at,
    }));
  } catch {
    return [];
  }
}
