import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/admin-auth";
import { asRecord, asString, authorizeServerRequest, validateAddonVersion } from "../../../../lib/server-api";

export async function POST(request: NextRequest) {
  const auth = authorizeServerRequest(request);
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  const body = asRecord(payload);
  const steamId = asString(body.steam_id);
  const seasonId = asString(body.season_id, process.env.CURRENT_SEASON_ID ?? "season_001");
  const heroName = asString(body.hero_name || body.active_hero);
  const addonVersion = asString(body.addon_version || request.headers.get("x-srpg-addon-version"));

  if (!steamId) {
    return NextResponse.json({ ok: false, error: "steam_id is required." }, { status: 400 });
  }

  if (!validateAddonVersion(addonVersion)) {
    return NextResponse.json({ ok: false, error: "Addon version is not accepted by this season." }, { status: 426 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("player_heroes")
      .select("steam_id, season_id, hero_name, level, xp, gold, world_level, zone_unlocked, gear_score, skill_points, payload, last_save_at")
      .eq("steam_id", steamId)
      .eq("season_id", seasonId)
      .order("last_save_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (heroName) {
      query = query.eq("hero_name", heroName);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      found: Boolean(data),
      save: data ?? null,
      payload: data?.payload ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Load failed.",
    }, { status: 500 });
  }
}
