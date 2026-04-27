import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { appConfig } from "./config";

export const USER_SESSION_COOKIE = "srpg_user_session";
export const STEAM_LOGIN_NEXT_COOKIE = "srpg_login_next";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const STEAM_OPENID_LOGIN_URL = "https://steamcommunity.com/openid/login";
const STEAM_OPENID_ENDPOINTS = new Set([
  "https://steamcommunity.com/openid/login",
  "https://steamcommunity.com/openid/",
]);

export type SteamUserSession = {
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
  iat: number;
  exp: number;
};

export type SteamProfileSummary = {
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
};

export function buildSteamLoginUrl() {
  const realm = getSteamRealm();
  const returnTo = getSteamReturnUrl();
  const url = new URL(STEAM_OPENID_LOGIN_URL);

  url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", returnTo);
  url.searchParams.set("openid.realm", realm);
  url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  return url;
}

export async function verifySteamCallback(callbackUrl: URL) {
  const mode = callbackUrl.searchParams.get("openid.mode");
  if (mode !== "id_res") return { ok: false as const, error: "Steam did not approve the login." };

  const opEndpoint = callbackUrl.searchParams.get("openid.op_endpoint") ?? "";
  if (!STEAM_OPENID_ENDPOINTS.has(opEndpoint)) {
    return { ok: false as const, error: "Invalid Steam OpenID endpoint." };
  }

  const returnTo = callbackUrl.searchParams.get("openid.return_to") ?? "";
  if (!isExpectedReturnUrl(returnTo)) {
    return { ok: false as const, error: "Invalid Steam return URL." };
  }

  const claimedId = callbackUrl.searchParams.get("openid.claimed_id") ?? "";
  const identity = callbackUrl.searchParams.get("openid.identity") ?? "";
  const steamId = extractSteamId(claimedId);
  if (!steamId || identity !== claimedId) {
    return { ok: false as const, error: "Invalid Steam claimed identity." };
  }

  const verification = new URLSearchParams();
  for (const [key, value] of callbackUrl.searchParams) {
    if (key.startsWith("openid.")) verification.set(key, value);
  }
  verification.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verification,
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: "Steam OpenID verification failed." };
  }

  const text = await response.text();
  if (!text.includes("is_valid:true")) {
    return { ok: false as const, error: "Steam OpenID signature is not valid." };
  }

  return { ok: true as const, steamId };
}

export async function fetchSteamProfileSummary(steamId: string): Promise<SteamProfileSummary> {
  const apiKey = process.env.STEAM_WEB_API_KEY ?? "";
  if (!apiKey) {
    return { steamId, displayName: `Steam ${steamId.slice(-4)}`, avatarUrl: null, country: null };
  }

  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamId);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Steam profile request failed");
    const json = await response.json() as {
      response?: {
        players?: Array<{
          steamid?: string;
          personaname?: string;
          avatarfull?: string;
          loccountrycode?: string;
        }>;
      };
    };
    const player = json.response?.players?.[0];

    return {
      steamId,
      displayName: player?.personaname ?? `Steam ${steamId.slice(-4)}`,
      avatarUrl: player?.avatarfull ?? null,
      country: player?.loccountrycode ?? null,
    };
  } catch {
    return { steamId, displayName: `Steam ${steamId.slice(-4)}`, avatarUrl: null, country: null };
  }
}

export function createUserSessionToken(input: {
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SteamUserSession = {
    steamId: input.steamId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export async function getSteamUserSession(): Promise<SteamUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyUserSessionToken(token);
}

export function verifyUserSessionToken(token: string): SteamUserSession | null {
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeCompare(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SteamUserSession;
    if (!payload.steamId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUserSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getSteamLoginNextCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function sanitizeLoginNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  return value;
}

function extractSteamId(claimedId: string) {
  const match = /^https?:\/\/steamcommunity\.com\/openid\/id\/([0-9]{17,25})$/.exec(claimedId);
  return match?.[1] ?? null;
}

function getSteamRealm() {
  return process.env.STEAM_OPENID_REALM || appConfig.siteUrl;
}

function getSteamReturnUrl() {
  return process.env.STEAM_OPENID_RETURN_URL || `${appConfig.siteUrl}/api/auth/steam/callback`;
}

function isExpectedReturnUrl(returnTo: string) {
  try {
    const actual = new URL(returnTo);
    const expected = new URL(getSteamReturnUrl());
    return actual.origin === expected.origin && actual.pathname === expected.pathname;
  } catch {
    return false;
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
