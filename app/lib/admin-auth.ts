import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

export const ADMIN_SESSION_COOKIE = "srpg_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminAccount = {
  id: string;
  steam_id: string | null;
  username: string;
  password_hash: string | null;
  must_change_password: boolean;
  active: boolean;
};

export type AdminSession = {
  adminId: string;
  steamId: string | null;
  username: string;
  mustChangePassword: boolean;
  iat: number;
  exp: number;
};

export type PasswordValidation = {
  ok: boolean;
  errors: string[];
};

export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!appConfig.supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured");
  }

  return createClient(appConfig.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [method, salt, expectedHash] = storedHash.split(":");
  if (method !== "scrypt" || !salt || !expectedHash) return false;

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function validateAdminPassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 12) errors.push("Debe tener minimo 12 caracteres.");
  if (!/[a-z]/.test(password)) errors.push("Debe incluir una letra minuscula.");
  if (!/[A-Z]/.test(password)) errors.push("Debe incluir una letra mayuscula.");
  if (!/[0-9]/.test(password)) errors.push("Debe incluir un numero.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Debe incluir un simbolo.");

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function createAdminSessionToken(account: AdminAccount) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSession = {
    adminId: account.id,
    steamId: account.steam_id,
    username: account.username,
    mustChangePassword: account.must_change_password,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export function verifyAdminSessionToken(token: string): AdminSession | null {
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeCompare(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSession;
    if (!payload.adminId || !payload.username || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function writeAdminAuditLog(input: {
  actorSteamId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
}) {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("audit_logs").insert({
      actor_steam_id: input.actorSteamId ?? null,
      actor_role: input.actorRole ?? "admin",
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      before_value: input.beforeValue ?? null,
      after_value: input.afterValue ?? null,
    });
  } catch {
    // Audit failures must not block login or password changes.
  }
}

function sign(body: string) {
  const secret = process.env.SESSION_SECRET ?? "";
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
