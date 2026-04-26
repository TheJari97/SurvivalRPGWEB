import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";
import { rankings as fallbackRankings } from "./mock-data";

export type RankingRow = {
  rank: number;
  player: string;
  hero: string;
  level: number;
  world: number;
  gear: number;
};

type PublicRankingRow = {
  display_name: string | null;
  hero_name: string | null;
  level: number | null;
  world_level: number | null;
  gear_score: number | null;
};

export async function getPublicRankings(): Promise<RankingRow[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) {
    return fallbackRankings;
  }

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    const { data, error } = await supabase
      .from("public_rankings")
      .select("display_name, hero_name, level, world_level, gear_score")
      .limit(25);

    if (error || !data || data.length === 0) return fallbackRankings;

    return (data as PublicRankingRow[]).map((row, index) => ({
      rank: index + 1,
      player: row.display_name ?? "Jugador Steam",
      hero: row.hero_name ?? "Heroe sin registrar",
      level: row.level ?? 1,
      world: row.world_level ?? 1,
      gear: row.gear_score ?? 0,
    }));
  } catch {
    return fallbackRankings;
  }
}
