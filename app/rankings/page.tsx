import { getPublicRankings } from "../lib/rankings";

export default async function RankingsPage() {
  const rankings = await getPublicRankings();

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Publico</p>
        <h1>Rankings</h1>
        <p className="lead">
          Ranking publico alimentado por guardados reales del modo. Hasta que entren partidas con
          guardado valido, la tabla permanecera vacia.
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
