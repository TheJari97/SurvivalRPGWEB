import { redirect } from "next/navigation";
import Link from "next/link";
import { adminSections } from "../lib/mock-data";
import { getAdminSession } from "../lib/admin-auth";
import { getAdminDashboardData } from "../lib/admin-data";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const dashboard = await getAdminDashboardData();

  return (
    <main className="page">
      <section className="section page-hero compact-hero admin-hero">
        <p className="eyebrow">Acceso restringido</p>
        <h1>Panel administrador</h1>
        <p className="lead">
          Estructura base para administrar jugadores, progreso, balance, enemigos, items, misiones,
          pagos, sanciones y auditoria. Los cambios de balance quedaran como borrador hasta publicar.
        </p>
        <div className="admin-topline">
          <div className="identity-row">
            {session.avatarUrl ? <img className="mini-avatar" src={session.avatarUrl} alt="" /> : <span className="mini-avatar fallback">SR</span>}
            <div>
              <strong>{session.displayName ?? `Steam ${session.steamId.slice(-4)}`}</strong>
              <span>{session.role} / {session.steamId}</span>
            </div>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">Salir de Steam</button>
          </form>
        </div>
      </section>

      <nav className="subnav admin-subnav" aria-label="Subsecciones administrador">
        <a href="#estado">Estado</a>
        <a href="#control">Control</a>
        <a href="#menus">Menus</a>
        <a href="#personajes">Personajes</a>
        <a href="#guardados">Guardados</a>
      </nav>

      <section className="section" id="estado">
        <div className="catalog-toolbar-line">
          <h2>Estado real</h2>
          <span className="count-badge">Supabase conectado</span>
        </div>
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
          <div className="stat">
            <strong>{dashboard.activePlayersCount}</strong>
            <span>Conectados 60s</span>
          </div>
          <div className="stat">
            <strong>{dashboard.recentActivityCount}</strong>
            <span>Eventos ultimas 24h</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="admin-chart-grid">
          {dashboardBars(dashboard).map((metric) => (
            <article className="chart-card" key={metric.label}>
              <div className="chart-head">
                <strong>{metric.label}</strong>
                <span>{metric.value}</span>
              </div>
              <div className="bar-track">
                <span style={{ width: `${metric.percent}%` }} />
              </div>
              <p>{metric.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="control">
        <div className="catalog-toolbar-line">
          <h2>Centro de control</h2>
          <span className="count-badge">SteamID + auditoria</span>
        </div>
        <div className="admin-control-grid">
          {adminControlGroups.map((group) => (
            <article className="admin-control-card" key={group.title}>
              <div className="admin-card-head">
                <span>{group.kicker}</span>
                <strong>{group.title}</strong>
              </div>
              <p>{group.text}</p>
              <div className="admin-section-list">
                {group.links.map((link) => (
                  <Link href={link.href} key={link.label}>{link.label}</Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section admin-layout" id="menus">
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

      <section className="section split-section" id="personajes">
        <div>
          <div className="catalog-toolbar-line">
            <h2>Ultimos personajes</h2>
            <Link className="button secondary" href="/admin/players">Ver jugadores</Link>
          </div>
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
        </div>
        <div id="guardados">
          <div className="catalog-toolbar-line">
            <h2>Guardados recientes</h2>
            <span className="count-badge">{dashboard.recentSaves.length} eventos</span>
          </div>
          <div className="timeline mini-timeline">
            {dashboard.recentSaves.length > 0 ? dashboard.recentSaves.map((save) => (
              <article className="timeline-card" key={`${save.steam_id}:${save.hero_name}:${save.created_at}`}>
                <p className="eyebrow">{save.status ?? "guardado"}</p>
                <h3>{save.hero_name}</h3>
                <p>{save.steam_id}</p>
                <p>{save.created_at ? new Date(save.created_at).toLocaleString("es") : "Sin fecha"}</p>
              </article>
            )) : (
              <article className="card empty-state-card">
                <p>Todavia no hay eventos de guardado.</p>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function dashboardBars(dashboard: Awaited<ReturnType<typeof getAdminDashboardData>>) {
  const max = Math.max(
    dashboard.playersCount,
    dashboard.heroesCount,
    dashboard.acceptedSavesCount,
    dashboard.auditLogsCount,
    dashboard.publishedContentCount,
    dashboard.activePlayersCount,
    dashboard.recentActivityCount,
    1,
  );

  return [
    { label: "Jugadores", value: dashboard.playersCount, text: "Cuentas Steam registradas en BD." },
    { label: "Personajes", value: dashboard.heroesCount, text: "Heroes con progreso independiente." },
    { label: "Guardados", value: dashboard.acceptedSavesCount, text: "Eventos aceptados por la API." },
    { label: "Auditoria", value: dashboard.auditLogsCount, text: "Registros internos y acciones sensibles." },
    { label: "Conectados", value: dashboard.activePlayersCount, text: "Jugadores con heartbeat en los ultimos 60 segundos." },
    { label: "Actividad 24h", value: dashboard.recentActivityCount, text: "Eventos auditados recientes." },
  ].map((metric) => ({
    ...metric,
    percent: Math.max(6, Math.round((metric.value / max) * 100)),
  }));
}

function getSectionText(section: string) {
  const text: Record<string, string> = {
    Bienvenida: "Panel conectado a Supabase. Las metricas superiores vienen de datos reales.",
    Jugadores: "Lista y busqueda de jugadores por SteamID o nombre Steam.",
    Cuentas: "Administradores, moderadores y soportes ligados a SteamID.",
    Progreso: "Detalle de progreso por jugador y por heroe.",
    Sanciones: "Pendiente: bloqueo temporal/permanente y motivo auditable.",
    Balance: "Pendiente: editar borradores de balance y publicar versiones.",
    Enemigos: "Pendiente: administrar monster_configs y estadisticas.",
    Items: "Revision interna de items, tiers, recetas, drops y recursos publicados.",
    Mascotas: "Catalogo de mascotas, buffs por tier, alimento y artefactos equipables.",
    Artefactos: "Artefactos de heroe y mascota con slots, tiers y reglas de obtencion.",
    Insignias: "Reconocimientos por temporada, staff, rankings, records y recompensas.",
    Logros: "Metas enlazadas a SteamID con progreso, puntos y recompensas futuras.",
    Misiones: "Pendiente: administracion de misiones obligatorias/opcionales.",
    Zonas: "Zona 0-7 aisladas por teleport, jefes de desbloqueo y campamentos con elites.",
    Temporadas: "Temporada activa conectada a season_001.",
    Pagos: "PayPal y MercadoPago quedan apagados hasta backend seguro.",
    Auditoria: "Login Steam, acceso admin y guardados generan auditoria.",
  };
  return text[section] ?? "Modulo en preparacion.";
}

function getSectionHref(section: string) {
  const routes: Record<string, string> = {
    Jugadores: "/admin/players",
    Cuentas: "/admin/accounts",
    Progreso: "/admin/players",
    Items: "/admin/items",
    Mascotas: "/catalog?tipo=pet",
    Artefactos: "/catalog?tipo=artifact",
    Insignias: "/catalog?tipo=badge",
    Logros: "/catalog?tipo=achievement",
    Zonas: "/catalog?tipo=zone",
    Auditoria: "/admin/players",
  };
  return routes[section] ?? `#${section.toLowerCase()}`;
}

const adminControlGroups = [
  {
    kicker: "Jugadores",
    title: "Cuentas, progreso y sanciones",
    text: "Todo nace del SteamID. Aqui se revisan heroes, oro, inventario, guardados, insignias y acciones sensibles.",
    links: [
      { label: "Jugadores", href: "/admin/players" },
      { label: "Equipo interno", href: "/admin/accounts" },
      { label: "Perfil owner", href: "/players/76561198988350556" },
    ],
  },
  {
    kicker: "Balance",
    title: "Items, zonas y enemigos",
    text: "Control pensado para publicar cambios por temporada sin tocar usuarios manualmente ni romper el catalogo publico.",
    links: [
      { label: "Items", href: "/admin/items" },
      { label: "Zonas", href: "/catalog?tipo=zone" },
      { label: "Enemigos", href: "/catalog?tipo=monster" },
    ],
  },
  {
    kicker: "Meta",
    title: "Mascotas, artefactos y logros",
    text: "Sistemas de crecimiento a largo plazo: mascotas por heroe, artefactos por slot, logros e insignias visibles.",
    links: [
      { label: "Mascotas", href: "/catalog?tipo=pet" },
      { label: "Artefactos", href: "/catalog?tipo=artifact" },
      { label: "Insignias", href: "/catalog?tipo=badge" },
      { label: "Logros", href: "/catalog?tipo=achievement" },
    ],
  },
  {
    kicker: "Operaciones",
    title: "Temporadas, pagos y auditoria",
    text: "Queda separado lo publico de lo interno: changelog de juego, compras futuras, logs y acciones de administracion.",
    links: [
      { label: "Changelog", href: "/changelog" },
      { label: "Tienda", href: "/shop" },
      { label: "Guia", href: "/guide" },
    ],
  },
];
