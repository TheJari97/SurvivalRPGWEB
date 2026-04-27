import Link from "next/link";
import { getPublicPlayerProfileData } from "../../lib/player-data";

export default async function PublicPlayerPage({
  params,
}: {
  params: Promise<{ steamId: string }>;
}) {
  const { steamId } = await params;
  const decodedSteamId = decodeURIComponent(steamId);
  const profile = await getPublicPlayerProfileData(decodedSteamId);
  const displayName = profile.player?.display_name ?? `Steam ${decodedSteamId.slice(-4)}`;

  if (!profile.player && profile.heroes.length === 0) {
    return (
      <main className="page">
        <section className="section">
          <p className="eyebrow">Perfil publico</p>
          <h1>No encontrado</h1>
          <p className="lead">No hay progreso publico guardado para este SteamID.</p>
          <div className="actions">
            <Link className="button secondary" href="/rankings">Volver a rankings</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="section profile-header profile-hero">
        <div className="profile-title-row">
          {profile.player?.avatar_url ? <img className="steam-avatar" src={profile.player.avatar_url} alt="" /> : <span className="steam-avatar fallback">SR</span>}
          <div>
            <p className="eyebrow">Perfil publico</p>
            <h1>{displayName}</h1>
            <p className="lead">
              Vista publica por SteamID {decodedSteamId}. El oro, payload crudo y datos privados no se muestran.
            </p>
          </div>
        </div>
      </section>

      <nav className="subnav" aria-label="Subsecciones de perfil publico">
        <a href="#resumen">Resumen</a>
        <a href="#insignias">Insignias</a>
        <a href="#personajes">Personajes</a>
      </nav>

      <section className="section" id="resumen">
        <div className="stat-grid dashboard-stats">
          <div className="stat"><strong>{profile.heroes.length}</strong><span>Personajes</span></div>
          <div className="stat"><strong>{highest(profile.heroes.map((hero) => hero.level))}</strong><span>Nivel maximo</span></div>
          <div className="stat"><strong>{highest(profile.heroes.map((hero) => hero.world_level))}</strong><span>Mundo maximo</span></div>
          <div className="stat"><strong>{profile.cosmeticsCount}</strong><span>Cosmeticos</span></div>
          <div className="stat"><strong>{profile.badges.length}</strong><span>Insignias</span></div>
          <div className="stat"><strong>{profile.achievements.filter((achievement) => achievement.completed).length}</strong><span>Logros</span></div>
        </div>
      </section>

      <section className="section" id="insignias">
        <div className="catalog-toolbar-line">
          <h2>Insignias publicas</h2>
          <span className="count-badge">{profile.badges.length}</span>
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
          )) : <article className="card empty-state-card"><p>Sin insignias publicas aun.</p></article>}
        </div>
      </section>

      <section className="section" id="personajes">
        <div className="catalog-toolbar-line">
          <h2>Personajes</h2>
          <span className="count-badge">{profile.heroes.length} publicos</span>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Heroe</th>
                <th>Nivel</th>
                <th>Mundo</th>
                <th>Zona</th>
                <th>Gear</th>
                <th>Ultimo guardado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {profile.heroes.map((hero) => (
                <tr key={hero.hero_name}>
                  <td>{hero.hero_name}</td>
                  <td>{hero.level}</td>
                  <td>{hero.world_level}</td>
                  <td>{hero.zone_unlocked}</td>
                  <td>{hero.gear_score}</td>
                  <td>{hero.last_save_at ? new Date(hero.last_save_at).toLocaleString("es") : "Sin guardar"}</td>
                  <td><Link href={`/players/${encodeURIComponent(decodedSteamId)}/${encodeURIComponent(hero.hero_name)}`}>Ver publico</Link></td>
                </tr>
              ))}
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
