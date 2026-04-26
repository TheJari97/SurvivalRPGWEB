import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurvivalRPG Dota",
  description: "SurvivalRPG Dota custom game portal",
};

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/rankings", label: "Rankings" },
  { href: "/catalog", label: "Catalogo" },
  { href: "/profile", label: "Perfil" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">SR</span>
              <span>SurvivalRPG Dota</span>
            </Link>
            <nav className="nav" aria-label="Principal">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
          <footer className="footer">
            SurvivalRPG Dota - temporada inicial, rankings publicos, progreso por SteamID y panel administrador en construccion.
          </footer>
        </div>
      </body>
    </html>
  );
}
