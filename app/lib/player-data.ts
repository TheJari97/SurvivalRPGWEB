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

export type PublicPlayerProfileData = {
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
    world_level: number;
    zone_unlocked: number;
    gear_score: number;
    skill_points: number;
    last_save_at: string | null;
  }>;
  cosmeticsCount: number;
};

export type PlayerHeroDetail = {
  steam_id: string;
  season_id: string;
  hero_name: string;
  level: number;
  xp: number;
  gold: number;
  world_level: number;
  zone_unlocked: number;
  gear_score: number;
  skill_points: number;
  payload: Record<string, unknown>;
  last_save_at: string | null;
} | null;

export type PublicPlayerHeroDetail = {
  steam_id: string;
  season_id: string;
  hero_name: string;
  level: number;
  world_level: number;
  zone_unlocked: number;
  gear_score: number;
  skill_points: number;
  payload: Record<string, unknown>;
  last_save_at: string | null;
} | null;

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

export async function getPublicPlayerProfileData(steamId: string): Promise<PublicPlayerProfileData> {
  const supabase = getSupabaseAdminClient();
  const [{ data: player }, { data: heroes }, { count: cosmeticsCount }] = await Promise.all([
    supabase
      .from("players")
      .select("steam_id, display_name, avatar_url, country, updated_at")
      .eq("steam_id", steamId)
      .maybeSingle(),
    supabase
      .from("player_heroes")
      .select("hero_name, level, world_level, zone_unlocked, gear_score, skill_points, last_save_at")
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

export async function getPlayerHeroDetail(steamId: string, heroName: string): Promise<PlayerHeroDetail> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("player_heroes")
    .select("steam_id, season_id, hero_name, level, xp, gold, world_level, zone_unlocked, gear_score, skill_points, payload, last_save_at")
    .eq("steam_id", steamId)
    .eq("hero_name", heroName)
    .maybeSingle();

  return data as PlayerHeroDetail;
}

export async function getPublicPlayerHeroDetail(steamId: string, heroName: string): Promise<PublicPlayerHeroDetail> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("player_heroes")
    .select("steam_id, season_id, hero_name, level, world_level, zone_unlocked, gear_score, skill_points, payload, last_save_at")
    .eq("steam_id", steamId)
    .eq("hero_name", heroName)
    .maybeSingle();

  return data as PublicPlayerHeroDetail;
}

export function getHeroPayloadSection(hero: PlayerHeroDetail, key: "inventory" | "artifacts" | "pets" | "quests") {
  if (!hero) return null;
  return getHeroPayloadSectionFromPayload(hero.payload, hero.hero_name, key);
}

export function getHeroPayloadSectionFromPayload(
  payload: Record<string, unknown> | null | undefined,
  heroName: string,
  key: "inventory" | "artifacts" | "pets" | "quests",
) {
  if (!payload || typeof payload !== "object") return null;
  const heroes = asRecord(payload.heroes);
  const heroPayload = asRecord(heroes[heroName]);
  return heroPayload[key] ?? null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
