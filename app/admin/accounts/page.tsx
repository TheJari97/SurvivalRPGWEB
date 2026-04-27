import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getAdminAccounts } from "../../lib/admin-data";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/change-password");

  const params = await searchParams;
  const query = params?.q ?? "";
  const accounts = await getAdminAccounts(query);

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Admin</p>
        <h1>Cuentas internas</h1>
        <p className="lead">
          Lista de administradores, moderadores y soportes. El reset marca cambio obligatorio y deja auditoria.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/admin">Panel</Link>
        </div>
      </section>

      <section className="section toolbar-section">
        <form className="toolbar" action="/admin/accounts">
          <label className="field compact-field">
            <span>Buscar cuenta</span>
            <input className="input" name="q" type="search" placeholder="Usuario o SteamID" defaultValue={query} />
          </label>
          <button className="button" type="submit">Buscar</button>
        </form>
      </section>

      <section className="section">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>SteamID</th>
                <th>Activa</th>
                <th>Cambio obligatorio</th>
                <th>Resets abiertos</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.username}</td>
                  <td>{account.steam_id ?? "Sin SteamID"}</td>
                  <td>{account.active ? "Si" : "No"}</td>
                  <td>{account.must_change_password ? "Si" : "No"}</td>
                  <td>{account.reset_requests_count}</td>
                  <td>
                    <form action="/api/admin/accounts/request-password-reset" method="post">
                      <input name="accountId" type="hidden" value={account.id} />
                      <button className="button secondary" type="submit">Solicitar reset</button>
                    </form>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>No hay cuentas con ese filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
