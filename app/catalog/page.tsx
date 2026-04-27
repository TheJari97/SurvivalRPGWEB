import { ContentCatalogEntry, getPayloadRecord, getPublishedChangeLog, getPublishedContent } from "../lib/content-catalog";

const typeLabels: Record<string, string> = {
  hero: "Heroes",
  item: "Items",
  recipe: "Recetas",
  pet: "Mascotas",
  monster: "Enemigos",
  quest: "Misiones",
  zone: "Zonas",
  world_level: "Mundos",
  system: "Sistemas",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string; q?: string }>;
}) {
  const params = await searchParams;
  const selectedType = params?.tipo ?? "all";
  const search = (params?.q ?? "").trim().toLowerCase();
  const [content, changes] = await Promise.all([
    getPublishedContent(),
    getPublishedChangeLog(),
  ]);
  const filtered = content.filter((entry) => {
    const matchesType = selectedType === "all" || entry.content_type === selectedType;
    const matchesSearch = !search || [
      entry.name_es,
      entry.summary_es ?? "",
      entry.category ?? "",
      entry.role ?? "",
      entry.content_key,
    ].some((value) => value.toLowerCase().includes(search));
    return matchesType && matchesSearch;
  });
  const types = ["all", ...Array.from(new Set(content.map((entry) => entry.content_type)))];

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Datos publicados desde Supabase</p>
        <h1>Catalogo</h1>
        <p className="lead">
          Heroes, items, recetas y cambios de balance salen de la BD. Los registros publicados son visibles
          para jugadores; los borradores quedan para el panel admin.
        </p>
      </section>

      <section className="section toolbar-section">
        <form className="toolbar" action="/catalog">
          <label className="field compact-field">
            <span>Buscar</span>
            <input className="input" name="q" placeholder="Item, rol, categoria..." type="search" defaultValue={params?.q ?? ""} />
          </label>
          <label className="field compact-field">
            <span>Tipo</span>
            <select className="input" name="tipo" defaultValue={selectedType}>
              {types.map((type) => (
                <option value={type} key={type}>{type === "all" ? "Todo" : typeLabels[type] ?? type}</option>
              ))}
            </select>
          </label>
          <button className="button" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="section">
        <h2>Contenido</h2>
        <div className="catalog-grid">
          {filtered.length > 0 ? filtered.map((entry) => <CatalogCard entry={entry} key={`${entry.content_type}:${entry.content_key}`} />) : (
            <article className="card">
              <p className="eyebrow">Sin resultados</p>
              <h3>No hay datos publicados con ese filtro</h3>
              <p>Prueba otra categoria o limpia la busqueda.</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Cambios de balance</h2>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Tipo</th>
                <th>Cambio</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {changes.length > 0 ? changes.map((change) => (
                <tr key={`${change.version_key}:${change.content_key}:${change.title_es}`}>
                  <td>{change.version_title_es}</td>
                  <td>{change.change_type}</td>
                  <td>{change.title_es}</td>
                  <td>{change.detail_es}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>Todavia no hay cambios publicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function CatalogCard({ entry }: { entry: ContentCatalogEntry }) {
  const source = String(entry.payload.source ?? "");
  const slot = String(entry.payload.slot ?? "");
  const statsByTier = getPayloadRecord(entry, "stats_by_tier");
  const fixedStats = getPayloadRecord(entry, "fixed_stats");
  const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
  const tierRoll = getPayloadRecord(entry, "tier_roll");
  const creates = typeof entry.payload.creates === "string" ? entry.payload.creates : "";
  const rarityClass = `rarity-${(entry.category ?? "basic").replace(/[^a-z0-9_-]/gi, "").toLowerCase()}`;

  return (
    <article className="catalog-card">
      <div className="catalog-card-main">
        <p className="eyebrow">{typeLabels[entry.content_type] ?? entry.content_type}</p>
        <h3 className={`item-name ${rarityClass}`}>{entry.name_es}</h3>
        <p>{entry.summary_es}</p>
        <div className="tag-row">
          {entry.category ? <span className="tag">{entry.category}</span> : null}
          {entry.role ? <span className="tag">{entry.role}</span> : null}
          {source ? <span className="tag">{source}</span> : null}
          {slot ? <span className="tag">{slot}</span> : null}
          {entry.tier_min && entry.tier_max ? <span className="tag">T{entry.tier_min}-T{entry.tier_max}</span> : null}
        </div>
      </div>

      <div className="hover-popover">
        <strong>{entry.name_es}</strong>
        <span>{entry.summary_es}</span>
        <span>Mundo {entry.world_min}-{entry.world_max}</span>
      </div>

      <details className="details-box">
        <summary>Detalle</summary>
        {Object.keys(fixedStats).length > 0 ? <StatBlock title="Stats fijos" stats={fixedStats} /> : null}
        {Object.keys(statsByTier).length > 0 ? (
          <div className="mini-section">
            <strong>Rangos por tier</strong>
            <div className="tier-grid">
              {Object.entries(statsByTier).map(([tier, stats]) => (
                <div className="tier-card" key={tier}>
                  <strong>Tier {tier}</strong>
                  <StatList stats={stats} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {materials.length > 0 ? (
          <div className="mini-section">
            <strong>Materiales</strong>
            <ul className="plain-list">
              {materials.map((material, index) => <li key={index}>{formatMaterial(material)}</li>)}
            </ul>
          </div>
        ) : null}
        {Object.keys(tierRoll).length > 0 ? <StatBlock title="Probabilidad de tier" stats={tierRoll} suffix="%" /> : null}
        {creates ? <p className="form-note">Crea: {creates}</p> : null}
      </details>
    </article>
  );
}

function StatBlock({ title, stats, suffix = "" }: { title: string; stats: Record<string, unknown>; suffix?: string }) {
  return (
    <div className="mini-section">
      <strong>{title}</strong>
      <StatList stats={stats} suffix={suffix} />
    </div>
  );
}

function StatList({ stats, suffix = "" }: { stats: unknown; suffix?: string }) {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) return null;
  return (
    <ul className="plain-list">
      {Object.entries(stats as Record<string, unknown>).map(([key, value]) => (
        <li key={key}>{key}: {formatStatValue(value, suffix)}</li>
      ))}
    </ul>
  );
}

function formatStatValue(value: unknown, suffix = "") {
  if (Array.isArray(value)) return `${value.join(" - ")}${suffix}`;
  if (typeof value === "object" && value) return JSON.stringify(value);
  return `${String(value)}${suffix}`;
}

function formatMaterial(material: unknown) {
  if (typeof material === "string") return material;
  if (material && typeof material === "object") {
    const record = material as Record<string, unknown>;
    return `${String(record.key ?? "material")} x${String(record.qty ?? 1)}`;
  }
  return String(material);
}
