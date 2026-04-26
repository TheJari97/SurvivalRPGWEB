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
  ["admin_accounts", "username,active,must_change_password"],
  ["admin_role_permissions", "role,permission"],
  ["public_rankings", "display_name,hero_name,level,world_level,gear_score"],
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
