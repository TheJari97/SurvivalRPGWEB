import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";
import { getAdminPlayerDetail } from "../../../lib/admin-data";

export default async function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ steamId: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/change-password");

  const { steamId } = await params;
  const detail = await getAdminPlayerDetail(steamId);
  const playerName = detail.player?.display_name ?? "Jugador";

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Admin jugador</p>
        <h1>{playerName}</h1>
        <p className="lead">SteamID {steamId}. Vista interna para revisar progreso completo y eventos.</p>
        <div className="actions">
          <Link className="button secondary" href="/admin/players">Volver a jugadores</Link>
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
              </tr>
            </thead>
            <tbody>
              {detail.heroes.length > 0 ? detail.heroes.map((hero) => (
                <tr key={String(hero.id ?? hero.hero_name)}>
                  <td>{String(hero.hero_name ?? "")}</td>
                  <td>{String(hero.level ?? 0)}</td>
                  <td>{String(hero.gold ?? 0)}</td>
                  <td>{String(hero.world_level ?? 0)}</td>
                  <td>{String(hero.zone_unlocked ?? 0)}</td>
                  <td>{String(hero.gear_score ?? 0)}</td>
                  <td>{hero.last_save_at ? new Date(String(hero.last_save_at)).toLocaleString("es") : "Sin guardar"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>Sin personajes guardados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminJsonSection title="Cosmeticos" rows={detail.cosmetics} />
      <AdminJsonSection title="Guardados recientes" rows={detail.recentSaves} />
      <AdminJsonSection title="Auditoria reciente" rows={detail.auditLogs} />
      <AdminJsonSection title="Payloads de heroes" rows={detail.heroes.map((hero) => ({
        hero_name: hero.hero_name,
        payload: hero.payload,
      }))} />
    </main>
  );
}

function AdminJsonSection({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="detail-json table-card">
        {rows.length > 0 ? (
          <div className="grid">
            {rows.map((row, index) => (
              <article className="card" key={index}>
                <pre>{JSON.stringify(row, null, 2)}</pre>
              </article>
            ))}
          </div>
        ) : (
          <p>No hay datos en esta seccion.</p>
        )}
      </div>
    </section>
  );
}
