export default function ProfilePage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Login Steam requerido</p>
        <h1>Mi perfil</h1>
        <p className="lead">
          Aqui se mostraran tus personajes, oro por heroe, inventario, mascotas, cosmeticos,
          misiones, temporadas y ultimo guardado cuando conectemos Steam OpenID y Supabase.
        </p>
        <div className="actions">
          <span className="button secondary">Steam login pendiente</span>
        </div>
      </section>
    </main>
  );
}
