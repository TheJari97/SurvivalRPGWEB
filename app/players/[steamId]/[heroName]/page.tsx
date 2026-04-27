import Link from "next/link";
import { getHeroPayloadSectionFromPayload, getPublicPlayerHeroDetail } from "../../../lib/player-data";

export default async function PublicHeroPage({
  params,
}: {
  params: Promise<{ steamId: string; heroName: string }>;
}) {
  const { steamId, heroName } = await params;
  const decodedSteamId = decodeURIComponent(steamId);
  const decodedHeroName = decodeURIComponent(heroName);
  const hero = await getPublicPlayerHeroDetail(decodedSteamId, decodedHeroName);

  if (!hero) {
    return (
      <main className="page">
        <section className="section">
          <p className="eyebrow">Personaje publico</p>
          <h1>No encontrado</h1>
          <p className="lead">No hay guardado publico para ese personaje.</p>
          <div className="actions">
            <Link className="button secondary" href={`/players/${encodeURIComponent(decodedSteamId)}`}>Volver al perfil</Link>
          </div>
        </section>
      </main>
    );
  }

  const inventory = getHeroPayloadSectionFromPayload(hero.payload, hero.hero_name, "inventory");
  const artifacts = getHeroPayloadSectionFromPayload(hero.payload, hero.hero_name, "artifacts");
  const pets = getHeroPayloadSectionFromPayload(hero.payload, hero.hero_name, "pets");
  const quests = getHeroPayloadSectionFromPayload(hero.payload, hero.hero_name, "quests");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Personaje publico</p>
        <h1>{hero.hero_name}</h1>
        <p className="lead">
          Vista publica sin oro ni datos privados. Sirve para compartir avance, build visible,
          mundo, zona, mascotas y misiones sin permitir edicion.
        </p>
        <div className="actions">
          <Link className="button secondary" href={`/players/${encodeURIComponent(decodedSteamId)}`}>Volver al perfil</Link>
        </div>
      </section>

      <section className="section">
        <div className="stat-grid dashboard-stats">
          <div className="stat"><strong>{hero.level}</strong><span>Nivel</span></div>
          <div className="stat"><strong>{hero.world_level}</strong><span>Mundo</span></div>
          <div className="stat"><strong>{hero.zone_unlocked}</strong><span>Zona</span></div>
          <div className="stat"><strong>{hero.gear_score}</strong><span>Gear</span></div>
          <div className="stat"><strong>{hero.skill_points}</strong><span>Puntos</span></div>
          <div className="stat"><strong>{hero.last_save_at ? new Date(hero.last_save_at).toLocaleDateString("es") : "Sin guardar"}</strong><span>Ultimo guardado</span></div>
        </div>
      </section>

      <PublicDetailSection title="Items visibles" value={inventory} empty="Sin items publicos." />
      <PublicDetailSection title="Artefactos visibles" value={artifacts} empty="Sin artefactos publicos." />
      <PublicDetailSection title="Mascotas visibles" value={pets} empty="Sin mascotas publicas." />
      <PublicDetailSection title="Misiones visibles" value={quests} empty="Sin misiones publicas." />
    </main>
  );
}

function PublicDetailSection({ title, value, empty }: { title: string; value: unknown; empty: string }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="table-card detail-json">
        {renderPublicValue(value, empty)}
      </div>
    </section>
  );
}

function renderPublicValue(value: unknown, empty: string) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p>{empty}</p>;
    return (
      <div className="grid">
        {value.map((item, index) => (
          <article className="card" key={index}>
            <pre>{JSON.stringify(redactPrivateFields(item), null, 2)}</pre>
          </article>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <p>{empty}</p>;
    return (
      <div className="grid">
        {entries.map(([key, item]) => (
          <article className="card" key={key}>
            <h3>{key}</h3>
            <pre>{JSON.stringify(redactPrivateFields(item), null, 2)}</pre>
          </article>
        ))}
      </div>
    );
  }

  return <p>{empty}</p>;
}

function redactPrivateFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPrivateFields);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
    if (["gold", "oro", "currency", "wallet", "payload"].includes(key.toLowerCase())) return acc;
    acc[key] = redactPrivateFields(item);
    return acc;
  }, {});
}
