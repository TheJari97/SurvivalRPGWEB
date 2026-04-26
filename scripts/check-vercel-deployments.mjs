import { getVercelTeamQuery, parseEnv, vercelFetch } from "./env-utils.mjs";

const env = parseEnv();
if (!env.VERCEL_PROJECT_ID) {
  throw new Error("VERCEL_PROJECT_ID is missing");
}

const query = getVercelTeamQuery(env);
query.set("projectId", env.VERCEL_PROJECT_ID);
query.set("limit", "5");

const response = await vercelFetch(env, `/v6/deployments?${query}`);
console.log(`VERCEL_DEPLOYMENTS_STATUS=${response.status}`);

if (!response.ok) {
  console.log((await response.text()).slice(0, 500));
  process.exit(1);
}

const json = await response.json();
for (const deployment of json.deployments ?? []) {
  const meta = deployment.meta ?? {};
  console.log(`${deployment.uid} state=${deployment.state} target=${deployment.target ?? ""} branch=${meta.githubCommitRef ?? ""} commit=${(meta.githubCommitSha ?? "").slice(0, 7)} url=${deployment.url}`);
}
