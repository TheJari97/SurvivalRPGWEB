"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { BalanceChangeLogEntry, ContentCatalogEntry } from "../lib/content-catalog";
import { getCatalogImage, getEffectKeys, getEntryAttribute, getEntrySource, getRoleLabel } from "../lib/visuals";

type CatalogBrowserProps = {
  content: ContentCatalogEntry[];
  changes: BalanceChangeLogEntry[];
  initialType: string;
};

const typeLabels: Record<string, string> = {
  hero: "Heroes",
  item: "Items",
  recipe: "Recetas",
  pet: "Mascotas",
  monster: "Enemigos",
  quest: "Misiones",
  zone: "Zonas",
  world_level: "Mundos",
  ability: "Habilidades",
  resource: "Recursos",
  craft: "Crafteos",
  shop: "Tienda",
};

const catalogTabs = [
  { key: "item", label: "Items" },
  { key: "craft", label: "Crafteos" },
  { key: "resource", label: "Recursos" },
  { key: "shop", label: "Tienda" },
  { key: "recipe", label: "Recetas" },
  { key: "hero", label: "Heroes" },
];

const attributes = ["all", "fuerza", "agilidad", "inteligencia", "neutral"];

export function CatalogBrowser({ content, changes, initialType }: CatalogBrowserProps) {
  const initialTab = catalogTabs.some((tab) => tab.key === initialType) ? initialType : "item";
  const [selectedType, setSelectedType] = useState(initialTab);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedAttribute, setSelectedAttribute] = useState("all");
  const [selectedEffect, setSelectedEffect] = useState("all");
  const [selectedWorld, setSelectedWorld] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<ContentCatalogEntry | null>(null);

  const roles = useMemo(
    () => unique(["all", ...content.map((entry) => entry.role ?? entry.category ?? "").filter(Boolean)]),
    [content],
  );
  const effects = useMemo(
    () => unique(["all", ...content.flatMap(getEffectKeys)]).slice(0, 40),
    [content],
  );
  const worlds = useMemo(
    () => unique(["all", ...content.flatMap((entry) => [String(entry.world_min), String(entry.world_max)])])
      .filter((value) => value === "all" || (/^\d+$/.test(value) && Number(value) > 0))
      .sort((a, b) => a === "all" ? -1 : b === "all" ? 1 : Number(a) - Number(b)),
    [content],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return content.filter((entry) => {
      const matchesType = matchesCatalogType(entry, selectedType);
      const matchesRole = selectedRole === "all" || entry.role === selectedRole || entry.category === selectedRole;
      const matchesAttribute = selectedAttribute === "all" || getEntryAttribute(entry) === selectedAttribute;
      const matchesEffect = selectedEffect === "all" || getEffectKeys(entry).includes(selectedEffect);
      const matchesWorld = selectedWorld === "all"
        || (Number(selectedWorld) >= entry.world_min && Number(selectedWorld) <= entry.world_max);
      const matchesSearch = !query || [
        entry.name_es,
        entry.summary_es ?? "",
        entry.category ?? "",
        entry.role ?? "",
        entry.content_key,
        getEntrySource(entry),
        getEffectKeys(entry).join(" "),
      ].some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesRole && matchesAttribute && matchesEffect && matchesWorld && matchesSearch;
    });
  }, [content, search, selectedAttribute, selectedEffect, selectedRole, selectedType, selectedWorld]);

  const grouped = useMemo(() => groupCatalog(filtered, selectedType), [filtered, selectedType]);

  function clearFilters() {
    setSearch("");
    setSelectedRole("all");
    setSelectedAttribute("all");
    setSelectedEffect("all");
    setSelectedWorld("all");
  }

  return (
    <>
      <nav className="subnav catalog-subnav" aria-label="Subsecciones de catalogo">
        {catalogTabs.map((tab) => (
          <button
            className={selectedType === tab.key ? "active" : ""}
            key={tab.key}
            onClick={() => setSelectedType(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="section toolbar-section">
        <div className="toolbar elevated-toolbar catalog-filter-panel">
          <label className="field compact-field">
            <span>Buscar</span>
            <input
              className="input"
              placeholder="Nombre, rol, stat, categoria..."
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field compact-field">
            <span>Mundo</span>
            <select className="input" value={selectedWorld} onChange={(event) => setSelectedWorld(event.target.value)}>
              {worlds.map((world) => <option value={world} key={world}>{world === "all" ? "Todos" : `Mundo ${world}`}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Rol</span>
            <select className="input" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              {roles.map((role) => <option value={role} key={role}>{role === "all" ? "Todos" : getRoleLabel(role)}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Atributo</span>
            <select className="input" value={selectedAttribute} onChange={(event) => setSelectedAttribute(event.target.value)}>
              {attributes.map((attr) => <option value={attr} key={attr}>{attr === "all" ? "Todos" : attr}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Efecto</span>
            <select className="input" value={selectedEffect} onChange={(event) => setSelectedEffect(event.target.value)}>
              {effects.map((effect) => <option value={effect} key={effect}>{effect === "all" ? "Todos" : effect}</option>)}
            </select>
          </label>
          <button className="button secondary" type="button" onClick={clearFilters}>Limpiar filtros</button>
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>{typeLabels[selectedType] ?? "Contenido"}</h2>
          <span className="count-badge">{filtered.length} registros</span>
        </div>

        {grouped.length > 0 ? grouped.map((group) => (
          <section className="catalog-group" key={group.key}>
            <div className="catalog-group-head">
              <span className="count-badge">{group.label}</span>
              <span className="tag">{group.entries.length}</span>
            </div>
            <div className="catalog-grid compact-catalog-grid">
              {group.entries.map((entry) => (
                <CatalogCard
                  content={content}
                  entry={entry}
                  key={`${entry.content_type}:${entry.content_key}`}
                  onOpen={() => setSelectedEntry(entry)}
                />
              ))}
            </div>
          </section>
        )) : (
          <article className="card empty-state-card">
            <p className="eyebrow">Sin resultados</p>
            <h3>No hay datos publicados con ese filtro</h3>
            <p>Prueba otra categoria o limpia la busqueda.</p>
          </article>
        )}
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

      {selectedEntry ? (
        <CatalogModal content={content} entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      ) : null}
    </>
  );
}

function CatalogCard({
  content,
  entry,
  onOpen,
}: {
  content: ContentCatalogEntry[];
  entry: ContentCatalogEntry;
  onOpen: () => void;
}) {
  const image = getCatalogImage(entry);
  const source = getEntrySource(entry);
  const slot = String(entry.payload.slot ?? "");
  const effects = getEffectKeys(entry);
  const previewStats = getPreviewStats(entry);
  const usedFor = findEntriesUsingMaterial(content, entry.content_key);
  const rarityClass = `rarity-${(entry.category ?? "basic").replace(/[^a-z0-9_-]/gi, "").toLowerCase()}`;

  return (
    <article className="catalog-card compact-catalog-card vivid-card">
      <button className="catalog-card-button" type="button" onClick={onOpen}>
        <img className="catalog-thumb compact-thumb" src={image} alt="" />
        <div className="compact-card-body">
          <p className="eyebrow">{typeLabels[entry.content_type] ?? entry.content_type}</p>
          <h3 className={`item-name ${rarityClass}`}>{entry.name_es}</h3>
          <p>{entry.summary_es}</p>
          <div className="tag-row">
            {entry.category ? <span className="tag">{entry.category}</span> : null}
            {entry.role ? <span className="tag">{getRoleLabel(entry.role)}</span> : null}
            <span className="tag">Mundo {entry.world_min}-{entry.world_max}</span>
            {source ? <span className="tag">{source}</span> : null}
            {slot ? <span className="tag">{slot}</span> : null}
          </div>
        </div>
      </button>

      <div className="hover-popover rich-popover catalog-hover">
        <img className="mini-avatar" src={image} alt="" />
        <div>
          <strong>{entry.name_es}</strong>
          <span>{entry.summary_es}</span>
          {previewStats.length > 0 ? <span>Stats: {previewStats.join(", ")}</span> : null}
          {effects.length > 0 ? <span>Efectos: {effects.slice(0, 5).join(", ")}</span> : null}
          {usedFor.length > 0 ? <span>Sirve para: {usedFor.slice(0, 3).map((item) => item.name_es).join(", ")}</span> : null}
        </div>
      </div>
    </article>
  );
}

function CatalogModal({
  content,
  entry,
  onClose,
}: {
  content: ContentCatalogEntry[];
  entry: ContentCatalogEntry;
  onClose: () => void;
}) {
  const image = getCatalogImage(entry);
  const statsByTier = asRecord(entry.payload.stats_by_tier);
  const fixedStats = asRecord(entry.payload.fixed_stats);
  const tierRoll = asRecord(entry.payload.tier_roll);
  const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
  const abilities = Array.isArray(entry.payload.abilities) ? entry.payload.abilities : [];
  const creates = typeof entry.payload.creates === "string" ? entry.payload.creates : "";
  const uses = Array.isArray(entry.payload.uses) ? entry.payload.uses.map(String) : [];
  const usedFor = findEntriesUsingMaterial(content, entry.content_key);
  const createsEntry = creates ? content.find((candidate) => candidate.content_key === creates) : null;
  const effects = getEffectKeys(entry);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="catalog-modal" role="dialog" aria-modal="true" aria-label={entry.name_es} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-block">
            <img className="catalog-thumb modal-thumb" src={image} alt="" />
            <div>
              <p className="eyebrow">{typeLabels[entry.content_type] ?? entry.content_type}</p>
              <h2>{entry.name_es}</h2>
              <p>{entry.summary_es}</p>
              <div className="tag-row">
                {entry.category ? <span className="tag">{entry.category}</span> : null}
                {entry.role ? <span className="tag">{getRoleLabel(entry.role)}</span> : null}
                <span className="tag">Mundo {entry.world_min}-{entry.world_max}</span>
                {entry.tier_min && entry.tier_max ? <span className="tag">Tier {entry.tier_min}-{entry.tier_max}</span> : null}
                <span className="tag">{getEntryAttribute(entry)}</span>
              </div>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">X</button>
        </div>

        <div className="modal-scroll">
          {effects.length > 0 ? <ModalSection title="Efectos"><p>{effects.join(", ")}</p></ModalSection> : null}
          {Object.keys(fixedStats).length > 0 ? <ModalSection title="Stats fijos"><StatList stats={fixedStats} /></ModalSection> : null}
          {Object.keys(statsByTier).length > 0 ? (
            <ModalSection title="Rangos por tier">
              <div className="tier-grid modal-tier-grid">
                {Object.entries(statsByTier).map(([tier, stats]) => (
                  <div className="tier-card" key={tier}>
                    <strong>Tier {tier}</strong>
                    <StatList stats={stats} />
                  </div>
                ))}
              </div>
            </ModalSection>
          ) : null}
          {materials.length > 0 ? (
            <ModalSection title="Materiales usados para crearlo">
              <ul className="plain-list">
                {materials.map((material, index) => <li key={index}>{formatMaterial(material, content)}</li>)}
              </ul>
            </ModalSection>
          ) : null}
          {Object.keys(tierRoll).length > 0 ? <ModalSection title="Probabilidad de tier"><StatList stats={tierRoll} suffix="%" /></ModalSection> : null}
          {createsEntry ? (
            <ModalSection title="Resultado de receta">
              <LinkedEntry entry={createsEntry} />
            </ModalSection>
          ) : creates ? (
            <ModalSection title="Resultado de receta"><p>{creates}</p></ModalSection>
          ) : null}
          {uses.length > 0 ? (
            <ModalSection title="Evoluciona hacia">
              <div className="linked-entry-grid">
                {uses.map((key) => {
                  const target = content.find((candidate) => candidate.content_key === key);
                  return target ? <LinkedEntry entry={target} key={key} /> : <span className="tag" key={key}>{key}</span>;
                })}
              </div>
            </ModalSection>
          ) : null}
          {usedFor.length > 0 ? (
            <ModalSection title="Items que se pueden craftear usando esto">
              <div className="linked-entry-grid">
                {usedFor.map((target) => <LinkedEntry entry={target} key={`${target.content_type}:${target.content_key}`} />)}
              </div>
            </ModalSection>
          ) : null}
          {abilities.length > 0 ? (
            <ModalSection title="Habilidades registradas">
              <div className="linked-entry-grid">
                {abilities.map((ability, index) => <AbilityBlock ability={ability} key={index} />)}
              </div>
            </ModalSection>
          ) : null}
          <ModalSection title="Datos estructurados">
            <pre>{JSON.stringify(entry.payload, null, 2)}</pre>
          </ModalSection>
        </div>
      </section>
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="modal-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function LinkedEntry({ entry }: { entry: ContentCatalogEntry }) {
  return (
    <div className="linked-entry">
      <img className="mini-avatar" src={getCatalogImage(entry)} alt="" />
      <div>
        <strong>{entry.name_es}</strong>
        <span>{entry.summary_es}</span>
      </div>
    </div>
  );
}

function AbilityBlock({ ability }: { ability: unknown }) {
  const record = asRecord(ability);
  return (
    <div className="ability-block">
      <strong>{String(record.name ?? record.key ?? "Habilidad")}</strong>
      <span>{String(record.type ?? "activa")} / {String(record.target ?? "self")}</span>
      {record.description ? <p>{String(record.description)}</p> : null}
    </div>
  );
}

function matchesCatalogType(entry: ContentCatalogEntry, selectedType: string) {
  const source = getEntrySource(entry);
  if (selectedType === "resource") return entry.content_type === "item" && (entry.category === "resource" || source === "drop_resource");
  if (selectedType === "craft") return entry.content_type === "item" && source === "craft";
  if (selectedType === "shop") return entry.content_type === "item" && source === "shop";
  if (selectedType === "item") {
    return entry.content_type === "item"
      && entry.category !== "resource"
      && source !== "craft"
      && source !== "shop"
      && source !== "drop_resource";
  }
  return entry.content_type === selectedType;
}

function groupCatalog(entries: ContentCatalogEntry[], selectedType: string) {
  const groups = new Map<string, ContentCatalogEntry[]>();
  for (const entry of entries) {
    const key = getGroupKey(entry, selectedType);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .map(([key, groupEntries]) => ({
      key,
      label: getGroupLabel(key),
      entries: groupEntries.sort((a, b) => a.name_es.localeCompare(b.name_es)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getGroupKey(entry: ContentCatalogEntry, selectedType: string) {
  if (selectedType === "hero") return getEntryAttribute(entry);
  if (selectedType === "resource") return entry.category ?? "resource";
  return entry.role ?? entry.category ?? entry.content_type;
}

function getGroupLabel(key: string) {
  const labels: Record<string, string> = {
    fuerza: "Fuerza",
    agilidad: "Agilidad",
    inteligencia: "Inteligencia",
    neutral: "Neutral",
    resource: "Recursos",
  };
  return labels[key] ?? getRoleLabel(key);
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

function getPreviewStats(entry: ContentCatalogEntry) {
  const fixedStats = asRecord(entry.payload.fixed_stats);
  if (Object.keys(fixedStats).length > 0) {
    return Object.entries(fixedStats).slice(0, 4).map(([key, value]) => `${key} ${formatStatValue(value)}`);
  }
  const statsByTier = asRecord(entry.payload.stats_by_tier);
  const firstTier = Object.values(statsByTier)[0];
  return Object.entries(asRecord(firstTier)).slice(0, 4).map(([key, value]) => `${key} ${formatStatValue(value)}`);
}

function findEntriesUsingMaterial(content: ContentCatalogEntry[], materialKey: string) {
  return content.filter((entry) => {
    const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
    return materials.some((material) => getMaterialKey(material) === materialKey);
  });
}

function formatMaterial(material: unknown, content: ContentCatalogEntry[]) {
  const key = getMaterialKey(material);
  const qty = getMaterialQty(material);
  const entry = content.find((candidate) => candidate.content_key === key);
  return `${entry?.name_es ?? key} x${qty}`;
}

function getMaterialKey(material: unknown) {
  if (typeof material === "string") return material;
  if (material && typeof material === "object") {
    const record = material as Record<string, unknown>;
    return String(record.key ?? record.item ?? record.material ?? "");
  }
  return String(material);
}

function getMaterialQty(material: unknown) {
  if (material && typeof material === "object") {
    const record = material as Record<string, unknown>;
    return String(record.qty ?? record.quantity ?? 1);
  }
  return "1";
}

function formatStatValue(value: unknown, suffix = "") {
  if (Array.isArray(value)) return `${value.join(" - ")}${suffix}`;
  if (typeof value === "object" && value) return JSON.stringify(value);
  return `${String(value)}${suffix}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function unique(values: string[]) {
  return [...new Set(values)];
}
