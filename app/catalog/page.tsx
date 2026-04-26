import { heroRoles } from "../lib/mock-data";

export default function CatalogPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Heroes, items, mascotas y mundos</p>
        <h1>Catalogo</h1>
        <p className="lead">
          La primera version muestra el diseno base. Luego esta seccion se alimentara de Supabase
          con items, drops, crafteos, mascotas, zonas, misiones y jefes.
        </p>
      </section>

      <section className="section">
        <h2>Heroes por rol</h2>
        <div className="grid">
          {heroRoles.map((hero) => (
            <article className="card" key={hero.name}>
              <p className="eyebrow">{hero.role}</p>
              <h3>{hero.name}</h3>
              <p>{hero.text}</p>
              <div className="tag-row">
                {hero.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
