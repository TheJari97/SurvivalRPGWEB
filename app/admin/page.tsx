import { redirect } from "next/navigation";
import { adminSections } from "../lib/mock-data";
import { getAdminSession } from "../lib/admin-auth";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/change-password");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Acceso restringido</p>
        <h1>Panel administrador</h1>
        <p className="lead">
          Estructura base para administrar jugadores, progreso, balance, enemigos, items, misiones,
          pagos, sanciones y auditoria. Los cambios de balance quedaran como borrador hasta publicar.
        </p>
        <div className="admin-topline">
          <span>Sesion: {session.username}</span>
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">Salir</button>
          </form>
        </div>
      </section>

      <section className="section admin-layout">
        <aside className="sidebar">
          <div><strong>Menus</strong></div>
          {adminSections.map((section) => <a href={`#${section.toLowerCase()}`} key={section}>{section}</a>)}
        </aside>
        <div className="grid">
          {adminSections.map((section) => (
            <article className="card" id={section.toLowerCase()} key={section}>
              <h3>{section}</h3>
              <p>Modulo preparado para conectar a Supabase, permisos, borradores, auditoria y acciones seguras.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
