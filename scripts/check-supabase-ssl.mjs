import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";

const root = process.cwd();

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

const env = parseEnv(path.join(root, ".env.local"));
const host = env.DATABASE_HOST;
const port = Number(env.DATABASE_PORT ?? "5432");
const caPath = path.resolve(root, env.SUPABASE_DB_SSL_CA_PATH ?? "certs/supabase/prod-ca-2021.crt");

if (!host) throw new Error("DATABASE_HOST is missing");
if (!fs.existsSync(caPath)) throw new Error(`CA certificate not found: ${caPath}`);

const ca = fs.readFileSync(caPath);

await new Promise((resolve, reject) => {
  const socket = net.connect({ host, port });
  const timeout = setTimeout(() => {
    socket.destroy();
    reject(new Error("Timed out connecting to Supabase Postgres"));
  }, 10000);

  socket.once("error", reject);
  socket.once("connect", () => {
    const request = Buffer.alloc(8);
    request.writeInt32BE(8, 0);
    request.writeInt32BE(80877103, 4);
    socket.write(request);
  });

  socket.once("data", (chunk) => {
    if (chunk[0] !== 0x53) {
      clearTimeout(timeout);
      socket.destroy();
      reject(new Error("Supabase Postgres did not accept SSL negotiation"));
      return;
    }

    const secure = tls.connect({
      socket,
      servername: host,
      ca,
      rejectUnauthorized: true,
    });

    secure.once("secureConnect", () => {
      clearTimeout(timeout);
      const cert = secure.getPeerCertificate();
      console.log(`SSL_OK host=${host} issuer=${cert.issuer?.O ?? "unknown"}`);
      secure.end();
      resolve();
    });
    secure.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
});
