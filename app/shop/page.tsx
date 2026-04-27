import Link from "next/link";
import { getPublishedContent } from "../lib/content-catalog";
import { getCatalogImage, homeScenes } from "../lib/visuals";

const plannedSections = [
  {
    title: "Cosmeticos de cuenta",
    text: "Skins, marcos y efectos visuales ligados a cuenta. No deben reemplazar crafteos ni drops.",
    image: homeScenes.ranking,
  },
  {
    title: "Skins de mascotas",
    text: "Apariencias compartidas por cuenta para lobos, gatos, Roshan y companeros de soporte.",
    image: homeScenes.pets,
  },
  {
    title: "Pase de batalla",
    text: "Recompensas simples: oro controlado, items basicos, cosmeticos y progreso visual.",
    image: homeScenes.season,
  },
  {
    title: "Paquetes pay to fast",
    text: "Ayuda de avance con limites claros para no vender items crafteables ni drops principales.",
    image: homeScenes.crafting,
  },
  {
    title: "Donaciones",
    text: "Seccion futura para apoyar el servidor y desbloquear beneficios no invasivos.",
    image: homeScenes.crafting,
  },
];

export default async function ShopPage() {
  const content = await getPublishedContent();
  const shopItems = content.filter((entry) => {
    const source = entry.payload.source;
    return entry.content_type === "item" && source === "shop";
  });

  return (
    <main className="page">
      <section className="section page-hero compact-hero shop-hero">
        <p className="eyebrow">Tienda</p>
        <h1>Tienda bloqueada</h1>
        <p className="lead">
          La pagina queda visible para ordenar cosmeticos, moneda premium, pase y donaciones, pero las
          compras siguen apagadas hasta terminar pagos, auditoria y entrega segura en Supabase.
        </p>
        <div className="actions">
          <Link className="button" href="/catalog?tipo=shop">Ver items comprables publicados</Link>
          <Link className="button secondary" href="/catalog?tipo=craft">Comparar crafteos</Link>
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Secciones futuras</h2>
          <span className="count-badge">Pagos desactivados</span>
        </div>
        <div className="feature-grid">
          {plannedSections.map((section) => (
            <article className="feature-card vivid-card locked-card" key={section.title}>
              <img src={section.image} alt="" />
              <div>
                <p className="eyebrow">Bloqueado</p>
                <h3>{section.title}</h3>
                <p>{section.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Items comprables publicados</h2>
          <span className="count-badge">{shopItems.length} registros</span>
        </div>
        <div className="catalog-grid">
          {shopItems.length > 0 ? shopItems.map((item) => (
            <article className="catalog-card vivid-card" key={item.content_key}>
              <div className="item-card-layout">
                <img className="catalog-thumb" src={getCatalogImage(item)} alt="" />
                <div>
                  <p className="eyebrow">{item.category ?? "Tienda"}</p>
                  <h3>{item.name_es}</h3>
                  <p>{item.summary_es}</p>
                  <div className="tag-row">
                    <span className="tag">Precio fijo futuro</span>
                    <span className="tag">No crafteable</span>
                  </div>
                </div>
              </div>
            </article>
          )) : (
            <article className="card empty-state-card">
              <p className="eyebrow">Sin tienda publica</p>
              <h3>No hay items de tienda publicados</h3>
              <p>Cuando exista catalogo de tienda con source=shop, aparecera aqui.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
