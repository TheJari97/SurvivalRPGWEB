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

type CatalogGroup = {
  key: string;
  label: string;
  description: string;
  entries: ContentCatalogEntry[];
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
  artifact: "Artefactos",
  badge: "Insignias",
  achievement: "Logros",
  season: "Temporadas",
};

const catalogTabs = [
  { key: "item", label: "Items" },
  { key: "craft", label: "Crafteos" },
  { key: "resource", label: "Recursos" },
  { key: "recipe", label: "Recetas" },
  { key: "hero", label: "Heroes" },
  { key: "pet", label: "Mascotas" },
  { key: "artifact", label: "Artefactos" },
  { key: "zone", label: "Zonas" },
  { key: "badge", label: "Insignias" },
  { key: "achievement", label: "Logros" },
];

const attributes = ["all", "fuerza", "agilidad", "inteligencia", "neutral"];
const rarityOrder = ["basic", "common", "rare", "epic", "legendary", "mythic", "ancient", "resource"];

const rarityLabels: Record<string, string> = {
  basic: "Basico",
  common: "Comun",
  rare: "Raro",
  epic: "Epico",
  legendary: "Legendario",
  mythic: "Mitico",
  ancient: "Antiguo",
  resource: "Recurso",
};

const categoryLabels: Record<string, string> = {
  teleport: "Zonas por teleport",
  teleport_zone: "Zonas por teleport",
  pet: "Mascotas",
  hero_artifact: "Artefactos de heroe",
  pet_artifact: "Artefactos de mascota",
  staff: "Staff",
  season: "Temporada",
  support: "Apoyo",
  ranking: "Ranking",
  combat: "Combate",
  progress: "Progreso",
  crafting: "Crafteo",
  zone: "Zona",
  artifact: "Artefacto",
  account: "Cuenta",
};

const statMeta: Record<string, { label: string; kind: string; unit?: string; detail: string }> = {
  damage: { label: "Daño fisico", kind: "valor fijo", detail: "Aumenta el daño de ataque basico o golpes fisicos." },
  spell_damage: { label: "Daño magico", kind: "valor fijo", detail: "Aumenta habilidades magicas y efectos de hechizo." },
  team_damage: { label: "Daño de equipo", kind: "porcentaje", unit: "%", detail: "Bonifica el daño que el grupo aplica a objetivos marcados." },
  attack_speed: { label: "Velocidad de ataque", kind: "valor fijo", detail: "Sube puntos de velocidad de ataque." },
  attack_range: { label: "Rango de ataque", kind: "valor fijo", detail: "Aumenta la distancia de ataque para heroes de rango." },
  health: { label: "Vida maxima", kind: "valor fijo", detail: "Aumenta la vida maxima del personaje." },
  health_restore: { label: "Restauracion de vida", kind: "valor fijo", detail: "Recupera vida al usar el item o consumible." },
  armor: { label: "Armadura fisica", kind: "valor fijo", detail: "Reduce daño fisico recibido." },
  magic_resistance: { label: "Resistencia magica", kind: "porcentaje", unit: "%", detail: "Reduce daño magico recibido." },
  resistance: { label: "Resistencia mixta", kind: "porcentaje", unit: "%", detail: "Mitiga daño fisico y magico menor segun balance del item." },
  physical_block: { label: "Bloqueo fisico", kind: "valor fijo", detail: "Bloquea una parte del daño fisico entrante." },
  threat: { label: "Amenaza generada", kind: "valor fijo", detail: "Ayuda al tanque a mantener enemigos atacandolo." },
  threat_reduction: { label: "Reduccion de amenaza", kind: "porcentaje", unit: "%", detail: "Reduce la probabilidad de que enemigos cambien hacia ese heroe." },
  mana: { label: "Mana maximo", kind: "valor fijo", detail: "Aumenta el mana disponible para habilidades." },
  mana_regen: { label: "Regeneracion de mana", kind: "valor fijo", detail: "Aumenta mana recuperado por segundo." },
  cooldown_reduction: { label: "Reduccion de enfriamiento", kind: "porcentaje", unit: "%", detail: "Reduce cooldowns de habilidades." },
  control_power: { label: "Potencia de control", kind: "valor fijo", detail: "Mejora duracion o fuerza de slows, empujes y disables." },
  healing_power: { label: "Potencia de curacion", kind: "valor fijo", detail: "Aumenta curaciones directas y periodicas." },
  aoe_healing: { label: "Curacion en area", kind: "porcentaje", unit: "%", detail: "Mejora curas que afectan a varios aliados." },
  shield_power: { label: "Potencia de escudo", kind: "valor fijo", detail: "Aumenta absorcion de barreras y protecciones." },
  aura_power: { label: "Potencia de aura", kind: "valor fijo", detail: "Mejora auras defensivas, ofensivas o de utilidad del equipo." },
  utility: { label: "Utilidad", kind: "valor fijo", detail: "Mejora rescates, marcas, movilidad, control suave y herramientas de soporte." },
  movement_speed: { label: "Velocidad de movimiento", kind: "valor fijo", detail: "Aumenta movilidad para reposicionarse o kitear." },
  evasion: { label: "Evasion", kind: "porcentaje", unit: "%", detail: "Da probabilidad de evitar ataques fisicos." },
};

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
        getRarity(entry),
        getEffectKeys(entry).join(" "),
      ].some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesRole && matchesAttribute && matchesEffect && matchesWorld && matchesSearch;
    });
  }, [content, search, selectedAttribute, selectedEffect, selectedRole, selectedType, selectedWorld]);

  const grouped = useMemo(() => groupCatalog(filtered, selectedType, content), [content, filtered, selectedType]);

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

      <section className="section toolbar-section sticky-filter-section">
        <div className="toolbar elevated-toolbar catalog-filter-panel">
          <label className="field compact-field">
            <span>Buscar</span>
            <input
              className="input"
              placeholder="Nombre, rareza, stat, origen..."
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
              {attributes.map((attr) => <option value={attr} key={attr}>{attr === "all" ? "Todos" : getAttributeLabel(attr)}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Efecto</span>
            <select className="input" value={selectedEffect} onChange={(event) => setSelectedEffect(event.target.value)}>
              {effects.map((effect) => <option value={effect} key={effect}>{effect === "all" ? "Todos" : getStatLabel(effect)}</option>)}
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

        {selectedType === "item" ? (
          <p className="catalog-note">
            Items muestra drops, crafteos y compras futuras juntos, separados por rareza. La rareza es el color/familia del item;
            el tier es el roll interno de stats que puede salir al dropear o craftear.
          </p>
        ) : null}

        {grouped.length > 0 ? grouped.map((group) => (
          <details className="catalog-group" key={group.key} open>
            <summary className="catalog-group-head">
              <span>
                <strong>{group.label}</strong>
                {group.description ? <small>{group.description}</small> : null}
              </span>
              <span className="tag">{group.entries.length}</span>
            </summary>
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
          </details>
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
  const rarity = getRarity(entry);
  const rarityClass = `rarity-${rarity}`;

  return (
    <article className={`catalog-card compact-catalog-card vivid-card ${rarityClass}`}>
      <button className="catalog-card-button" type="button" onClick={onOpen}>
        <img className="catalog-thumb compact-thumb" src={image} alt="" />
        <div className="compact-card-body">
          <p className="eyebrow">{getSourceLabel(entry)}</p>
          <h3 className="item-name">{entry.name_es}</h3>
          <p>{entry.summary_es}</p>
          <div className="tag-row">
            <span className={`tag rarity-tag ${rarityClass}`}>{getRarityLabel(rarity)}</span>
            {entry.role ? <span className="tag">{getRoleLabel(entry.role)}</span> : null}
            <span className="tag">Mundo {entry.world_min}-{entry.world_max}</span>
            {source ? <span className="tag">{getSourceShortLabel(source)}</span> : null}
            {slot ? <span className="tag">{slot}</span> : null}
          </div>
        </div>
      </button>

      <div className="hover-popover rich-popover catalog-hover">
        <img className="mini-avatar" src={image} alt="" />
        <div>
          <strong>{entry.name_es}</strong>
          <span>{entry.summary_es}</span>
          <span>Rareza: {getRarityLabel(rarity)} / Origen: {getSourceLabel(entry)}</span>
          {previewStats.length > 0 ? <span>Stats: {previewStats.join(", ")}</span> : null}
          {effects.length > 0 ? <span>Efectos: {effects.slice(0, 5).map(getStatLabel).join(", ")}</span> : null}
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
  const rawStatsByTier = asRecord(entry.payload.stats_by_tier);
  const statsByTier = Object.keys(rawStatsByTier).length > 0 ? rawStatsByTier : asRecord(entry.payload.buffs_by_tier);
  const fixedStats = asRecord(entry.payload.fixed_stats);
  const tierRoll = asRecord(entry.payload.tier_roll);
  const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
  const abilities = Array.isArray(entry.payload.abilities) ? entry.payload.abilities : [];
  const creates = typeof entry.payload.creates === "string" ? entry.payload.creates : "";
  const uses = Array.isArray(entry.payload.uses) ? entry.payload.uses.map(String) : [];
  const usedFor = findEntriesUsingMaterial(content, entry.content_key);
  const createsEntry = creates ? content.find((candidate) => candidate.content_key === creates) : null;
  const effects = getEffectKeys(entry);
  const rarity = getRarity(entry);
  const upgradeNotes = getUpgradeNotes(entry);
  const acquisitionRows = getAcquisitionRows(entry);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="catalog-modal" role="dialog" aria-modal="true" aria-label={entry.name_es} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-block">
            <img className="catalog-thumb modal-thumb" src={image} alt="" />
            <div>
              <p className="eyebrow">{getSourceLabel(entry)}</p>
              <h2>{entry.name_es}</h2>
              <p>{entry.summary_es}</p>
              <div className="tag-row">
                <span className={`tag rarity-tag rarity-${rarity}`}>{getRarityLabel(rarity)}</span>
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
          {entry.content_type === "item" ? (
            <ModalSection title="Como leer este item">
              <p>
                Rareza es el color/familia del item. Tier es la calidad del roll de stats dentro de esa rareza.
                Un crafteo o drop puede salir con mejores tiers; subir de rareza requiere materiales de upgrade.
              </p>
            </ModalSection>
          ) : null}

          {acquisitionRows.length > 0 ? (
            <ModalSection title="Donde se consigue y probabilidad">
              <div className="acquisition-grid">
                {acquisitionRows.map((row) => (
                  <div className="acquisition-row" key={`${row.source}:${row.chance}`}>
                    <strong>{row.source}</strong>
                    <span>{row.chance}</span>
                    <p>{row.note}</p>
                  </div>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {effects.length > 0 ? (
            <ModalSection title="Efectos principales">
              <div className="stat-chip-grid">
                {effects.map((effect) => (
                  <div className="stat-chip" key={effect}>
                    <strong>{getStatLabel(effect)}</strong>
                    <span>{getStatDetail(effect)}</span>
                  </div>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {Object.keys(fixedStats).length > 0 ? (
            <ModalSection title="Stats fijos">
              <StatList stats={fixedStats} mode="fixed" />
            </ModalSection>
          ) : null}

          {Object.keys(statsByTier).length > 0 ? (
            <ModalSection title="Rangos por tier">
              <p className="section-help">
                Cada tier mejora el rango numerico. Si el item sale Tier 1 queda en el tramo bajo; si sale Tier alto,
                sus stats nacen mas cerca del maximo de esa rareza.
              </p>
              <div className="tier-grid modal-tier-grid">
                {Object.entries(statsByTier).map(([tier, stats]) => (
                  <div className="tier-card" key={tier}>
                    <strong>Tier {tier}</strong>
                    <StatList stats={stats} mode="variable" />
                  </div>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {Object.keys(tierRoll).length > 0 ? (
            <ModalSection title="Probabilidad de tier al craftear">
              <StatList stats={tierRoll} mode="chance" suffix="%" />
              <p className="section-help">
                Las piedras de estabilizacion reducen la probabilidad de fallo o empujan el resultado hacia tiers mejores,
                segun el mundo donde se consigan.
              </p>
            </ModalSection>
          ) : null}

          {materials.length > 0 || createsEntry || usedFor.length > 0 || uses.length > 0 ? (
            <ModalSection title="Rama de crafteo y upgrades">
              <CraftFlow
                content={content}
                entry={entry}
                materials={materials}
                createsEntry={createsEntry}
                creates={creates}
                usedFor={usedFor}
                uses={uses}
              />
            </ModalSection>
          ) : null}

          {upgradeNotes.length > 0 ? (
            <ModalSection title="Mejora de rareza">
              <div className="upgrade-grid">
                {upgradeNotes.map((note) => (
                  <div className="upgrade-note" key={note.title}>
                    <strong>{note.title}</strong>
                    <span>{note.detail}</span>
                  </div>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {abilities.length > 0 ? (
            <ModalSection title="Habilidades registradas">
              <div className="ability-grid">
                {abilities.map((ability, index) => <AbilityBlock ability={ability} key={index} />)}
              </div>
            </ModalSection>
          ) : null}
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
  const rarity = getRarity(entry);
  return (
    <div className={`linked-entry rarity-${rarity}`}>
      <img className="mini-avatar" src={getCatalogImage(entry)} alt="" />
      <div>
        <strong>{entry.name_es}</strong>
        <span>{getRarityLabel(rarity)} / {entry.summary_es}</span>
      </div>
    </div>
  );
}

function CraftFlow({
  content,
  entry,
  materials,
  createsEntry,
  creates,
  usedFor,
  uses,
}: {
  content: ContentCatalogEntry[];
  entry: ContentCatalogEntry;
  materials: unknown[];
  createsEntry: ContentCatalogEntry | null | undefined;
  creates: string;
  usedFor: ContentCatalogEntry[];
  uses: string[];
}) {
  const materialEntries = materials.map((material) => {
    const key = getMaterialKey(material);
    return {
      key,
      qty: getMaterialQty(material),
      entry: content.find((candidate) => candidate.content_key === key),
    };
  });
  const useEntries = uses
    .map((key) => content.find((candidate) => candidate.content_key === key))
    .filter((candidate): candidate is ContentCatalogEntry => Boolean(candidate));
  const nextEntries = uniqueEntries([...usedFor, ...useEntries]);

  return (
    <div className="craft-flow">
      <div className="flow-column">
        <strong>Materiales</strong>
        {materialEntries.length > 0 ? materialEntries.map((material) => (
          <div className="flow-node" key={material.key}>
            {material.entry ? <img className="mini-avatar" src={getCatalogImage(material.entry)} alt="" /> : <span className="mini-avatar fallback">M</span>}
            <span>{material.entry?.name_es ?? material.key} x{material.qty}</span>
          </div>
        )) : <span className="flow-empty">No usa materiales directos.</span>}
      </div>
      <div className="flow-line" aria-hidden="true" />
      <div className="flow-column">
        <strong>Resultado actual</strong>
        <LinkedEntry entry={createsEntry ?? entry} />
        {creates && !createsEntry ? <span className="tag">{creates}</span> : null}
      </div>
      <div className="flow-line" aria-hidden="true" />
      <div className="flow-column">
        <strong>Puede continuar hacia</strong>
        {nextEntries.length > 0 ? nextEntries.slice(0, 6).map((target) => (
          <LinkedEntry entry={target} key={`${target.content_type}:${target.content_key}`} />
        )) : <span className="flow-empty">Esta rama termina aqui por ahora.</span>}
      </div>
    </div>
  );
}

function AbilityBlock({ ability }: { ability: unknown }) {
  const record = asRecord(ability);
  const name = String(record.name ?? record.key ?? "Habilidad");
  const type = String(record.type ?? "activa");
  const target = String(record.target ?? "self");
  const slot = String(record.slot ?? "");
  const maxLevel = Number(record.max_level ?? 5);
  const levels = Array.isArray(record.levels) ? record.levels.map(String) : getFallbackAbilityLevels(type, target, maxLevel);

  return (
    <div className="ability-block">
      <div>
        <strong>{slot ? `${slot} - ${name}` : name}</strong>
        <span>{getAbilityTypeLabel(type)} / {getTargetLabel(target)} / Max nivel {maxLevel}</span>
      </div>
      {record.description ? <p>{String(record.description)}</p> : null}
      <ul className="plain-list ability-levels">
        {levels.slice(0, maxLevel).map((level, index) => (
          <li key={`${name}:${index}`}>Nivel {index + 1}: {level}</li>
        ))}
      </ul>
    </div>
  );
}

function matchesCatalogType(entry: ContentCatalogEntry, selectedType: string) {
  const source = getEntrySource(entry);
  if (selectedType === "resource") return entry.content_type === "item" && (entry.category === "resource" || source === "drop_resource");
  if (selectedType === "craft") return entry.content_type === "item" && source === "craft";
  if (selectedType === "item") {
    return entry.content_type === "item" && entry.category !== "resource" && source !== "drop_resource";
  }
  return entry.content_type === selectedType;
}

function groupCatalog(entries: ContentCatalogEntry[], selectedType: string, content: ContentCatalogEntry[]): CatalogGroup[] {
  const groups = new Map<string, ContentCatalogEntry[]>();
  for (const entry of entries) {
    const key = getGroupKey(entry, selectedType, content);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .map(([key, groupEntries]) => ({
      key,
      label: getGroupLabel(key, selectedType),
      description: getGroupDescription(key, selectedType),
      entries: groupEntries.sort(sortCatalogEntries),
    }))
    .sort((a, b) => groupSortValue(a.key) - groupSortValue(b.key) || a.label.localeCompare(b.label));
}

function getGroupKey(entry: ContentCatalogEntry, selectedType: string, content: ContentCatalogEntry[]) {
  if (selectedType === "hero") return getEntryAttribute(entry);
  if (selectedType === "resource") return `world_${entry.world_min}`;
  if (selectedType === "zone") return "teleport";
  if (selectedType === "pet") return entry.role ?? "pet";
  if (selectedType === "badge" || selectedType === "achievement") return entry.category ?? selectedType;
  if (selectedType === "recipe") {
    const creates = typeof entry.payload.creates === "string" ? entry.payload.creates : "";
    const target = content.find((candidate) => candidate.content_key === creates);
    return getRarity(target ?? entry);
  }
  return getRarity(entry);
}

function getGroupLabel(key: string, selectedType: string) {
  if (key.startsWith("world_")) return `Mundo ${key.replace("world_", "")}`;
  const labels: Record<string, string> = {
    fuerza: "Fuerza",
    agilidad: "Agilidad",
    inteligencia: "Inteligencia",
    neutral: "Neutral",
  };
  if (selectedType === "hero") return labels[key] ?? key;
  if (selectedType === "zone") return categoryLabels[key] ?? "Zonas por teleport";
  if (selectedType === "pet") return getRoleLabel(key);
  if (selectedType === "badge" || selectedType === "achievement") return categoryLabels[key] ?? getRoleLabel(key);
  return getRarityLabel(key);
}

function getGroupDescription(key: string, selectedType: string) {
  return "";
}

function groupSortValue(key: string) {
  if (key.startsWith("world_")) return Number(key.replace("world_", "")) + 100;
  const index = rarityOrder.indexOf(key);
  return index >= 0 ? index : 999;
}

function sortCatalogEntries(a: ContentCatalogEntry, b: ContentCatalogEntry) {
  return groupSortValue(getRarity(a)) - groupSortValue(getRarity(b))
    || getSourceLabel(a).localeCompare(getSourceLabel(b))
    || a.name_es.localeCompare(b.name_es);
}

function StatList({ stats, suffix = "", mode }: { stats: unknown; suffix?: string; mode: "fixed" | "variable" | "chance" }) {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) return null;
  return (
    <ul className="plain-list stat-list">
      {Object.entries(stats as Record<string, unknown>).map(([key, value]) => (
        <li key={key}>
          <strong>{mode === "chance" ? `Tier ${key}` : getStatLabel(key)}</strong>
          <span>{formatStatValue(key, value, suffix, mode)}</span>
          {mode !== "chance" ? <small>{getStatDetail(key)}</small> : null}
        </li>
      ))}
    </ul>
  );
}

function getPreviewStats(entry: ContentCatalogEntry) {
  const fixedStats = asRecord(entry.payload.fixed_stats);
  if (Object.keys(fixedStats).length > 0) {
    return Object.entries(fixedStats).slice(0, 4).map(([key, value]) => `${getStatLabel(key)} ${formatStatValue(key, value, "", "fixed")}`);
  }
  const statsByTier = asRecord(entry.payload.stats_by_tier);
  const petBuffsByTier = asRecord(entry.payload.buffs_by_tier);
  const tierSource = Object.keys(statsByTier).length > 0 ? statsByTier : petBuffsByTier;
  const firstTier = Object.values(tierSource)[0];
  return Object.entries(asRecord(firstTier)).slice(0, 4).map(([key, value]) => `${getStatLabel(key)} ${formatStatValue(key, value, "", "variable")}`);
}

function findEntriesUsingMaterial(content: ContentCatalogEntry[], materialKey: string) {
  return content.filter((entry) => {
    const materials = Array.isArray(entry.payload.materials) ? entry.payload.materials : [];
    return materials.some((material) => getMaterialKey(material) === materialKey);
  });
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

function formatStatValue(key: string, value: unknown, suffix = "", mode: "fixed" | "variable" | "chance") {
  const meta = statMeta[key];
  const unit = suffix || meta?.unit || "";
  if (mode === "chance") return `${String(value)}${unit} de probabilidad`;
  if (Array.isArray(value)) {
    return `${value.join(" a ")}${unit} (${meta?.kind ?? "rango variable"})`;
  }
  if (typeof value === "object" && value) return describeObjectValue(value);
  return `${String(value)}${unit} (${mode === "fixed" ? "valor fijo" : meta?.kind ?? "valor"})`;
}

function describeObjectValue(value: unknown) {
  const record = asRecord(value);
  const parts = Object.entries(record).map(([key, nested]) => `${key}: ${String(nested)}`);
  return parts.join(", ");
}

function getRarity(entry: ContentCatalogEntry) {
  const payloadRarity = entry.payload.rarity;
  const candidate = typeof payloadRarity === "string" ? payloadRarity : entry.category;
  const normalized = String(candidate ?? "basic").toLowerCase();
  if (normalized === "resource") return "resource";
  if (rarityOrder.includes(normalized)) return normalized;
  return normalized || "basic";
}

function getRarityLabel(rarity: string) {
  return rarityLabels[rarity] ?? rarity;
}

function getSourceLabel(entry: ContentCatalogEntry) {
  const source = getEntrySource(entry);
  if (entry.content_type === "hero") return "Heroe jugable";
  if (entry.content_type === "recipe") return "Receta";
  if (entry.content_type === "ability") return "Habilidad";
  if (entry.content_type === "pet") return "Mascota";
  if (entry.content_type === "artifact") return entry.category === "pet_artifact" ? "Artefacto de mascota" : "Artefacto de heroe";
  if (entry.content_type === "badge") return "Insignia";
  if (entry.content_type === "achievement") return "Logro";
  if (entry.content_type === "zone") return "Zona por teleport";
  if (source === "craft") return "Crafteo";
  if (source === "drop") return "Drop";
  if (source === "drop_resource") return "Material de drop";
  if (source === "shop") return "Compra futura";
  if (source === "quest_or_drop") return "Mision o drop";
  if (source === "drop_or_achievement") return "Drop o logro";
  if (source === "achievement_or_role") return "Logro o rol";
  if (source === "achievement_system") return "Sistema de logros";
  return typeLabels[entry.content_type] ?? entry.content_type;
}

function getSourceShortLabel(source: string) {
  const labels: Record<string, string> = {
    craft: "Crafteo",
    drop: "Drop",
    drop_resource: "Recurso",
    shop: "Compra futura",
    recipe: "Receta",
    hero: "Heroe",
    quest_or_drop: "Mision/drop",
    drop_or_achievement: "Drop/logro",
    achievement_or_role: "Logro/rol",
    achievement_system: "Logro",
  };
  return labels[source] ?? source;
}

function getStatLabel(key: string) {
  return statMeta[key]?.label ?? key.replace(/_/g, " ");
}

function getStatDetail(key: string) {
  return statMeta[key]?.detail ?? "Stat especial del sistema de balance.";
}

function getAttributeLabel(attribute: string) {
  const labels: Record<string, string> = {
    fuerza: "Fuerza",
    agilidad: "Agilidad",
    inteligencia: "Inteligencia",
    neutral: "Neutral",
  };
  return labels[attribute] ?? attribute;
}

function getAcquisitionRows(entry: ContentCatalogEntry) {
  const rarity = getRarity(entry);
  const source = getEntrySource(entry);
  const chance = getChanceByRarity(rarity);
  if (entry.content_type === "hero") {
    return [{ source: "Seleccion de heroe", chance: "Disponible al iniciar", note: "Cada heroe guarda progreso, oro, inventario, misiones y mascota activa por SteamID." }];
  }
  if (entry.content_type === "recipe") {
    return [
      { source: "NPC de recetas", chance: "Desbloqueo por mision o logro", note: "Algunas recetas se muestran, pero quedan bloqueadas hasta cumplir condiciones de zona, jefe o tiempo." },
    ];
  }
  if (source === "craft") {
    return [
      { source: "NPC de crafteo", chance: "Resultado variable Tier 1 a 5", note: "Usa materiales listados. El item puede salir con distintos tiers de stats." },
      { source: "Mitigacion de fallo", chance: "Piedras de estabilizacion", note: "Las piedras reducen fallos o ayudan a mejorar el roll; caen segun mundo y rareza desbloqueada." },
    ];
  }
  if (source === "shop") {
    return [
      { source: "Tienda futura de oro", chance: "Compra fija", note: "No se craftea, no se usa como material principal y no compite con drops/crafteos." },
    ];
  }
  if (source === "drop_resource") {
    return [
      { source: `Campamentos Mundo ${entry.world_min}`, chance: chance.normal, note: "Material de farmeo normal para recetas y upgrades." },
      { source: "Elites y jefes de zona", chance: chance.eliteBoss, note: "Mayor probabilidad que un monstruo normal; sube con nivel de mundo." },
    ];
  }
  if (source === "drop") {
    return [
      { source: "Monstruos normales", chance: chance.normal, note: "Puede caer en campamentos del mundo indicado." },
      { source: "Elites", chance: chance.elite, note: "Mejor tasa y mejor posibilidad de tier alto." },
      { source: "Jefe de zona", chance: chance.boss, note: "El jefe se mata una vez; luego queda reemplazado por elite fuerte." },
    ];
  }
  return [];
}

function getChanceByRarity(rarity: string) {
  const chances: Record<string, { normal: string; elite: string; boss: string; eliteBoss: string }> = {
    basic: { normal: "38% base", elite: "52% base", boss: "72% base", eliteBoss: "52% a 72% base" },
    common: { normal: "24% base", elite: "36% base", boss: "58% base", eliteBoss: "36% a 58% base" },
    rare: { normal: "6% base", elite: "18% base", boss: "32% base", eliteBoss: "18% a 32% base" },
    epic: { normal: "1.5% base", elite: "7% base", boss: "18% base", eliteBoss: "7% a 18% base" },
    legendary: { normal: "0.2% base", elite: "1.5% base", boss: "5% base", eliteBoss: "1.5% a 5% base" },
    mythic: { normal: "Solo eventos", elite: "0.5% base", boss: "2% base", eliteBoss: "0.5% a 2% base" },
    resource: { normal: "30% a 55% base", elite: "60% base", boss: "80% base", eliteBoss: "60% a 80% base" },
  };
  return chances[rarity] ?? chances.common;
}

function getUpgradeNotes(entry: ContentCatalogEntry) {
  if (entry.content_type !== "item") return [];
  const source = getEntrySource(entry);
  if (entry.category === "resource" || source === "drop_resource") return [];
  const rarity = getRarity(entry);
  const chain: Record<string, { title: string; detail: string }> = {
    basic: { title: "Basico a Comun", detail: "Usa Piedra de Afinado Comun. Empieza a caer en Mundo 1." },
    common: { title: "Comun a Raro", detail: "Usa Piedra Azul de Mejora. Se desbloquea desde Mundo 2." },
    rare: { title: "Raro a Epico", detail: "Usa Piedra Morada de Ascenso. Se desbloquea desde Mundo 4." },
    epic: { title: "Epico a Legendario", detail: "Usa Nucleo Dorado de Ascenso. Se desbloquea desde Mundo 6." },
    legendary: { title: "Legendario a Mitico", detail: "Usa Fragmento Mitico de Temporada. Se desbloquea desde Mundo 8." },
  };
  const current = chain[rarity];
  return current ? [current, { title: "Balance", detail: "Al subir rareza aumentan rangos de stats y puede agregarse un efecto secundario." }] : [];
}

function getFallbackAbilityLevels(type: string, target: string, maxLevel: number) {
  const passive = type.toLowerCase().includes("pasiva");
  const area = target.toLowerCase().includes("aoe") || target.toLowerCase().includes("aura");
  const rows = [
    passive ? "Activa el efecto pasivo base." : "Desbloquea el efecto base de la habilidad.",
    area ? "Aumenta radio o duracion y mejora el valor principal." : "Aumenta el valor principal de daño, cura, escudo o control.",
    "Reduce enfriamiento o mejora consistencia del efecto.",
    area ? "Agrega mejora de equipo o control adicional." : "Agrega efecto secundario segun rol del heroe.",
    "Nivel maximo: mejora fuerte para Mundo alto y escalado de temporada.",
  ];
  return rows.slice(0, maxLevel);
}

function getAbilityTypeLabel(type: string) {
  if (type.toLowerCase().includes("pasiva")) return "Pasiva";
  return "Activa";
}

function getTargetLabel(target: string) {
  const labels: Record<string, string> = {
    self: "propio heroe",
    single: "objetivo unico",
    aoe: "area",
    ally: "aliado",
    line: "linea",
    aura: "aura",
  };
  return labels[target] ?? target;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function uniqueEntries(entries: ContentCatalogEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.content_type}:${entry.content_key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
