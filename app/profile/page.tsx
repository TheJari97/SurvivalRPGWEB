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
        <section className="section">
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
      <section className="section profile-header">
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

      <section className="section">
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
        </div>
      </section>

      <section className="section">
        <h2>Personajes</h2>
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
