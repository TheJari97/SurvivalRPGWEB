import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "../../../../lib/config";
import {
  buildSteamLoginUrl,
  getSteamLoginNextCookieOptions,
  sanitizeLoginNext,
  STEAM_LOGIN_NEXT_COOKIE,
} from "../../../../lib/steam-auth";

export function GET(request: NextRequest) {
  if (!appConfig.steamLoginEnabled) {
    return NextResponse.json({ ok: false, error: "Steam login is disabled." }, { status: 503 });
  }

  const response = NextResponse.redirect(buildSteamLoginUrl());
  const next = sanitizeLoginNext(request.nextUrl.searchParams.get("next"));
  if (next) {
    response.cookies.set(STEAM_LOGIN_NEXT_COOKIE, next, getSteamLoginNextCookieOptions());
  }
  return response;
}
