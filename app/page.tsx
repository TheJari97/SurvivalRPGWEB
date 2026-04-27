import Link from "next/link";
import { seasonStats } from "./lib/mock-data";
import { getEntryTags, getPublishedContent } from "./lib/content-catalog";
import { getPublicRankings } from "./lib/rankings";

export default async function HomePage() {
  const [rankings, heroes] = await Promise.all([
    getPublicRankings(),
    getPublishedContent("hero"),
  ]);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Custom game RPG cooperativo para Dota 2</p>
          <h1>SurvivalRPG</h1>
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
          {heroes.length > 0 ? heroes.slice(0, 3).map((hero) => (
            <article className="card" key={hero.content_key}>
              <p className="eyebrow">{hero.category ?? hero.role ?? "Heroe"}</p>
              <h3>{hero.name_es}</h3>
              <p>{hero.summary_es}</p>
              <div className="tag-row">
                {getEntryTags(hero).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          )) : (
            <article className="card">
              <p className="eyebrow">Catalogo</p>
              <h3>Sin datos publicados</h3>
              <p>Los heroes apareceran cuando la migracion de catalogo este aplicada en Supabase.</p>
            </article>
          )}
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
              {rankings.length > 0 ? rankings.map((row) => (
                <tr key={row.rank}>
                  <td>{row.rank}</td>
                  <td>{row.player}</td>
                  <td>{row.hero}</td>
                  <td>{row.level}</td>
                  <td>{row.world}</td>
                  <td>{row.gear}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>Sin guardados reales todavia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
