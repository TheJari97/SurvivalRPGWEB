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

export async function getPublishedContent(contentType?: string): Promise<ContentCatalogEntry[]> {
  if (!appConfig.supabaseUrl || !appConfig.supabasePublishableKey) return [];

  try {
    const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey);
    let query = supabase
      .from("public_content_catalog")
      .select("content_type, content_key, name_es, summary_es, category, role, world_min, world_max, tier_min, tier_max, payload, version, updated_at")
      .limit(100);

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

export function getEntryTags(entry: ContentCatalogEntry) {
  const tags = entry.payload.tags;
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string")
    : [];
}
