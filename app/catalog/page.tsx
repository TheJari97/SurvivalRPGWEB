import { getPublishedChangeLog, getPublishedContent } from "../lib/content-catalog";
import { CatalogBrowser } from "./CatalogBrowser";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const params = await searchParams;
  const [content, changes] = await Promise.all([
    getPublishedContent(),
    getPublishedChangeLog(),
  ]);

  return (
    <main className="page">
      <section className="section page-hero compact-hero catalog-hero">
        <p className="eyebrow">Catalogo vivo</p>
        <h1>Catalogo</h1>
        <p className="lead">
          Items, crafteos, recursos, tienda, recetas y heroes publicados desde Supabase.
          Los filtros aplican al instante y cada registro abre una ventana con detalle completo.
        </p>
      </section>

      <CatalogBrowser content={content} changes={changes} initialType={params?.tipo ?? "item"} />
    </main>
  );
}
