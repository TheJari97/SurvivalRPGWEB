import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, writeAdminAuditLog } from "../../../../lib/admin-auth";
import {
  createUserSessionToken,
  fetchSteamProfileSummary,
  getUserSessionCookieOptions,
  verifySteamCallback,
  USER_SESSION_COOKIE,
} from "../../../../lib/steam-auth";

export async function GET(request: NextRequest) {
  const result = await verifySteamCallback(request.nextUrl);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/profile?steam_error=${encodeURIComponent(result.error)}`, request.url));
  }

  const profile = await fetchSteamProfileSummary(result.steamId);
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("players")
    .upsert({
      steam_id: profile.steamId,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      country: profile.country,
      updated_at: now,
    }, { onConflict: "steam_id" });

  await writeAdminAuditLog({
    actorSteamId: profile.steamId,
    actorRole: "player",
    action: "steam_login_success",
    targetType: "players",
    targetId: profile.steamId,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.redirect(new URL("/profile", request.url));
  response.cookies.set(USER_SESSION_COOKIE, createUserSessionToken({
    steamId: profile.steamId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  }), getUserSessionCookieOptions());

  return response;
}
