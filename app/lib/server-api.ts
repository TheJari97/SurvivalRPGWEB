import { NextRequest, NextResponse } from "next/server";

export function authorizeServerRequest(request: NextRequest) {
  const expected = process.env.SRPG_SERVER_API_KEY ?? "";
  const received = request.headers.get("x-srpg-server-key") ?? "";

  if (expected && received && received === expected) {
    return { ok: true as const, mode: "shared-key" };
  }

  if (
    process.env.SRPG_ALLOW_LOCAL_TOOLS_SAVE === "true" &&
    received === "Unavailable_LocalTools"
  ) {
    return { ok: true as const, mode: "local-tools" };
  }

  return { ok: false as const, response: NextResponse.json({ ok: false, error: "Unauthorized save request." }, { status: 401 }) };
}

export function getRequestMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
    addonVersion: request.headers.get("x-srpg-addon-version"),
  };
}

export function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getSteamDisplayName(steamId: string) {
  if (steamId.length <= 4) return `Steam ${steamId}`;
  return `Steam ${steamId.slice(-4)}`;
}

export function validateAddonVersion(addonVersion: string | null) {
  const allowed = process.env.SRPG_SAVE_ALLOWED_ADDON_VERSION ?? "";
  if (!allowed || !addonVersion) return true;
  return addonVersion === allowed;
}
