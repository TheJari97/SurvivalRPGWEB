import fs from "node:fs";
import path from "node:path";
import { parseEnv, valueStatus } from "./env-utils.mjs";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

const env = parseEnv(envPath);
const required = [
  "NEXT_PUBLIC_APP_DOMAIN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_NAME",
  "DATABASE_URL",
  "SUPABASE_DB_SSL_CA_PATH",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STEAM_WEB_API_KEY",
  "SESSION_SECRET",
  "SRPG_SERVER_API_KEY",
  "SRPG_ALLOW_LOCAL_TOOLS_SAVE",
  "SRPG_LOCAL_SAVE_ALLOWED_STEAM_IDS",
  "ADMIN_STEAM_IDS",
];

const optional = [
  "DATABASE_POOLER_URL",
  "VERCEL_TOKEN",
  "VERCEL_PROJECT_ID",
  "VERCEL_TEAM_ID",
  "VERCEL_ORG_ID",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_ZONE_ID",
  "CLOUDFLARE_API_TOKEN",
];

let failed = false;
for (const key of required) {
  const value = env[key] ?? "";
  const status = valueStatus(value);
  console.log(`${key}=${status}`);
  if (status !== "SET") failed = true;
}

for (const key of optional) {
  const value = env[key] ?? "";
  const status = valueStatus(value);
  console.log(`${key}=${status}`);
}

if (env.SUPABASE_DB_PASSWORD_RAW && env.SUPABASE_DB_PASSWORD_URL_ENCODED) {
  const encoded = encodeURIComponent(env.SUPABASE_DB_PASSWORD_RAW);
  console.log(`SUPABASE_DB_PASSWORD_URL_ENCODED=${encoded === env.SUPABASE_DB_PASSWORD_URL_ENCODED ? "MATCH" : "MISMATCH"}`);
}

if (env.SUPABASE_DB_SSL_CA_PATH) {
  const caPath = path.resolve(root, env.SUPABASE_DB_SSL_CA_PATH);
  console.log(`SUPABASE_DB_SSL_CA_PATH_EXISTS=${fs.existsSync(caPath) ? "YES" : "NO"}`);
}

process.exitCode = failed ? 1 : 0;
