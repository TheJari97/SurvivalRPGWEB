import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session?.mustChangePassword) redirect("/admin/change-password");
  if (session) redirect("/admin");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Administracion</p>
        <h1>Acceso interno</h1>
        <p className="lead">
          Ruta privada para administradores. El usuario inicial sera JariAdmin y el primer acceso
          exigira cambiar la contrasena temporal guardada en entorno privado.
        </p>
      </section>

      <section className="section">
        <AdminLoginForm />
      </section>
    </main>
  );
}
