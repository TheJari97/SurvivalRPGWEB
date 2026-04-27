import { getVercelTeamQuery, parseEnv, vercelFetch } from "./env-utils.mjs";

const env = parseEnv();
const pairs = process.argv.slice(2);

if (!env.VERCEL_PROJECT_ID) {
  throw new Error("VERCEL_PROJECT_ID is missing");
}

if (pairs.length === 0) {
  throw new Error("Usage: node scripts/update-vercel-env.mjs KEY=value KEY2=value2");
}

const updates = pairs.map((pair) => {
  const index = pair.indexOf("=");
  if (index <= 0) throw new Error(`Invalid env pair: ${pair}`);
  return {
    key: pair.slice(0, index),
    value: pair.slice(index + 1),
  };
});

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

for (const update of updates) {
  const existing = envs.find((item) => item.key === update.key);
  const target = ["production", "preview"];
  const type = existing?.type === "sensitive" ? "sensitive" : "encrypted";

  if (existing) {
    const body = { target, type, value: update.value };
    if (existing.type !== "sensitive") body.key = update.key;

    const response = await vercelFetch(env, `/v9/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/env/${encodeURIComponent(existing.id)}${suffix}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`${update.key}=PATCH status=${response.status}`);
    if (!response.ok) {
      console.log((await response.text()).slice(0, 500));
      process.exitCode = 1;
    }
    continue;
  }

  const response = await vercelFetch(env, `/v10/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/env${suffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: update.key,
      value: update.value,
      type,
      target,
    }),
  });
  console.log(`${update.key}=CREATE status=${response.status}`);
  if (!response.ok) {
    console.log((await response.text()).slice(0, 500));
    process.exitCode = 1;
  }
}
