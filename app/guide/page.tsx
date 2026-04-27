import Link from "next/link";
import { getCurrentLanguage, getDictionary, translate } from "../lib/i18n";
import { homeScenes } from "../lib/visuals";

export default async function GuidePage() {
  const language = await getCurrentLanguage();
  const dictionary = getDictionary(language);
  const t = (key: string) => translate(dictionary, key);

  const steps = [1, 2, 3, 4, 5].map((step) => ({
    title: t(`guide.step${step}.title`),
    text: t(`guide.step${step}.text`),
  }));

  const sections = [
    {
      title: "1. Primeros pasos",
      lead: "Entra con Steam, elige un heroe y juega Mundo 1 hasta nivel 10.",
      image: homeScenes.login,
      rows: [
        "Cada SteamID guarda varios heroes, pero cada heroe tiene nivel, oro, inventario, misiones y mascota propia.",
        "El oro no se comparte entre heroes. Los cosmeticos de cuenta si podran compartirse cuando el sistema este listo.",
        "Mundo 1 limita el nivel a 10; Mundo 2 a 20, y asi hasta Mundo 10 con nivel 100.",
      ],
    },
    {
      title: "2. Drops, rareza y tiers",
      lead: "Rareza y tier no significan lo mismo.",
      image: homeScenes.zones,
      rows: [
        "Rareza es el color/familia del item: basico, comun, raro, epico, legendario y mitico.",
        "Tier es la calidad del roll interno de stats. Un item comun Tier 5 sigue siendo comun, pero con mejores numeros.",
        "Los monstruos normales dan materiales y drops base. Elites y jefes tienen mejores probabilidades y mejor tier.",
      ],
    },
    {
      title: "3. Crafteo",
      lead: "El NPC de crafteo crea items variables usando materiales.",
      image: homeScenes.crafting,
      rows: [
        "Cada receta pide materiales especificos. Al craftear, el resultado puede salir en distintos tiers.",
        "Los crafteos no son iguales a los items comprables. Los comprables tienen stats fijos y no se usan para recetas principales.",
        "Algunas recetas se desbloquearan por misiones, tiempo de zona, jefes o condiciones especiales.",
      ],
    },
    {
      title: "4. Fallo de crafteo y estabilizadores",
      lead: "Las piedras de estabilizacion reducen riesgo y ayudan a mejorar el resultado.",
      image: homeScenes.crafting,
      rows: [
        "Piedra de Estabilizacion Comun: cae desde Mundo 1 y ayuda en crafteos basicos/comunes.",
        "Piedra Azul de Mejora: cae desde Mundo 2 y permite empujar piezas comunes hacia raras.",
        "Piedra Morada de Ascenso: cae desde Mundo 4 y ayuda a convertir raro en epico.",
        "Nucleos dorados y fragmentos miticos aparecen en mundos altos para upgrades legendarios o miticos.",
      ],
    },
    {
      title: "5. Upgrades de rareza",
      lead: "Un item puede mejorar de color usando piedras y materiales del mundo correcto.",
      image: homeScenes.ranking,
      rows: [
        "Basico a comun: materiales de Mundo 1.",
        "Comun a raro: materiales de Mundo 2 o superior.",
        "Raro a epico: materiales de Mundo 4 o superior.",
        "Epico a legendario: materiales de Mundo 6 o superior.",
        "Legendario a mitico: materiales de Mundo 8 o superior.",
      ],
    },
    {
      title: "6. Tienda y pagos",
      lead: "La tienda publica queda bloqueada hasta cerrar seguridad, auditoria y entrega.",
      image: homeScenes.season,
      rows: [
        "La tienda de oro dentro del juego servira como ayuda, pero no vendera items crafteables.",
        "Los pagos reales quedan apagados hasta tener pasarela, auditoria, logs y entrega segura desde Supabase.",
        "Cosmeticos, donaciones, pase y moneda premium se activaran despues de probar bien el guardado.",
      ],
    },
  ];

  return (
    <main className="page">
      <section className="section page-hero compact-hero guide-hero">
        <p className="eyebrow">{t("guide.eyebrow")}</p>
        <h1>{t("guide.title")}</h1>
        <p className="lead">{t("guide.lead")}</p>
        <div className="actions">
          <Link className="button" href="/catalog?tipo=hero">{t("nav.catalog")}</Link>
          <Link className="button secondary" href="/profile">{t("nav.profile")}</Link>
        </div>
      </section>

      <section className="section">
        <div className="guide-grid">
          {steps.map((step) => (
            <article className="card guide-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="catalog-toolbar-line">
          <h2>Guia del jugador</h2>
          <span className="count-badge">Secciones desplegables</span>
        </div>
        <div className="guide-accordion">
          {sections.map((section) => (
            <details className="guide-detail" key={section.title} open>
              <summary>
                <img src={section.image} alt="" />
                <strong>{section.title}</strong>
                <span>{section.lead}</span>
              </summary>
              <ul className="plain-list">
                {section.rows.map((row) => <li key={row}>{row}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
