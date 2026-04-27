import { NextResponse } from "next/server";
import { appConfig } from "../../../../lib/config";
import { buildSteamLoginUrl } from "../../../../lib/steam-auth";

export function GET() {
  if (!appConfig.steamLoginEnabled) {
    return NextResponse.json({ ok: false, error: "Steam login is disabled." }, { status: 503 });
  }

  return NextResponse.redirect(buildSteamLoginUrl());
}
