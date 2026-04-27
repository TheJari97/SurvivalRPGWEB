import Link from "next/link";
import { getCurrentLanguage, getDictionary, translate } from "../lib/i18n";

export default async function GuidePage() {
  const language = await getCurrentLanguage();
  const dictionary = getDictionary(language);
  const t = (key: string) => translate(dictionary, key);

  const steps = [1, 2, 3, 4, 5].map((step) => ({
    title: t(`guide.step${step}.title`),
    text: t(`guide.step${step}.text`),
  }));

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
    </main>
  );
}
