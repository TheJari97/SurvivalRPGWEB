import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME ?? "SurvivalRPG",
    season: process.env.CURRENT_SEASON_ID ?? "season_001",
  });
}
