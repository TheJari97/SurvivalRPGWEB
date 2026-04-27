import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

export type ContentCatalogEntry = {
  content_type: string;
  content_key: string;
  name_es: string;
  summary_es: string | null;
  category: string | null;
  role: string | null;
  world_min: number;
  world_max: number;
  tier_min: number | null;
  tier_max: number | null;
  payload: Record<string, unknown>;
  version: number;
  updated_at: string | null;
};

export type BalanceChangeLogEntry = {
  version_key: string;
  version_title_es: string;
  version_summary_es: string | null;
  published_at: string | null;
  content_type: string;
  content_key: string;
  change_type: string;
  title_es: string;
  detail_es: string;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  created_at: string;
};

export type SeasonEntry = {
  season_id: string;
  name_es: string;
  name_en: string | null;
  active: boolean;
};

const PUBLIC_GAME_CHANGE_TYPES = new Set([
  "hero",
  "item",
  "recipe",
  "pet",
  "artifact",
  "badge",
  "achievement",
  "season",
  "monster",
  "quest",
  "zone",
  "world_level",
  "ability",
  "npc",
  "terrain",
  "map",
]);

export async function getPublishedContent(contentType?: string): Promise<ContentCatalogEntry[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) return [];

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    let query = supabase
      .from("public_content_catalog")
      .select("content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, version, updated_at")
      .limit(1000);

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as ContentCatalogEntry[];
  } catch {
    return [];
  }
}

export async function getPublishedSeasons(): Promise<SeasonEntry[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) return [];

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    const { data, error } = await supabase
      .from("seasons")
      .select("season_id, name_es, name_en, active")
      .order("season_id", { ascending: false });

    if (error || !data) return [];
    return data as SeasonEntry[];
  } catch {
    return [];
  }
}

export async function getPublishedChangeLog(): Promise<BalanceChangeLogEntry[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) return [];

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    const { data, error } = await supabase
      .from("public_balance_change_log")
      .select("version_key, version_title_es, version_summary_es, published_at, content_type, content_key, change_type, title_es, detail_es, before_value, after_value, created_at")
      .limit(50);

    if (error || !data) return [];
    return (data as BalanceChangeLogEntry[])
      .filter((change) => PUBLIC_GAME_CHANGE_TYPES.has(change.content_type));
  } catch {
    return [];
  }
}

export function getEntryTags(entry: ContentCatalogEntry) {
  const tags = entry.payload.tags;
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

export function getPayloadRecord(entry: ContentCatalogEntry, key: string) {
  const value = entry.payload[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
