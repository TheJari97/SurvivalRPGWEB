import { parseEnv, valueStatus } from "./env-utils.mjs";

const env = parseEnv();
const candidates = ["DATABASE_URL", "DATABASE_POOLER_URL"];
let failed = false;

for (const key of candidates) {
  const value = env[key] ?? "";
  const status = valueStatus(value);

  if (status !== "SET") {
    console.log(`${key}=${status}`);
    if (key === "DATABASE_POOLER_URL") failed = true;
    continue;
  }

  try {
    const url = new URL(value);
    const isDirect = url.hostname.startsWith("db.") && url.hostname.endsWith(".supabase.co");
    const isPooler = url.hostname.includes("pooler.supabase.com") || url.port === "6543";
    console.log(`${key}=SET host=${url.hostname} port=${url.port || "(default)"} kind=${isPooler ? "POOLER" : isDirect ? "DIRECT" : "UNKNOWN"}`);

    if (key === "DATABASE_POOLER_URL" && !isPooler) {
      console.log("DATABASE_POOLER_URL_NEEDS_TRANSACTION_POOLER=YES");
      failed = true;
    }
  } catch {
    console.log(`${key}=INVALID_URL`);
    failed = true;
  }
}

process.exitCode = failed ? 1 : 0;
