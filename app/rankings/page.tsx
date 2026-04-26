import { getPublicRankings } from "../lib/rankings";

export default async function RankingsPage() {
  const rankings = await getPublicRankings();

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Publico</p>
        <h1>Rankings</h1>
        <p className="lead">
          Esta vista sera publica. Cuando conectemos Supabase, leera temporadas, heroes, nivel,
          mundo, zona y gear score desde la base de datos.
        </p>
      </section>

      <section className="section">
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
