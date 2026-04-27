import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, STAFF_ROLES, writeAdminAuditLog } from "../../../../lib/admin-auth";
import {
  createUserSessionToken,
  fetchSteamProfileSummary,
  sanitizeLoginNext,
  STEAM_LOGIN_NEXT_COOKIE,
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

  const { data: roleRows } = await supabase
    .from("player_roles")
    .select("role, active")
    .eq("steam_id", profile.steamId)
    .eq("active", true)
    .in("role", STAFF_ROLES);
  const primaryRole = getPrimaryRole((roleRows ?? []).map((row) => String(row.role)));

  await writeAdminAuditLog({
    actorSteamId: profile.steamId,
    actorRole: primaryRole ?? "player",
    action: primaryRole ? "staff_steam_login_success" : "steam_login_success",
    targetType: "players",
    targetId: profile.steamId,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  const cookieNext = request.cookies.get(STEAM_LOGIN_NEXT_COOKIE)?.value ?? null;
  const nextPath = sanitizeLoginNext(cookieNext) ?? "/profile";
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set(USER_SESSION_COOKIE, createUserSessionToken({
    steamId: profile.steamId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  }), getUserSessionCookieOptions());
  response.cookies.delete(STEAM_LOGIN_NEXT_COOKIE);

  return response;
}

function getPrimaryRole(roles: string[]) {
  const priority: Record<string, number> = {
    owner: 4,
    admin: 3,
    moderator: 2,
    support: 1,
  };
  return roles.sort((a, b) => (priority[b] ?? 0) - (priority[a] ?? 0))[0] ?? null;
}
