import Link from "next/link";
import { homeScenes } from "../lib/visuals";

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
    title: "Donaciones",
    text: "Seccion futura para apoyar infraestructura sin activar compras dentro del juego todavia.",
    image: homeScenes.crafting,
  },
];

export default function ShopPage() {
  return (
    <main className="page">
      <section className="section page-hero compact-hero shop-hero">
        <p className="eyebrow">Tienda</p>
        <h1>Tienda bloqueada</h1>
        <p className="lead">
          Esta seccion existe como preparacion, pero no esta enlazada en el menu principal y no permite comprar.
          Primero se termina guardado, auditoria, pagos seguros y entrega controlada desde Supabase.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/guide">Leer guia</Link>
          <Link className="button secondary" href="/catalog?tipo=item">Ver items del juego</Link>
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
    </main>
  );
}
