import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

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
  "ADMIN_STEAM_IDS",
  "INITIAL_ADMIN_USERNAME",
  "INITIAL_ADMIN_TEMP_PASSWORD",
  "INITIAL_ADMIN_FORCE_PASSWORD_CHANGE",
];

let failed = false;
for (const key of required) {
  const value = env[key] ?? "";
  const status = !value
    ? "EMPTY"
    : /PON_AQUI|replace_me|ROTAR/i.test(value)
      ? "PLACEHOLDER"
      : "SET";
  console.log(`${key}=${status}`);
  if (status !== "SET") failed = true;
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
