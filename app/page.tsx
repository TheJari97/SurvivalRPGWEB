import Link from "next/link";
import { heroRoles, seasonStats } from "./lib/mock-data";
import { getPublicRankings } from "./lib/rankings";

export default async function HomePage() {
  const rankings = await getPublicRankings();

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Custom game RPG cooperativo para Dota 2</p>
          <h1>SurvivalRPG Dota</h1>
          <p className="lead">
            Progreso por SteamID, heroes con avance propio, mundos con limite de nivel, crafteo por rol,
            mascotas, temporadas, rankings publicos y administracion centralizada para balancear el juego.
          </p>
          <div className="actions">
            <Link className="button" href="/rankings">Ver rankings</Link>
            <Link className="button secondary" href="/catalog">Explorar catalogo</Link>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Estado de temporada">
          <div className="panel-header">
            <strong>Temporada 001</strong>
            <span className="status">Preparando beta</span>
          </div>
          <div className="stat-grid">
            {seasonStats.map((stat) => (
              <div className="stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="section">
        <h2>Roles principales</h2>
        <div className="grid">
          {heroRoles.slice(0, 3).map((hero) => (
            <article className="card" key={hero.name}>
              <p className="eyebrow">{hero.role}</p>
              <h3>{hero.name}</h3>
              <p>{hero.text}</p>
              <div className="tag-row">
                {hero.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Ranking publico inicial</h2>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Heroe</th>
                <th>Nivel</th>
                <th>Mundo</th>
                <th>Gear</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row) => (
                <tr key={row.rank}>
                  <td>{row.rank}</td>
                  <td>{row.player}</td>
                  <td>{row.hero}</td>
                  <td>{row.level}</td>
                  <td>{row.world}</td>
                  <td>{row.gear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
