import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityHeartbeat } from "./components/ActivityHeartbeat";
import { LanguageSelector } from "./components/LanguageSelector";
import { getAdminSession } from "./lib/admin-auth";
import { getCurrentLanguage, getDictionary, translate } from "./lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurvivalRPG",
  description: "SurvivalRPG Dota 2 custom game portal",
};

const navItems = [
  { href: "/", labelKey: "nav.home" },
  { href: "/rankings", labelKey: "nav.rankings" },
  { href: "/catalog", labelKey: "nav.catalog" },
  { href: "/players", labelKey: "nav.players" },
  { href: "/changelog", labelKey: "nav.changelog" },
  { href: "/guide", labelKey: "nav.guide" },
  { href: "/profile", labelKey: "nav.profile" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [adminSession, language] = await Promise.all([
    getAdminSession(),
    getCurrentLanguage(),
  ]);
  const dictionary = getDictionary(language);
  const t = (key: string) => translate(dictionary, key);

  return (
    <html lang={language}>
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-emblem" aria-hidden="true">
                <span>SR</span>
              </span>
              <span>SurvivalRPG</span>
            </Link>
            <nav className="nav" aria-label="Principal">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {t(item.labelKey)}
                </Link>
              ))}
              {adminSession ? <Link className="admin-nav-link" href="/admin">{t("nav.admin")}</Link> : null}
            </nav>
            <Suspense fallback={null}>
              <LanguageSelector currentLanguage={language} />
            </Suspense>
          </header>
          <Suspense fallback={null}>
            <ActivityHeartbeat />
          </Suspense>
          {children}
          <footer className="footer">
            {t("footer.summary")}
          </footer>
        </div>
      </body>
    </html>
  );
}
