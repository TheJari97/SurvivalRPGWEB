import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  AdminAccount,
  createAdminSessionToken,
  getAdminSession,
  getAdminSessionCookieOptions,
  getSupabaseAdminClient,
  hashPassword,
  validateAdminPassword,
  verifyPassword,
  writeAdminAuditLog,
} from "../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesion admin requerida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ ok: false, error: "Completa todos los campos." }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ ok: false, error: "La nueva contrasena no coincide." }, { status: 400 });
  }

  const validation = validateAdminPassword(newPassword);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.errors.join(" ") }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, steam_id, username, password_hash, must_change_password, active")
      .eq("id", session.adminId)
      .maybeSingle();

    const account = data as AdminAccount | null;
    if (error || !account || !account.active) {
      return NextResponse.json({ ok: false, error: "Cuenta admin no disponible." }, { status: 401 });
    }

    if (!verifyPassword(currentPassword, account.password_hash)) {
      await writeAdminAuditLog({
        action: "admin_change_password_failed",
        actorSteamId: account.steam_id,
        targetType: "admin_accounts",
        targetId: account.id,
      });
      return NextResponse.json({ ok: false, error: "Contrasena actual incorrecta." }, { status: 401 });
    }

    const passwordHash = hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from("admin_accounts")
      .update({
        password_hash: passwordHash,
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    if (updateError) throw updateError;

    const updatedAccount: AdminAccount = {
      ...account,
      password_hash: passwordHash,
      must_change_password: false,
    };

    await writeAdminAuditLog({
      action: "admin_change_password_success",
      actorSteamId: account.steam_id,
      targetType: "admin_accounts",
      targetId: account.id,
      afterValue: { must_change_password: false },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(updatedAccount), getAdminSessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cambiar la contrasena." }, { status: 500 });
  }
}
