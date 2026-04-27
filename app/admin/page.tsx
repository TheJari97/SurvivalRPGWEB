import { redirect } from "next/navigation";
import Link from "next/link";
import { adminSections } from "../lib/mock-data";
import { getAdminSession } from "../lib/admin-auth";
import { getAdminDashboardData } from "../lib/admin-data";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/change-password");
  const dashboard = await getAdminDashboardData();

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

      <section className="section">
        <h2>Estado real</h2>
        <div className="stat-grid dashboard-stats">
          <div className="stat">
            <strong>{dashboard.playersCount}</strong>
            <span>Jugadores</span>
          </div>
          <div className="stat">
            <strong>{dashboard.heroesCount}</strong>
            <span>Personajes</span>
          </div>
          <div className="stat">
            <strong>{dashboard.acceptedSavesCount}</strong>
            <span>Guardados aceptados</span>
          </div>
          <div className="stat">
            <strong>{dashboard.auditLogsCount}</strong>
            <span>Eventos de auditoria</span>
          </div>
          <div className="stat">
            <strong>{dashboard.publishedContentCount}</strong>
            <span>Catalogo publicado</span>
          </div>
        </div>
      </section>

      <section className="section admin-layout">
        <aside className="sidebar">
          <div><strong>Menus</strong></div>
          {adminSections.map((section) => {
            const href = getSectionHref(section);
            return href.startsWith("#")
              ? <a href={href} key={section}>{section}</a>
              : <Link href={href} key={section}>{section}</Link>;
          })}
        </aside>
        <div className="grid">
          {adminSections.map((section) => (
            <article className="card" id={section.toLowerCase()} key={section}>
              <h3>{section}</h3>
              <p>{getSectionText(section)}</p>
              {getSectionHref(section).startsWith("/") ? (
                <div className="actions compact-actions">
                  <Link className="button secondary" href={getSectionHref(section)}>Abrir</Link>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Ultimos personajes</h2>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>SteamID</th>
                <th>Heroe</th>
                <th>Nivel</th>
                <th>Mundo</th>
                <th>Gear</th>
                <th>Ultimo guardado</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentHeroes.length > 0 ? dashboard.recentHeroes.map((hero) => (
                <tr key={`${hero.steam_id}:${hero.hero_name}`}>
                  <td>{hero.steam_id}</td>
                  <td>{hero.hero_name}</td>
                  <td>{hero.level}</td>
                  <td>{hero.world_level}</td>
                  <td>{hero.gear_score}</td>
                  <td>{hero.last_save_at ? new Date(hero.last_save_at).toLocaleString("es") : "Sin guardar"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>Sin personajes guardados todavia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function getSectionText(section: string) {
  const text: Record<string, string> = {
    Bienvenida: "Panel conectado a Supabase. Las metricas superiores vienen de datos reales.",
    Jugadores: "Lista y busqueda de jugadores por SteamID o nombre Steam.",
    Cuentas: "Administradores, moderadores, soportes y solicitudes de reset de contrasena.",
    Progreso: "Detalle de progreso por jugador y por heroe.",
    Sanciones: "Pendiente: bloqueo temporal/permanente y motivo auditable.",
    Balance: "Pendiente: editar borradores de balance y publicar versiones.",
    Enemigos: "Pendiente: administrar monster_configs y estadisticas.",
    Items: "Pendiente: catalogo administrable de items, tiers y recetas.",
    Misiones: "Pendiente: administracion de misiones obligatorias/opcionales.",
    Temporadas: "Temporada activa conectada a season_001.",
    Pagos: "PayPal y MercadoPago quedan apagados hasta backend seguro.",
    Auditoria: "Login, cambio de contrasena y guardados ya generan auditoria.",
  };
  return text[section] ?? "Modulo en preparacion.";
}

function getSectionHref(section: string) {
  const routes: Record<string, string> = {
    Jugadores: "/admin/players",
    Cuentas: "/admin/accounts",
    Progreso: "/admin/players",
    Auditoria: "/admin/players",
  };
  return routes[section] ?? `#${section.toLowerCase()}`;
}
