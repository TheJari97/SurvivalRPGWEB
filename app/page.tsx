import Link from "next/link";
import { seasonStats } from "./lib/mock-data";
import { getEntryTags, getPublishedChangeLog, getPublishedContent } from "./lib/content-catalog";
import { getPublicRankings } from "./lib/rankings";
import { getCatalogImage, getRoleLabel, homeScenes } from "./lib/visuals";

export default async function HomePage() {
  const [rankings, heroes, catalog, changes] = await Promise.all([
    getPublicRankings(),
    getPublishedContent("hero"),
    getPublishedContent(),
    getPublishedChangeLog(),
  ]);
  const featuredItems = catalog.filter((entry) => entry.content_type === "item").slice(0, 4);

  return (
    <main className="page">
      <section className="hero home-hero">
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
            <Link className="button secondary" href="/profile">Entrar con Steam</Link>
          </div>
        </div>

        <aside className="hero-panel season-card" aria-label="Estado de temporada">
          <div className="panel-header">
            <div>
              <strong>Temporada 001</strong>
              <span>Fundacional</span>
            </div>
            <span className="status">Preparando beta</span>
          </div>
          <img className="season-art" src={homeScenes.season} alt="" />
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
        <div className="catalog-toolbar-line">
          <h2>Explora el modo</h2>
          <span className="count-badge">Datos vivos de Supabase</span>
        </div>
        <div className="feature-grid">
          <Link className="feature-card vivid-card" href="/catalog?tipo=craft">
            <img src={homeScenes.crafting} alt="" />
            <div>
              <p className="eyebrow">Forja y recetas</p>
              <h3>Crafteos por rol</h3>
              <p>Recursos, rangos por tier, materiales y recetas publicadas para progresar sin comprar poder directo.</p>
            </div>
          </Link>
          <Link className="feature-card vivid-card" href="/rankings">
            <img src={homeScenes.ranking} alt="" />
            <div>
              <p className="eyebrow">Competencia</p>
              <h3>Rankings separados</h3>
              <p>Progreso, mundo, gear y espacio preparado para dano total, mayor golpe y DPS real.</p>
            </div>
          </Link>
          <Link className="feature-card vivid-card" href="/catalog?tipo=hero">
            <img src={homeScenes.pets} alt="" />
            <div>
              <p className="eyebrow">Personajes</p>
              <h3>Heroes, mascotas y cuenta</h3>
              <p>Cada heroe guarda su propio nivel, oro, inventario, misiones y mascota activa por SteamID.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Heroes por rol</h2>
          <Link className="button secondary" href="/catalog?tipo=hero">Ver todos</Link>
        </div>
        <div className="grid">
          {heroes.length > 0 ? heroes.slice(0, 6).map((hero) => (
            <article className="card hero-mini-card" key={hero.content_key}>
              <img className="catalog-thumb" src={getCatalogImage(hero)} alt="" />
              <p className="eyebrow">{getRoleLabel(hero.role ?? hero.category)}</p>
              <h3>{hero.name_es}</h3>
              <p>{hero.summary_es}</p>
              <div className="tag-row">
                {getEntryTags(hero).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          )) : (
            <article className="card empty-state-card">
              <p className="eyebrow">Catalogo</p>
              <h3>Sin datos publicados</h3>
              <p>Los heroes apareceran cuando la migracion de catalogo este aplicada en Supabase.</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Ranking publico inicial</h2>
          <Link className="button secondary" href="/rankings">Abrir rankings</Link>
        </div>
        <div className="table-card rank-table">
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
              {rankings.length > 0 ? rankings.slice(0, 5).map((row, index) => (
                <tr className={index < 3 ? `top-rank ${topRankClass(index + 1)}` : ""} key={`${row.steamId}:${row.hero}`}>
                  <td><span className="rank-medal">#{index + 1}</span></td>
                  <td>
                    <Link className="identity-row" href={`/players/${encodeURIComponent(row.steamId)}`}>
                      {row.avatarUrl ? <img className="mini-avatar" src={row.avatarUrl} alt="" /> : <span className="mini-avatar fallback">SR</span>}
                      <div>
                        <strong>{row.player}</strong>
                        <span>{row.steamId}</span>
                      </div>
                    </Link>
                  </td>
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

      <section className="section split-section">
        <div>
          <div className="catalog-toolbar-line">
            <h2>Items destacados</h2>
            <Link className="button secondary" href="/catalog?tipo=item">Ver catalogo</Link>
          </div>
          <div className="change-strip">
            {featuredItems.length > 0 ? featuredItems.map((item) => (
              <article className="change-mini item-mini" key={item.content_key}>
                <img className="mini-avatar" src={getCatalogImage(item)} alt="" />
                <strong>{item.name_es}</strong>
                <p>{item.summary_es}</p>
              </article>
            )) : (
              <article className="card empty-state-card">
                <p>Los items publicados apareceran aqui.</p>
              </article>
            )}
          </div>
        </div>
        <div>
          <div className="catalog-toolbar-line">
            <h2>Ultimos cambios</h2>
            <Link className="button secondary" href="/changelog">Ver changelog</Link>
          </div>
          <div className="change-strip stacked-strip">
            {changes.length > 0 ? changes.slice(0, 3).map((change) => (
              <article className="change-mini" key={`${change.version_key}:${change.content_key}:${change.title_es}`}>
                <span className={`change-pill change-${change.change_type.toLowerCase()}`}>{change.change_type}</span>
                <strong>{change.title_es}</strong>
                <p>{change.detail_es}</p>
              </article>
            )) : (
              <article className="card empty-state-card">
                <p>Todavia no hay cambios publicados para jugadores.</p>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function topRankClass(rank: number) {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  if (rank <= 10) return "rank-top";
  return "";
}
