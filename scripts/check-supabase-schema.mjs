import { parseEnv } from "./env-utils.mjs";

const env = parseEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
}

const checks = [
  ["seasons", "season_id,name_es,active"],
  ["players", "steam_id,display_name"],
  ["player_roles", "steam_id,role,active"],
  ["admin_staff_profiles", "steam_id,display_name,avatar_url,role,roles,active,permissions"],
  ["admin_role_permissions", "role,permission"],
  ["public_rankings", "steam_id,display_name,hero_name,level,world_level,gear_score"],
  ["game_save_events", "steam_id,hero_name,status"],
  ["admin_dashboard_summary", "players_count,heroes_count,accepted_saves_count,active_players_count"],
  ["game_content_catalog", "content_type,content_key,status"],
  ["public_content_catalog", "content_type,content_key,name_es"],
  ["game_balance_versions", "version_key,status"],
  ["public_balance_change_log", "version_key,content_key,change_type"],
  ["badge_definitions", "badge_key,name_es,category,rarity,active"],
  ["player_badges", "steam_id,badge_key,season_id,awarded_at"],
  ["achievement_definitions", "achievement_key,name_es,category,points,active"],
  ["player_achievements", "steam_id,achievement_key,season_id,completed"],
];

let failed = false;
for (const [table, select] of checks) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", "3");

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    failed = true;
    console.log(`${table}=ERROR status=${response.status}`);
    continue;
  }

  const rows = await response.json();
  console.log(`${table}=OK rows=${Array.isArray(rows) ? rows.length : 0}`);
}

process.exitCode = failed ? 1 : 0;
