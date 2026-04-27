import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getAdminStaffMembers } from "../../lib/admin-data";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const query = params?.q ?? "";
  const staffMembers = await getAdminStaffMembers(query);

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Admin</p>
        <h1>Equipo interno</h1>
        <p className="lead">
          Administradores, moderadores y soportes ligados a SteamID. El acceso ya no usa usuario ni contrasena.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/admin">Panel</Link>
        </div>
      </section>

      <section className="section toolbar-section">
        <form className="toolbar" action="/admin/accounts">
          <label className="field compact-field">
            <span>Buscar miembro</span>
            <input className="input" name="q" type="search" placeholder="SteamID, nombre o rol" defaultValue={query} />
          </label>
          <button className="button" type="submit">Buscar</button>
        </form>
      </section>

      <section className="section">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nombre Steam</th>
                <th>SteamID</th>
                <th>Rol</th>
                <th>Activa</th>
                <th>Permisos</th>
                <th>Publico</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.length > 0 ? staffMembers.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.avatar_url ? <img className="mini-avatar" src={staff.avatar_url} alt="" /> : <span className="mini-avatar fallback">SR</span>}</td>
                  <td>{staff.display_name ?? "Sin nombre"}</td>
                  <td>{staff.steam_id}</td>
                  <td>{staff.roles.join(", ")}</td>
                  <td>{staff.active ? "Si" : "No"}</td>
                  <td>{staff.permissions.length > 0 ? staff.permissions.join(", ") : "Sin permisos extra"}</td>
                  <td><Link href={`/players/${encodeURIComponent(staff.steam_id)}`}>Ver</Link></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>No hay miembros internos con ese filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
