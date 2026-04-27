import { NextResponse } from "next/server";
import { getAdminSession, getSupabaseAdminClient, writeAdminAuditLog } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesion admin requerida." }, { status: 401 });
  }

  const form = await request.formData();
  const accountId = String(form.get("accountId") ?? "").trim();

  if (!accountId) {
    return NextResponse.json({ ok: false, error: "accountId requerido." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error: insertError } = await supabase
    .from("admin_password_reset_requests")
    .insert({
      admin_account_id: accountId,
      requested_by_admin_id: session.adminId,
      reason: "requested_from_admin_panel",
    });

  if (insertError) {
    return NextResponse.json({ ok: false, error: "No se pudo crear el reset." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("admin_accounts")
    .update({ must_change_password: true })
    .eq("id", accountId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: "Reset creado, pero no se pudo marcar cambio obligatorio." }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorSteamId: session.steamId,
    actorRole: "admin",
    action: "admin_password_reset_requested",
    targetType: "admin_accounts",
    targetId: accountId,
    afterValue: { must_change_password: true },
  });

  return NextResponse.redirect(new URL("/admin/accounts", request.url));
}
