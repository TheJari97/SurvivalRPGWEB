import { getVercelTeamQuery, parseEnv, vercelFetch } from "./env-utils.mjs";

const env = parseEnv();
const value = env.DATABASE_POOLER_URL || env.DATABASE_URL;

if (!env.VERCEL_PROJECT_ID) {
  throw new Error("VERCEL_PROJECT_ID is missing");
}

if (!value || /replace_me|PON_AQUI|YOUR-PASSWORD/i.test(value)) {
  throw new Error("DATABASE_POOLER_URL or DATABASE_URL is missing or placeholder");
}

const databaseUrl = new URL(value);
if (!databaseUrl.hostname.includes("pooler.supabase.com")) {
  throw new Error(`DATABASE_URL must use Supabase Pooler. Current host: ${databaseUrl.hostname}`);
}

const query = getVercelTeamQuery(env);
const suffix = query.toString() ? `?${query}` : "";
const listResponse = await vercelFetch(env, `/v10/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/env${suffix}`);
console.log(`VERCEL_ENV_LIST_STATUS=${listResponse.status}`);

if (!listResponse.ok) {
  console.log((await listResponse.text()).slice(0, 500));
  process.exit(1);
}

const json = await listResponse.json();
const envs = Array.isArray(json) ? json : Array.isArray(json.envs) ? json.envs : [];
const databaseEnv = envs.find((item) => item.key === "DATABASE_URL");

if (!databaseEnv) {
  throw new Error("DATABASE_URL was not found in Vercel project envs");
}

const requestBody = {
  target: ["production", "preview"],
  type: databaseEnv.type === "sensitive" ? "sensitive" : "encrypted",
  value,
  comment: "Supabase Shared Pooler connection string for SurvivalRPG",
};

if (databaseEnv.type !== "sensitive") {
  requestBody.key = "DATABASE_URL";
}

const patchResponse = await vercelFetch(env, `/v9/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/env/${encodeURIComponent(databaseEnv.id)}${suffix}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
});
console.log(`VERCEL_DATABASE_URL_PATCH_STATUS=${patchResponse.status}`);

if (!patchResponse.ok) {
  console.log((await patchResponse.text()).slice(0, 500));
  process.exit(1);
}

console.log(`VERCEL_DATABASE_URL_UPDATED=YES host=${databaseUrl.hostname} port=${databaseUrl.port || "(default)"}`);
