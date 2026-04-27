import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { appConfig } from "../../lib/config";
import { getSteamUserSession } from "../../lib/steam-auth";

export default async function AdminLoginPage() {
  const [adminSession, steamSession] = await Promise.all([
    getAdminSession(),
    getSteamUserSession(),
  ]);

  if (adminSession) redirect("/admin");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Administracion Steam</p>
        <h1>Acceso por SteamID</h1>
        {steamSession ? (
          <p className="lead">
            Tu SteamID {steamSession.steamId} no tiene rol interno activo. Si debe ser admin,
            agregalo en la tabla de roles internos con un rol activo de owner, admin, moderator o support.
          </p>
        ) : (
          <p className="lead">
            Entra con Steam. Si tu SteamID esta ligado a un rol interno, el panel administrador
            aparecera automaticamente; si no, veras tu perfil normal.
          </p>
        )}
      </section>

      <section className="section">
        <article className="card form-card">
          <h3>{steamSession ? "Sin permisos internos" : "Login Steam"}</h3>
          {steamSession ? (
            <>
              <div className="identity-row">
                {steamSession.avatarUrl ? <img className="mini-avatar" src={steamSession.avatarUrl} alt="" /> : <span className="mini-avatar fallback">SR</span>}
                <div>
                  <strong>{steamSession.displayName ?? `Steam ${steamSession.steamId.slice(-4)}`}</strong>
                  <span>{steamSession.steamId}</span>
                </div>
              </div>
              <div className="actions compact-actions">
                <a className="button secondary" href="/profile">Ir a mi perfil</a>
                <form action="/api/auth/steam/logout" method="post">
                  <button className="button secondary" type="submit">Salir de Steam</button>
                </form>
              </div>
            </>
          ) : (
            <div className="actions compact-actions">
              {appConfig.steamLoginEnabled ? (
                <a className="button" href="/api/auth/steam/login?next=/admin">Entrar con Steam</a>
              ) : (
                <span className="button secondary">Steam login desactivado</span>
              )}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
