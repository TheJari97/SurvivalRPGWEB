import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "../../lib/admin-auth";
import { getPublishedContent } from "../../lib/content-catalog";
import { getCatalogImage, getRoleLabel } from "../../lib/visuals";

const rarityLabels: Record<string, string> = {
  basic: "Basico",
  common: "Comun",
  rare: "Raro",
  epic: "Epico",
  legendary: "Legendario",
  mythic: "Mitico",
  resource: "Recurso",
};

export default async function AdminItemsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const content = await getPublishedContent();
  const items = content
    .filter((entry) => entry.content_type === "item" || entry.content_type === "recipe")
    .sort((a, b) => getRarityLabel(a).localeCompare(getRarityLabel(b)) || a.name_es.localeCompare(b.name_es));

  const counts = {
    all: items.length,
    craft: items.filter((entry) => getSourceValue(entry) === "craft").length,
    drop: items.filter((entry) => getSourceValue(entry) === "drop").length,
    resource: items.filter((entry) => entry.category === "resource" || getSourceValue(entry) === "drop_resource").length,
    recipe: items.filter((entry) => entry.content_type === "recipe").length,
  };

  return (
    <main className="page">
      <section className="section page-hero compact-hero admin-hero">
        <p className="eyebrow">Admin / Items</p>
        <h1>Catalogo administrable</h1>
        <p className="lead">
          Vista interna para revisar items, recetas, drops, recursos y compras futuras. La edicion directa queda
          preparada para la siguiente fase con borradores de balance, auditoria y publicacion controlada.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/admin">Volver al panel</Link>
          <Link className="button secondary" href="/catalog?tipo=item">Ver catalogo publico</Link>
        </div>
      </section>

      <section className="section">
        <div className="stat-grid dashboard-stats">
          <div className="stat"><strong>{counts.all}</strong><span>Total</span></div>
          <div className="stat"><strong>{counts.craft}</strong><span>Crafteos</span></div>
          <div className="stat"><strong>{counts.drop}</strong><span>Drops</span></div>
          <div className="stat"><strong>{counts.resource}</strong><span>Recursos</span></div>
          <div className="stat"><strong>{counts.recipe}</strong><span>Recetas</span></div>
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Revision de balance</h2>
          <span className="count-badge">Solo lectura por ahora</span>
        </div>
        <div className="table-card admin-item-table">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Rareza</th>
                <th>Origen</th>
                <th>Rol</th>
                <th>Mundo</th>
                <th>Tier</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item) => (
                <tr key={`${item.content_type}:${item.content_key}`}>
                  <td>
                    <div className="identity-row">
                      <img className="mini-avatar" src={getCatalogImage(item)} alt="" />
                      <div>
                        <strong>{item.name_es}</strong>
                        <span>{item.content_key}</span>
                      </div>
                    </div>
                  </td>
                  <td>{getRarityLabel(item)}</td>
                  <td>{getSourceLabel(item)}</td>
                  <td>{getRoleLabel(item.role ?? item.category)}</td>
                  <td>{item.world_min}-{item.world_max}</td>
                  <td>{item.tier_min ?? "-"}-{item.tier_max ?? "-"}</td>
                  <td><span className="tag">Publicado</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>No hay items publicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function getRarityLabel(entry: { category: string | null; payload: Record<string, unknown> }) {
  const payloadRarity = entry.payload.rarity;
  const rarity = String(typeof payloadRarity === "string" ? payloadRarity : entry.category ?? "basic").toLowerCase();
  return rarityLabels[rarity] ?? rarity;
}

function getSourceLabel(entry: { content_type: string; payload: Record<string, unknown> }) {
  const source = getSourceValue(entry);
  if (entry.content_type === "recipe") return "Receta";
  if (source === "craft") return "Crafteo";
  if (source === "drop") return "Drop";
  if (source === "drop_resource") return "Recurso";
  if (source === "shop") return "Compra futura";
  return source || "Catalogo";
}

function getSourceValue(entry: { content_type: string; payload: Record<string, unknown> }) {
  const source = entry.payload.source;
  if (typeof source === "string") return source;
  if (entry.content_type === "recipe") return "recipe";
  return "";
}
