import fs from "node:fs";

export function parseEnv(filePath = ".env.local") {
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

export function valueStatus(value) {
  if (!value) return "EMPTY";
  if (/PON_AQUI|replace_me|ROTAR|YOUR-PASSWORD/i.test(value)) return "PLACEHOLDER";
  return "SET";
}

export function getVercelTeamQuery(env) {
  const params = new URLSearchParams();
  if (env.VERCEL_TEAM_ID) params.set("teamId", env.VERCEL_TEAM_ID);
  return params;
}

export async function vercelFetch(env, path, init = {}) {
  if (!env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is missing");
  }

  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.VERCEL_TOKEN}`,
      ...(init.headers ?? {}),
    },
  });

  return response;
}
