import { ContentCatalogEntry } from "./content-catalog";

const cdn = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react";
const assets = "/assets/survival-rpg";

const heroImages: Record<string, string> = {
  guardian_de_hierro: `${cdn}/heroes/axe.png`,
  vigilante_del_alba: `${cdn}/heroes/drow_ranger.png`,
  tejedor_vital: `${cdn}/heroes/dazzle.png`,
  corte_umbrio: `${cdn}/heroes/riki.png`,
  arcanista_del_claro: `${cdn}/heroes/lina.png`,
  portador_de_estandarte: `${cdn}/heroes/omniknight.png`,
};

const itemImages: Record<string, string> = {
  iron_heart_plate: `${cdn}/items/heart.png`,
  dawnstring_bow: `${cdn}/items/butterfly.png`,
  vital_weaver_charm: `${cdn}/items/holy_locket.png`,
  clear_arcane_focus: `${cdn}/items/kaya.png`,
  umbra_step_boots: `${cdn}/items/phase_boots.png`,
  bannerbearer_crest: `${cdn}/items/vladmir.png`,
  apprentice_guard_vest: `${cdn}/items/vanguard.png`,
  hunter_training_blade: `${cdn}/items/yasha.png`,
  wild_core: `${cdn}/items/ultimate_orb.png`,
  zone_1_essence: `${cdn}/items/energy_booster.png`,
};

const roleLabels: Record<string, string> = {
  tank: "Tanque",
  ranged_dps: "DPS rango",
  general_dps: "DPS",
  assassin: "Asesino",
  mage: "Mago",
  healer: "Healer",
  support: "Soporte",
  general_survival: "Supervivencia",
  resource: "Recurso",
};

export const homeScenes = {
  season: `${assets}/01_backgrounds/section_16x9/section_hub_1280x720.png`,
  crafting: `${assets}/01_backgrounds/cards_1x1/card_forge_1024x1024.png`,
  ranking: `${assets}/01_backgrounds/cards_1x1/card_world_map_1024x1024.png`,
  pets: `${assets}/01_backgrounds/cards_1x1/card_forest_1024x1024.png`,
  hero: `${assets}/01_backgrounds/hero_16x9/hero_hub_1920x1080.png`,
  guide: `${assets}/01_backgrounds/banners_21x9/banner_world_map_2100x900.png`,
  login: `${assets}/01_backgrounds/hero_16x9/hero_steam_login_1920x1080.png`,
  zones: `${assets}/01_backgrounds/banners_21x9/banner_world_map_2100x900.png`,
};

export function getCatalogImage(entry: ContentCatalogEntry) {
  const payloadImage = entry.payload.image_url;
  if (typeof payloadImage === "string" && payloadImage) return payloadImage;
  if (entry.content_type === "hero") return heroImages[entry.content_key] ?? `${cdn}/heroes/wisp.png`;
  if (entry.content_type === "recipe") return `${cdn}/items/recipe.png`;
  if (entry.content_type === "pet") return `${assets}/05_placeholders/placeholder_monster_unknown.png`;
  if (entry.content_type === "artifact") return `${assets}/02_logos_and_icons/navigation/nav_map.png`;
  if (entry.content_type === "zone") return `${assets}/05_placeholders/placeholder_zone_unknown.png`;
  if (entry.content_type === "badge") return `${assets}/02_logos_and_icons/navigation/nav_season.png`;
  if (entry.content_type === "achievement") return `${assets}/02_logos_and_icons/navigation/nav_guides.png`;
  if (entry.content_type === "season") return `${assets}/02_logos_and_icons/navigation/nav_season.png`;
  return itemImages[entry.content_key] ?? `${cdn}/items/ultimate_orb.png`;
}

export function getRoleLabel(role?: string | null) {
  if (!role) return "General";
  return roleLabels[role] ?? role;
}

export function getEntryAttribute(entry: Pick<ContentCatalogEntry, "content_type" | "role" | "category">) {
  const value = `${entry.role ?? ""} ${entry.category ?? ""}`.toLowerCase();
  if (/mage|healer|support|mago|curacion|soporte/.test(value)) return "inteligencia";
  if (/assassin|ranged|dps|agility|asesino|rango/.test(value)) return "agilidad";
  if (/tank|survival|strength|tanque|supervivencia/.test(value)) return "fuerza";
  return "neutral";
}

export function getEntrySource(entry: ContentCatalogEntry) {
  const source = entry.payload.source;
  if (typeof source === "string") return source;
  if (entry.content_type === "recipe") return "recipe";
  if (entry.content_type === "hero") return "hero";
  return "";
}

export function getEffectKeys(entry: ContentCatalogEntry) {
  const stats = entry.payload.stats_by_tier ?? entry.payload.buffs_by_tier;
  const fixed = entry.payload.fixed_stats;
  const keys = new Set<string>();

  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    for (const tierStats of Object.values(stats as Record<string, unknown>)) {
      if (tierStats && typeof tierStats === "object" && !Array.isArray(tierStats)) {
        Object.keys(tierStats).forEach((key) => keys.add(key));
      }
    }
  }

  if (fixed && typeof fixed === "object" && !Array.isArray(fixed)) {
    Object.keys(fixed).forEach((key) => keys.add(key));
  }

  return [...keys].sort();
}
