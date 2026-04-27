import Link from "next/link";
import { getPublicRankings, RankingRow } from "../lib/rankings";
import { getSteamUserSession } from "../lib/steam-auth";

const rankingTabs = [
  { key: "progress", label: "Progreso" },
  { key: "damage", label: "Mayor dano" },
  { key: "gear", label: "Gear" },
  { key: "world", label: "Mundo" },
];

export default async function RankingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const params = await searchParams;
  const selected = params?.tipo ?? "progress";
  const [rankings, session] = await Promise.all([
    getPublicRankings(),
    getSteamUserSession(),
  ]);
  const sorted = sortRanking(rankings, selected);
  const myRankIndex = session ? sorted.findIndex((row) => row.steamId === session.steamId) : -1;
  const myRank = myRankIndex >= 0 ? sorted[myRankIndex] : null;

  return (
    <main className="page">
      <section className="section page-hero compact-hero">
        <p className="eyebrow">Rankings publicos</p>
        <h1>Rankings</h1>
        <p className="lead">
          Tablas separadas para avance, dano, gear y mundo. Cuando entren guardados reales con mas metricas,
          cada seccion se alimentara desde Supabase.
        </p>
      </section>

      <nav className="subnav" aria-label="Subsecciones de ranking">
        {rankingTabs.map((tab) => (
          <Link className={selected === tab.key ? "active" : ""} href={`/rankings?tipo=${tab.key}`} key={tab.key}>
            {tab.label}
          </Link>
        ))}
      </nav>

      {session ? (
        <section className="section highlight-section">
          <article className={`my-rank-card ${myRank ? topRankClass(myRankIndex + 1) : ""}`}>
            {session.avatarUrl ? <img className="steam-avatar" src={session.avatarUrl} alt="" /> : <span className="steam-avatar fallback">SR</span>}
            <div>
              <p className="eyebrow">Tu posicion</p>
              <h2>{myRank ? `#${myRankIndex + 1} ${myRank.hero}` : "Sin ranking registrado"}</h2>
              <p>{myRank ? `Nivel ${myRank.level}, Mundo ${myRank.world}, Gear ${myRank.gear}` : "Guarda progreso desde el modo para aparecer aqui."}</p>
            </div>
          </article>
        </section>
      ) : null}

      <section className="section">
        {selected === "damage" ? (
          <EmptyRanking title="Mayor dano" text="Esta subseccion queda lista para cuando el modo envie dano total, mayor golpe y DPS por guardado." />
        ) : (
          <RankingTable rows={sorted} selected={selected} />
        )}
      </section>
    </main>
  );
}

function RankingTable({ rows, selected }: { rows: RankingRow[]; selected: string }) {
  return (
    <div className="table-card rank-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jugador</th>
            <th>Heroe</th>
            <th>Nivel</th>
            <th>Mundo</th>
            <th>Zona</th>
            <th>{selected === "gear" ? "Gear" : "Gear"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, index) => (
            <tr className={index < 10 ? `top-rank ${topRankClass(index + 1)}` : ""} key={`${row.steamId}:${row.hero}:${index}`}>
              <td><span className="rank-medal">#{index + 1}</span></td>
              <td>
                <Link className="identity-row" href={`/players/${encodeURIComponent(row.steamId)}`}>
                  {row.avatarUrl ? <img className="mini-avatar" src={row.avatarUrl} alt="" /> : <span className="mini-avatar fallback">SR</span>}
                  <div>
                    <strong>{row.player}</strong>
                    <span>{row.steamId || "SteamID pendiente"}</span>
                  </div>
                </Link>
              </td>
              <td>{row.hero}</td>
              <td>{row.level}</td>
              <td>{row.world}</td>
              <td>{row.zone}</td>
              <td>{row.gear}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7}>Sin guardados reales todavia.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRanking({ title, text }: { title: string; text: string }) {
  return (
    <article className="card empty-state-card">
      <p className="eyebrow">Subseccion preparada</p>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function sortRanking(rows: RankingRow[], selected: string) {
  const copy = [...rows];
  if (selected === "gear") return copy.sort((a, b) => b.gear - a.gear || b.level - a.level);
  if (selected === "world") return copy.sort((a, b) => b.world - a.world || b.zone - a.zone || b.level - a.level);
  return copy.sort((a, b) => b.world - a.world || b.level - a.level || b.gear - a.gear);
}

function topRankClass(rank: number) {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  if (rank <= 10) return "rank-top";
  return "";
}
