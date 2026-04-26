import { getVercelTeamQuery, parseEnv, vercelFetch } from "./env-utils.mjs";

const deploymentId = process.argv[2];
if (!deploymentId) {
  throw new Error("Usage: node scripts/get-vercel-deployment-events.mjs <deployment-id>");
}

const env = parseEnv();
const query = getVercelTeamQuery(env);
query.set("limit", "100");

const response = await vercelFetch(env, `/v3/deployments/${encodeURIComponent(deploymentId)}/events?${query}`);
console.log(`VERCEL_EVENTS_STATUS=${response.status}`);

const text = await response.text();
if (!response.ok) {
  console.log(text.slice(0, 1000));
  process.exit(1);
}

for (const line of text.split(/\r?\n/).filter(Boolean).slice(-80)) {
  try {
    const item = JSON.parse(line);
    const payload = item.payload ?? item;
    const date = payload.date ? new Date(payload.date).toISOString() : "";
    const type = payload.type ?? item.type ?? "";
    const message = payload.text ?? payload.message ?? payload.info?.name ?? JSON.stringify(payload);
    console.log(`${date} ${type} ${String(message).slice(0, 500)}`);
  } catch {
    console.log(line.slice(0, 500));
  }
}
