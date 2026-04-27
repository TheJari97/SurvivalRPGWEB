import { appConfig } from "../lib/config";
import { getPlayerProfileData } from "../lib/player-data";
import { getSteamUserSession } from "../lib/steam-auth";
import Link from "next/link";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ steam_error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSteamUserSession();

  if (!session) {
    return (
      <main className="page">
        <section className="section page-hero compact-hero profile-guest-hero">
          <p className="eyebrow">Login Steam requerido</p>
          <h1>Mi perfil</h1>
          <p className="lead">
            Conecta tu cuenta de Steam para ver tus personajes reales, progreso por heroe,
            oro, mundo, zona, gear, cosmeticos y ultimo guardado.
          </p>
          {params?.steam_error ? <p className="alert">{params.steam_error}</p> : null}
          <div className="actions">
            {appConfig.steamLoginEnabled ? (
              <a className="button" href="/api/auth/steam/login">Entrar con Steam</a>
            ) : (
              <span className="button secondary">Steam login desactivado</span>
            )}
          </div>
        </section>
      </main>
    );
  }

  const profile = await getPlayerProfileData(session.steamId);
  const displayName = profile.player?.display_name ?? session.displayName ?? `Steam ${session.steamId.slice(-4)}`;

  return (
    <main className="page">
      <section className="section profile-header profile-hero">
        <div className="profile-title-row">
          {profile.player?.avatar_url ? <img className="steam-avatar" src={profile.player.avatar_url} alt="" /> : <span className="steam-avatar fallback">SR</span>}
          <div>
            <p className="eyebrow">Perfil Steam</p>
            <h1>{displayName}</h1>
            <p className="lead">
              Progreso real vinculado al SteamID {session.steamId}. Cada heroe mantiene su propio
              nivel, oro, inventario, mascotas, misiones y desbloqueos.
            </p>
            <div className="actions compact-actions">
              <Link className="button secondary" href={`/players/${encodeURIComponent(session.steamId)}`}>Ver perfil publico</Link>
            </div>
          </div>
        </div>
        <form action="/api/auth/steam/logout" method="post">
          <button className="button secondary" type="submit">Salir</button>
        </form>
      </section>

      <nav className="subnav" aria-label="Subsecciones de perfil">
        <a href="#resumen">Resumen</a>
        <a href="#insignias">Insignias</a>
        <a href="#personajes">Personajes</a>
        <a href="#cuenta">Cuenta</a>
      </nav>

      <section className="section" id="resumen">
        <div className="stat-grid dashboard-stats">
          <div className="stat">
            <strong>{profile.heroes.length}</strong>
            <span>Personajes</span>
          </div>
          <div className="stat">
            <strong>{highest(profile.heroes.map((hero) => hero.level))}</strong>
            <span>Nivel maximo</span>
          </div>
          <div className="stat">
            <strong>{highest(profile.heroes.map((hero) => hero.world_level))}</strong>
            <span>Mundo maximo</span>
          </div>
          <div className="stat">
            <strong>{profile.cosmeticsCount}</strong>
            <span>Cosmeticos</span>
          </div>
          <div className="stat">
            <strong>{profile.badges.length}</strong>
            <span>Insignias</span>
          </div>
          <div className="stat">
            <strong>{profile.achievements.filter((achievement) => achievement.completed).length}</strong>
            <span>Logros</span>
          </div>
        </div>
      </section>

      <section className="section" id="insignias">
        <div className="catalog-toolbar-line">
          <h2>Insignias y logros</h2>
          <span className="count-badge">{profile.badges.length + profile.achievements.length} registros</span>
        </div>
        <div className="badge-grid">
          {profile.badges.length > 0 ? profile.badges.map((badge) => (
            <article className="badge-card" key={`${badge.badge_key}:${badge.season_id ?? "global"}`}>
              {badge.badge_definitions?.image_url ? <img className="mini-avatar" src={badge.badge_definitions.image_url} alt="" /> : <span className="mini-avatar fallback">IN</span>}
              <div>
                <strong>{badge.badge_definitions?.name_es ?? badge.badge_key}</strong>
                <span>{badge.badge_definitions?.summary_es ?? "Insignia de cuenta"}</span>
              </div>
            </article>
          )) : <article className="card empty-state-card"><p>Sin insignias aun.</p></article>}
        </div>
        <div className="achievement-grid">
          {profile.achievements.length > 0 ? profile.achievements.map((achievement) => (
            <article className="achievement-card" key={`${achievement.achievement_key}:${achievement.season_id ?? "global"}`}>
              <strong>{achievement.achievement_definitions?.name_es ?? achievement.achievement_key}</strong>
              <span>{achievement.completed ? "Completado" : `Progreso ${achievement.progress}`}</span>
              <p>{achievement.achievement_definitions?.summary_es ?? "Logro de cuenta"}</p>
            </article>
          )) : null}
        </div>
      </section>

      <section className="section split-section" id="cuenta">
        <article className="card profile-info-card">
          <p className="eyebrow">Cuenta conectada</p>
          <h3>Sesion Steam activa</h3>
          <p>Nombre: {displayName}</p>
          <p>SteamID: {session.steamId}</p>
          <p>Actualizado: {profile.player?.updated_at ? new Date(profile.player.updated_at).toLocaleString("es") : "Pendiente de sincronizar"}</p>
        </article>
        <article className="card profile-info-card">
          <p className="eyebrow">Reglas de progreso</p>
          <h3>Progreso por heroe</h3>
          <p>El oro, nivel, inventario, mascotas, misiones y desbloqueos no se comparten entre heroes.</p>
          <p>Las skins y cosmeticos de cuenta si pueden usarse desde cualquier heroe cuando existan.</p>
        </article>
      </section>

      <section className="section" id="personajes">
        <div className="catalog-toolbar-line">
          <h2>Personajes</h2>
          <span className="count-badge">{profile.heroes.length} guardados</span>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Heroe</th>
                <th>Nivel</th>
                <th>Oro</th>
                <th>Mundo</th>
                <th>Zona</th>
                <th>Gear</th>
                <th>Ultimo guardado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {profile.heroes.length > 0 ? profile.heroes.map((hero) => (
                <tr key={hero.hero_name}>
                  <td>{hero.hero_name}</td>
                  <td>{hero.level}</td>
                  <td>{hero.gold}</td>
                  <td>{hero.world_level}</td>
                  <td>{hero.zone_unlocked}</td>
                  <td>{hero.gear_score}</td>
                  <td>{hero.last_save_at ? new Date(hero.last_save_at).toLocaleString("es") : "Sin guardar"}</td>
                  <td><Link href={`/profile/${encodeURIComponent(hero.hero_name)}`}>Ver detalle</Link></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8}>Todavia no hay personajes guardados para este SteamID.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function highest(values: number[]) {
  return values.length > 0 ? Math.max(...values) : 0;
}
