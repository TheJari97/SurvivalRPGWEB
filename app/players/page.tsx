import Link from "next/link";
import { searchPublicPlayers } from "../lib/player-data";

export default async function PlayersSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const players = await searchPublicPlayers(query);

  return (
    <main className="page">
      <section className="section page-hero compact-hero">
        <p className="eyebrow">Perfiles publicos</p>
        <h1>Jugadores</h1>
        <p className="lead">
          Busca por SteamID o nombre Steam. Solo aparecen cuentas registradas en la base de datos.
        </p>
      </section>

      <section className="section toolbar-section">
        <form className="toolbar elevated-toolbar" action="/players">
          <label className="field compact-field">
            <span>Buscar jugador</span>
            <input className="input" name="q" type="search" placeholder="SteamID o nombre Steam" defaultValue={query} />
          </label>
          <button className="button" type="submit">Buscar</button>
        </form>
      </section>

      <section className="section">
        <div className="player-grid">
          {players.length > 0 ? players.map((player) => (
            <article className="player-card" key={player.steam_id}>
              {player.avatar_url ? <img className="steam-avatar" src={player.avatar_url} alt="" /> : <span className="steam-avatar fallback">SR</span>}
              <div>
                <p className="eyebrow">{player.country ?? "Steam"}</p>
                <h3>{player.display_name ?? `Steam ${player.steam_id.slice(-4)}`}</h3>
                <p>{player.steam_id}</p>
                <div className="tag-row">
                  <span className="tag">{player.hero_count} personajes</span>
                  <span className="tag">Nivel {player.max_level}</span>
                  <span className="tag">Mundo {player.max_world}</span>
                </div>
                <div className="actions compact-actions">
                  <Link className="button secondary" href={`/players/${encodeURIComponent(player.steam_id)}`}>Ver perfil</Link>
                </div>
              </div>
            </article>
          )) : (
            <article className="card">
              <p className="eyebrow">{query ? "Sin resultados" : "Busca por Steam"}</p>
              <h3>{query ? "No hay jugador registrado con ese dato" : "Ingresa SteamID o nombre"}</h3>
              <p>{query ? "Si el jugador nunca inicio sesion o no tiene registro, no aparece." : "El buscador no muestra cuentas que no existan en la BD."}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
