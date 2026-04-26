import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  AdminAccount,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  getSupabaseAdminClient,
  hashPassword,
  verifyPassword,
  writeAdminAuditLog,
} from "../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  const meta = getRequestMeta(request);

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "Usuario y contrasena son obligatorios." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, steam_id, username, password_hash, must_change_password, active")
      .eq("username", username)
      .maybeSingle();

    const account = data as AdminAccount | null;
    if (error || !account || !account.active) {
      await writeAdminAuditLog({
        action: "admin_login_failed",
        targetType: "admin_accounts",
        targetId: username,
        ...meta,
      });
      return NextResponse.json({ ok: false, error: "Credenciales invalidas." }, { status: 401 });
    }

    let passwordOk = verifyPassword(password, account.password_hash);
    if (!account.password_hash) {
      passwordOk = username === process.env.INITIAL_ADMIN_USERNAME && password === process.env.INITIAL_ADMIN_TEMP_PASSWORD;
      if (passwordOk) {
        const passwordHash = hashPassword(password);
        const { error: updateError } = await supabase
          .from("admin_accounts")
          .update({ password_hash: passwordHash, must_change_password: true })
          .eq("id", account.id);

        if (updateError) throw updateError;
        account.password_hash = passwordHash;
        account.must_change_password = true;
      }
    }

    if (!passwordOk) {
      await writeAdminAuditLog({
        action: "admin_login_failed",
        actorSteamId: account.steam_id,
        targetType: "admin_accounts",
        targetId: account.id,
        ...meta,
      });
      return NextResponse.json({ ok: false, error: "Credenciales invalidas." }, { status: 401 });
    }

    await writeAdminAuditLog({
      action: "admin_login_success",
      actorSteamId: account.steam_id,
      targetType: "admin_accounts",
      targetId: account.id,
      ...meta,
    });

    const response = NextResponse.json({
      ok: true,
      mustChangePassword: account.must_change_password,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(account), getAdminSessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo validar el acceso admin." }, { status: 500 });
  }
}

function getRequestMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}
