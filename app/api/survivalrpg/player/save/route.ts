import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, writeAdminAuditLog } from "../../../../lib/admin-auth";
import { asRecord, asString, authorizeServerRequest, clampInt, getRequestMeta, getSteamDisplayName, isLocalToolsSteamIdAllowed, validateAddonVersion } from "../../../../lib/server-api";

export async function POST(request: NextRequest) {
  const auth = authorizeServerRequest(request);
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  const body = asRecord(payload);
  const steamId = asString(body.steam_id);
  const seasonId = asString(body.season_id, process.env.CURRENT_SEASON_ID ?? "season_001");
  const activeHero = asString(body.active_hero, "unknown");

  if (!steamId || activeHero === "unknown") {
    return NextResponse.json({ ok: false, error: "steam_id and active_hero are required." }, { status: 400 });
  }

  if (auth.mode === "local-tools" && !isLocalToolsSteamIdAllowed(steamId)) {
    return NextResponse.json({ ok: false, error: "SteamID is not allowed for local tools saves." }, { status: 403 });
  }

  if (clampInt(body.schema_version, 0, 999, 0) !== 2) {
    return NextResponse.json({ ok: false, error: "Unsupported save schema_version." }, { status: 400 });
  }

  const heroes = asRecord(body.heroes);
  const heroData = asRecord(heroes[activeHero]) || {};
  const progress = asRecord(heroData.progress);
  const world = asRecord(body.world_level);
  const zones = asRecord(body.zones);
  const meta = getRequestMeta(request);

  const level = clampInt(progress.level, 1, 100, 1);
  const xp = clampInt(progress.xp, 0, 2147483647, 0);
  const gold = clampInt(heroData.gold, 0, 2147483647, 0);
  const worldLevel = clampInt(world.current, 1, 10, 1);
  const zoneUnlocked = clampInt(zones.current, 1, 10, 1);
  const gearScore = clampInt(progress.gear_score, 0, 2147483647, 0);
  const skillPoints = clampInt(progress.skill_points, 0, 1000, 0);
  const addonVersion = asString(body.addon_version, meta.addonVersion ?? "");
  const matchId = asString(body.match_id);

  if (!validateAddonVersion(addonVersion)) {
    return NextResponse.json({ ok: false, error: "Addon version is not accepted by this season." }, { status: 426 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error: playerError } = await supabase
      .from("players")
      .upsert({
        steam_id: steamId,
        display_name: getSteamDisplayName(steamId),
        updated_at: now,
      }, { onConflict: "steam_id" });

    if (playerError) throw playerError;

    const { data: heroRow, error: heroError } = await supabase
      .from("player_heroes")
      .upsert({
        steam_id: steamId,
        season_id: seasonId,
        hero_name: activeHero,
        level,
        xp,
        gold,
        world_level: worldLevel,
        zone_unlocked: zoneUnlocked,
        gear_score: gearScore,
        skill_points: skillPoints,
        payload: body,
        last_save_at: now,
      }, { onConflict: "steam_id,season_id,hero_name" })
      .select("id")
      .single();

    if (heroError) throw heroError;

    const { error: eventError } = await supabase.from("game_save_events").insert({
      steam_id: steamId,
      player_hero_id: heroRow?.id ?? null,
      season_id: seasonId,
      hero_name: activeHero,
      addon_version: addonVersion,
      match_id: matchId,
      source: auth.mode,
      status: "accepted",
      payload: body,
    });

    if (eventError) throw eventError;

    await writeAdminAuditLog({
      actorSteamId: steamId,
      actorRole: "dota_server",
      action: "dota_save_progress",
      targetType: "player_heroes",
      targetId: heroRow?.id ?? `${steamId}:${activeHero}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      afterValue: { season_id: seasonId, hero_name: activeHero, level, world_level: worldLevel, gear_score: gearScore },
    });

    return NextResponse.json({
      ok: true,
      saved: {
        steam_id: steamId,
        season_id: seasonId,
        hero_name: activeHero,
        level,
        world_level: worldLevel,
        gear_score: gearScore,
        last_save_at: now,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Save failed.",
    }, { status: 500 });
  }
}
