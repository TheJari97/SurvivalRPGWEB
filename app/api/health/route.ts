import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME ?? "SurvivalRPG",
    season: process.env.CURRENT_SEASON_ID ?? "season_001",
    steam_login_enabled: process.env.NEXT_PUBLIC_STEAM_LOGIN_ENABLED === "true",
    save_addon_version: process.env.SRPG_SAVE_ALLOWED_ADDON_VERSION ?? null,
  });
}
