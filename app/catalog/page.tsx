import Link from "next/link";
import { ContentCatalogEntry, getPayloadRecord, getPublishedChangeLog, getPublishedContent } from "../lib/content-catalog";
import { getCatalogImage, getEffectKeys, getEntryAttribute, getEntrySource, getRoleLabel } from "../lib/visuals";

const typeLabels: Record<string, string> = {
  hero: "Heroes",
  item: "Items",
  recipe: "Recetas",
  pet: "Mascotas",
  monster: "Enemigos",
  quest: "Misiones",
  zone: "Zonas",
  world_level: "Mundos",
  resource: "Recursos",
  craft: "Crafteos",
  shop: "Tienda",
};

const catalogTabs = [
  { key: "all", label: "Todo" },
  { key: "item", label: "Items generales" },
  { key: "craft", label: "Crafteos" },
  { key: "resource", label: "Recursos" },
  { key: "shop", label: "Tienda" },
  { key: "recipe", label: "Recetas" },
  { key: "hero", label: "Heroes" },
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string; q?: string; rol?: string; atributo?: string; efecto?: string }>;
}) {
  const params = await searchParams;
  const selectedType = params?.tipo ?? "all";
  const selectedRole = params?.rol ?? "all";
  const selectedAttribute = params?.atributo ?? "all";
  const selectedEffect = params?.efecto ?? "all";
  const search = (params?.q ?? "").trim().toLowerCase();
  const [content, changes] = await Promise.all([
    getPublishedContent(),
    getPublishedChangeLog(),
  ]);
  const roles = unique(["all", ...content.map((entry) => entry.role ?? entry.category ?? "").filter(Boolean)]);
  const effects = unique(["all", ...content.flatMap(getEffectKeys)]).slice(0, 18);
  const filtered = content.filter((entry) => {
    const matchesType = matchesCatalogType(entry, selectedType);
    const matchesRole = selectedRole === "all" || entry.role === selectedRole || entry.category === selectedRole;
    const matchesAttribute = selectedAttribute === "all" || getEntryAttribute(entry) === selectedAttribute;
    const matchesEffect = selectedEffect === "all" || getEffectKeys(entry).includes(selectedEffect);
    const matchesSearch = !search || [
      entry.name_es,
      entry.summary_es ?? "",
      entry.category ?? "",
      entry.role ?? "",
      entry.content_key,
      getEntrySource(entry),
      getEffectKeys(entry).join(" "),
    ].some((value) => value.toLowerCase().includes(search));
    return matchesType && matchesRole && matchesAttribute && matchesEffect && matchesSearch;
  });

  return (
    <main className="page">
      <section className="section page-hero compact-hero catalog-hero">
        <p className="eyebrow">Catalogo vivo</p>
        <h1>Catalogo</h1>
        <p className="lead">
          Items, crafteos, recursos, tienda y heroes publicados desde Supabase, con filtros por rol,
          atributo, efecto y origen.
        </p>
      </section>

      <nav className="subnav catalog-subnav" aria-label="Subsecciones de catalogo">
        {catalogTabs.map((tab) => (
          <Link className={selectedType === tab.key ? "active" : ""} href={`/catalog?tipo=${tab.key}`} key={tab.key}>
            {tab.label}
          </Link>
        ))}
      </nav>

      <section className="section toolbar-section">
        <form className="toolbar elevated-toolbar" action="/catalog">
          <input name="tipo" type="hidden" value={selectedType} />
          <label className="field compact-field">
            <span>Buscar</span>
            <input className="input" name="q" placeholder="Item, rol, stat, categoria..." type="search" defaultValue={params?.q ?? ""} />
          </label>
          <label className="field compact-field">
            <span>Rol</span>
            <select className="input" name="rol" defaultValue={selectedRole}>
              {roles.map((role) => <option value={role} key={role}>{role === "all" ? "Todos" : getRoleLabel(role)}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Atributo</span>
            <select className="input" name="atributo" defaultValue={selectedAttribute}>
              {["all", "fuerza", "agilidad", "inteligencia", "neutral"].map((attr) => (
                <option value={attr} key={attr}>{attr === "all" ? "Todos" : attr}</option>
              ))}
            </select>
          </label>
          <label className="field compact-field">
            <span>Efecto</span>
            <select className="input" name="efecto" defaultValue={selectedEffect}>
              {effects.map((effect) => <option value={effect} key={effect}>{effect === "all" ? "Todos" : effect}</option>)}
            </select>
          </label>
          <button className="button" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>{typeLabels[selectedType] ?? "Contenido"}</h2>
          <span className="count-badge">{filtered.length} registros</span>
        </div>
        <div className="catalog-grid">
          {filtered.length > 0 ? filtered.map((entry) => <CatalogCard entry={entry} key={`${entry.content_type}:${entry.content_key}`} />) : (
            <article className="card empty-state-card">
              <p className="eyebrow">Sin resultados</p>
              <h3>No hay datos publicados con ese filtro</h3>
              <p>Prueba otra categoria o limpia la busqueda.</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Cambios de balance</h2>
          <Link className="button secondary" href="/changelog">Ver changelog</Link>
        </div>
        <div className="change-strip">
          {changes.length > 0 ? changes.slice(0, 4).map((change) => (
            <article className="change-mini" key={`${change.version_key}:${change.content_key}:${change.title_es}`}>
              <span className={`change-pill change-${change.change_type.toLowerCase()}`}>{change.change_type}</span>
              <strong>{change.title_es}</strong>
              <p>{change.detail_es}</p>
            </article>
          )) : (
            <article className="card"><p>Todavia no hay cambios publicados.</p></article>
          )}
        </div>
      </section>
    </main>
  );
}

function CatalogCard({ entry }: { entry: ContentCatalogEntry }) {
  const image = getCatalogImage(entry);
  const source = getEntrySource(entry);
  const slot = String(entry.payload.slot ?? "");
  const statsByTier = getPayloadRecord(entry, "stats_by_tier");
  const fixedStats = getPayloadRecord(entry, "fixed_stats");
  const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
  const tierRoll = getPayloadRecord(entry, "tier_roll");
  const creates = typeof entry.payload.creates === "string" ? entry.payload.creates : "";
  const effects = getEffectKeys(entry);
  const rarityClass = `rarity-${(entry.category ?? "basic").replace(/[^a-z0-9_-]/gi, "").toLowerCase()}`;

  return (
    <article className="catalog-card vivid-card">
      <div className="catalog-card-main item-card-layout">
        <img className="catalog-thumb" src={image} alt="" />
        <div>
          <p className="eyebrow">{typeLabels[entry.content_type] ?? entry.content_type}</p>
          <h3 className={`item-name ${rarityClass}`}>{entry.name_es}</h3>
          <p>{entry.summary_es}</p>
          <div className="tag-row">
            {entry.category ? <span className="tag">{entry.category}</span> : null}
            {entry.role ? <span className="tag">{getRoleLabel(entry.role)}</span> : null}
            <span className="tag">{getEntryAttribute(entry)}</span>
            {source ? <span className="tag">{source}</span> : null}
            {slot ? <span className="tag">{slot}</span> : null}
            {entry.tier_min && entry.tier_max ? <span className="tag">T{entry.tier_min}-T{entry.tier_max}</span> : null}
          </div>
        </div>
      </div>

      <div className="hover-popover rich-popover">
        <img className="mini-avatar" src={image} alt="" />
        <strong>{entry.name_es}</strong>
        <span>{entry.summary_es}</span>
        <span>Mundo {entry.world_min}-{entry.world_max}</span>
      </div>

      <details className="details-box">
        <summary>Detalle completo</summary>
        {effects.length > 0 ? <p className="form-note">Efectos: {effects.join(", ")}</p> : null}
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

function matchesCatalogType(entry: ContentCatalogEntry, selectedType: string) {
  const source = getEntrySource(entry);
  if (selectedType === "all") return true;
  if (selectedType === "resource") return entry.content_type === "item" && (entry.category === "resource" || source === "drop");
  if (selectedType === "craft") return entry.content_type === "item" && source === "craft";
  if (selectedType === "shop") return entry.content_type === "item" && source === "shop";
  if (selectedType === "item") return entry.content_type === "item" && entry.category !== "resource";
  return entry.content_type === selectedType;
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

function unique(values: string[]) {
  return [...new Set(values)];
}
