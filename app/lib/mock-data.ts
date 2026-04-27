export const seasonStats = [
  { label: "Mundo maximo", value: "10" },
  { label: "Nivel maximo", value: "100" },
  { label: "Zonas planificadas", value: "10" },
  { label: "Autosave", value: "10 min" },
];

export const rankings = [
  { rank: 1, player: "TheJari97", hero: "Guardian de Hierro", level: 10, world: 1, gear: 420 },
  { rank: 2, player: "Bosque Vivo", hero: "Vigilante del Alba", level: 9, world: 1, gear: 360 },
  { rank: 3, player: "Forja Clara", hero: "Tejedor Vital", level: 8, world: 1, gear: 315 },
  { rank: 4, player: "Sombra Norte", hero: "Corte Umbrio", level: 7, world: 1, gear: 280 },
];

export const heroRoles = [
  {
    name: "Guardian de Hierro",
    role: "Tank",
    text: "Controla amenaza, aguanta golpes y abre espacio para el equipo.",
    tags: ["vida", "armadura", "aggro"],
  },
  {
    name: "Vigilante del Alba",
    role: "DPS rango",
    text: "Escala con rango, velocidad de ataque y posicionamiento.",
    tags: ["rango", "velocidad", "critico"],
  },
  {
    name: "Tejedor Vital",
    role: "Healer",
    text: "Sostiene al equipo con curacion, mana y reduccion de amenaza.",
    tags: ["curacion", "mana", "soporte"],
  },
  {
    name: "Corte Umbrio",
    role: "Assassin",
    text: "Busca ventanas de dano, movilidad y evasion.",
    tags: ["evasion", "burst", "movilidad"],
  },
  {
    name: "Arcanista del Claro",
    role: "Mage",
    text: "Usa dano magico, control y escalado de atributo principal.",
    tags: ["magia", "mana", "control"],
  },
  {
    name: "Portador de Estandarte",
    role: "Support",
    text: "Aporta utilidad, buffs futuros y seguridad para el equipo.",
    tags: ["aura", "utilidad", "resistencia"],
  },
];

export const adminSections = [
  "Bienvenida",
  "Jugadores",
  "Cuentas",
  "Progreso",
  "Sanciones",
  "Balance",
  "Enemigos",
  "Items",
  "Misiones",
  "Temporadas",
  "Pagos",
  "Auditoria",
];
