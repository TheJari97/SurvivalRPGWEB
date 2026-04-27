import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getAdminPlayers } from "../../lib/admin-data";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/change-password");

  const params = await searchParams;
  const query = params?.q ?? "";
  const players = await getAdminPlayers(query);

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Admin</p>
        <h1>Jugadores</h1>
        <p className="lead">
          Busca por SteamID o nombre Steam. Desde aqui se revisa progreso, oro, personajes,
          guardados y auditoria por jugador.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/admin">Panel</Link>
        </div>
      </section>

      <section className="section toolbar-section">
        <form className="toolbar" action="/admin/players">
          <label className="field compact-field">
            <span>Buscar jugador</span>
            <input className="input" name="q" type="search" placeholder="SteamID o nombre" defaultValue={query} />
          </label>
          <button className="button" type="submit">Buscar</button>
        </form>
      </section>

      <section className="section">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>SteamID</th>
                <th>Nombre</th>
                <th>Personajes</th>
                <th>Nivel max</th>
                <th>Mundo max</th>
                <th>Oro total</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {players.length > 0 ? players.map((player) => (
                <tr key={player.steam_id}>
                  <td>{player.steam_id}</td>
                  <td>{player.display_name ?? "Sin nombre"}</td>
                  <td>{player.hero_count}</td>
                  <td>{player.max_level}</td>
                  <td>{player.max_world}</td>
                  <td>{player.total_gold}</td>
                  <td><Link href={`/admin/players/${player.steam_id}`}>Abrir</Link></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>No hay jugadores con ese filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
