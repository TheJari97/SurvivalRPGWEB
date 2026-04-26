import { adminSections } from "../lib/mock-data";

export default function AdminPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Acceso restringido</p>
        <h1>Panel administrador</h1>
        <p className="lead">
          Estructura base para administrar jugadores, progreso, balance, enemigos, items, misiones,
          pagos, sanciones y auditoria. Los cambios de balance quedaran como borrador hasta publicar.
        </p>
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
