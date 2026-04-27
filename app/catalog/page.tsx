import { getEntryTags, getPublishedContent } from "../lib/content-catalog";

export default async function CatalogPage() {
  const heroes = await getPublishedContent("hero");

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
          {heroes.length > 0 ? heroes.map((hero) => (
            <article className="card" key={hero.content_key}>
              <p className="eyebrow">{hero.category ?? hero.role ?? "Heroe"}</p>
              <h3>{hero.name_es}</h3>
              <p>{hero.summary_es}</p>
              <div className="tag-row">
                {getEntryTags(hero).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          )) : (
            <article className="card">
              <p className="eyebrow">Sin catalogo</p>
              <h3>Contenido pendiente</h3>
              <p>Cuando se publiquen datos en Supabase, apareceran aqui.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
