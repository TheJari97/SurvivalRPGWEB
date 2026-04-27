import Link from "next/link";
import { getPublishedChangeLog } from "../lib/content-catalog";

export default async function ChangeLogPage() {
  const changes = await getPublishedChangeLog();
  const grouped = changes.reduce<Record<string, typeof changes>>((acc, change) => {
    const key = change.version_key;
    acc[key] = acc[key] ?? [];
    acc[key].push(change);
    return acc;
  }, {});

  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Balance publicado</p>
        <h1>Changelog</h1>
        <p className="lead">
          Cambios de balance, buffs, nerfs y ajustes publicados desde Supabase. Esta pagina queda separada
          del catalogo para que los jugadores revisen la evolucion del modo por version.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/catalog">Ver catalogo</Link>
        </div>
      </section>

      <section className="section">
        {changes.length > 0 ? (
          <div className="timeline">
            {Object.entries(grouped).map(([versionKey, versionChanges]) => {
              const first = versionChanges[0];
              return (
                <article className="timeline-card" key={versionKey}>
                  <div className="timeline-head">
                    <div>
                      <p className="eyebrow">{versionKey}</p>
                      <h2>{first.version_title_es}</h2>
                      {first.version_summary_es ? <p>{first.version_summary_es}</p> : null}
                    </div>
                    <span className="tag">{first.published_at ? new Date(first.published_at).toLocaleDateString("es") : "Borrador"}</span>
                  </div>
                  <div className="change-list">
                    {versionChanges.map((change) => (
                      <div className="change-row" key={`${change.content_key}:${change.title_es}`}>
                        <span className={`change-pill change-${change.change_type.toLowerCase()}`}>{change.change_type}</span>
                        <div>
                          <strong>{change.title_es}</strong>
                          <p>{change.detail_es}</p>
                          <small>{change.content_type} / {change.content_key}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <article className="card">
            <p className="eyebrow">Sin cambios publicados</p>
            <h3>Todavia no hay changelog visible</h3>
            <p>Cuando se publique una version de balance en Supabase aparecera aqui.</p>
          </article>
        )}
      </section>
    </main>
  );
}
