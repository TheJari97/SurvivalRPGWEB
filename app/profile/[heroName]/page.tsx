import Link from "next/link";
import { redirect } from "next/navigation";
import { getHeroPayloadSection, getPlayerHeroDetail } from "../../lib/player-data";
import { getSteamUserSession } from "../../lib/steam-auth";

export default async function HeroDetailPage({
  params,
}: {
  params: Promise<{ heroName: string }>;
}) {
  const session = await getSteamUserSession();
  if (!session) redirect("/profile");

  const { heroName } = await params;
  const decodedHeroName = decodeURIComponent(heroName);
  const hero = await getPlayerHeroDetail(session.steamId, decodedHeroName);

  if (!hero) {
    return (
      <main className="page">
        <section className="section">
          <p className="eyebrow">Personaje</p>
          <h1>No encontrado</h1>
          <p className="lead">No hay guardado real para ese personaje en tu SteamID.</p>
          <div className="actions">
            <Link className="button secondary" href="/profile">Volver al perfil</Link>
          </div>
        </section>
      </main>
    );
  }

  const inventory = getHeroPayloadSection(hero, "inventory");
  const artifacts = getHeroPayloadSection(hero, "artifacts");
  const pets = getHeroPayloadSection(hero, "pets");
  const quests = getHeroPayloadSection(hero, "quests");

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Detalle de personaje</p>
        <h1>{hero.hero_name}</h1>
        <p className="lead">
          Datos guardados para tu SteamID. Esta vista crece a medida que el modo envie inventario,
          artefactos, mascotas, misiones y progreso mas detallado.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/profile">Volver al perfil</Link>
        </div>
      </section>

      <section className="section">
        <div className="stat-grid dashboard-stats">
          <div className="stat"><strong>{hero.level}</strong><span>Nivel</span></div>
          <div className="stat"><strong>{hero.gold}</strong><span>Oro</span></div>
          <div className="stat"><strong>{hero.world_level}</strong><span>Mundo</span></div>
          <div className="stat"><strong>{hero.zone_unlocked}</strong><span>Zona</span></div>
          <div className="stat"><strong>{hero.gear_score}</strong><span>Gear</span></div>
          <div className="stat"><strong>{hero.skill_points}</strong><span>Puntos</span></div>
        </div>
      </section>

      <DetailSection title="Items" value={inventory} empty="Sin items guardados." />
      <DetailSection title="Artefactos" value={artifacts} empty="Sin artefactos guardados." />
      <DetailSection title="Mascotas" value={pets} empty="Sin mascotas guardadas." />
      <DetailSection title="Misiones" value={quests} empty="Sin misiones guardadas." />
    </main>
  );
}

function DetailSection({ title, value, empty }: { title: string; value: unknown; empty: string }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="table-card detail-json">
        {renderValue(value, empty)}
      </div>
    </section>
  );
}

function renderValue(value: unknown, empty: string) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p>{empty}</p>;
    return (
      <div className="grid">
        {value.map((item, index) => (
          <article className="card" key={index}>
            <pre>{JSON.stringify(item, null, 2)}</pre>
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
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </article>
        ))}
      </div>
    );
  }

  return <p>{empty}</p>;
}
