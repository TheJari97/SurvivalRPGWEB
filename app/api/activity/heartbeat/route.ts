import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/admin-auth";
import { getSteamUserSession } from "../../../lib/steam-auth";

export async function POST(request: NextRequest) {
  const session = await getSteamUserSession();
  if (!session) return NextResponse.json({ ok: true, authenticated: false });

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  let path: string | null = null;

  try {
    const body = await request.json();
    path = typeof body?.path === "string" ? body.path.slice(0, 240) : null;
  } catch {
    path = null;
  }

  await supabase.from("players").upsert({
    steam_id: session.steamId,
    display_name: session.displayName,
    avatar_url: session.avatarUrl,
    updated_at: now,
  }, { onConflict: "steam_id" });

  await supabase.from("player_activity_sessions").upsert({
    steam_id: session.steamId,
    source: "web",
    display_name: session.displayName,
    avatar_url: session.avatarUrl,
    path,
    last_seen_at: now,
  }, { onConflict: "steam_id,source" });

  return NextResponse.json({ ok: true, authenticated: true });
}
