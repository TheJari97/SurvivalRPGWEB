import { getVercelTeamQuery, parseEnv, vercelFetch } from "./env-utils.mjs";

const env = parseEnv();
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_APP_DOMAIN",
  "STEAM_WEB_API_KEY",
  "SESSION_SECRET",
  "SRPG_SERVER_API_KEY",
  "ADMIN_STEAM_IDS",
  "INITIAL_ADMIN_USERNAME",
  "INITIAL_ADMIN_TEMP_PASSWORD",
  "INITIAL_ADMIN_FORCE_PASSWORD_CHANGE",
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

if (!env.VERCEL_PROJECT_ID) {
  throw new Error("VERCEL_PROJECT_ID is missing");
}

const query = getVercelTeamQuery(env);
const suffix = query.toString() ? `?${query}` : "";
const response = await vercelFetch(env, `/v10/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/env${suffix}`);
console.log(`VERCEL_ENV_STATUS=${response.status}`);

if (!response.ok) {
  console.log((await response.text()).slice(0, 500));
  process.exit(1);
}

const json = await response.json();
const envs = Array.isArray(json) ? json : Array.isArray(json.envs) ? json.envs : [];
let failed = false;

for (const key of required) {
  const matches = envs.filter((item) => item.key === key);

  if (matches.length === 0) {
    console.log(`${key}=MISSING`);
    failed = true;
    continue;
  }

  const targets = [...new Set(matches
    .flatMap((item) => Array.isArray(item.target) ? item.target : [item.target])
    .filter(Boolean))]
    .sort();
  const hasProduction = targets.includes("production");
  const hasPreview = targets.includes("preview");
  console.log(`${key}=SET targets=${targets.join(",")}`);

  if (!hasProduction || !hasPreview) failed = true;
}

process.exitCode = failed ? 1 : 0;
