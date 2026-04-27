import Link from "next/link";

const plannedSections = [
  "Cosmeticos de cuenta",
  "Skins de mascotas",
  "Pase de batalla",
  "Paquetes pay to fast controlados",
  "Donaciones",
];

export default function ShopPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Tienda</p>
        <h1>Proximamente</h1>
        <p className="lead">
          La tienda queda visible para preparar la estructura, pero las compras siguen bloqueadas hasta
          implementar pagos, auditoria, reglas de balance y entrega segura en BD.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/catalog">Ver items del catalogo</Link>
        </div>
      </section>

      <section className="section">
        <div className="grid">
          {plannedSections.map((section) => (
            <article className="card" key={section}>
              <p className="eyebrow">Bloqueado</p>
              <h3>{section}</h3>
              <p>Esta seccion se activara cuando el backend de pagos y permisos este completo.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
