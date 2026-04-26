export default function AdminLoginPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Administracion</p>
        <h1>Acceso interno</h1>
        <p className="lead">
          Ruta privada para administradores. El usuario inicial sera JariAdmin y el primer acceso
          exigira cambiar la contrasena temporal guardada en entorno privado.
        </p>
      </section>

      <section className="section">
        <form className="card" style={{ maxWidth: 520 }}>
          <h3>Login admin</h3>
          <p>Autenticacion pendiente de activar cuando la base de datos este aplicada.</p>
          <div className="tag-row">
            <span className="tag">Usuario + password</span>
            <span className="tag">SteamID admin</span>
            <span className="tag">Cambio obligatorio</span>
          </div>
        </form>
      </section>
    </main>
  );
}
