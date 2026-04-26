import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AdminChangePasswordPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Administracion</p>
        <h1>Cambio obligatorio</h1>
        <p className="lead">
          Antes de entrar al panel debes reemplazar la contrasena temporal por una contrasena segura.
        </p>
      </section>

      <section className="section">
        <ChangePasswordForm />
      </section>
    </main>
  );
}
