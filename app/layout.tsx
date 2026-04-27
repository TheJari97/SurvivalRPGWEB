import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession } from "./lib/admin-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurvivalRPG",
  description: "SurvivalRPG Dota 2 custom game portal",
};

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/rankings", label: "Rankings" },
  { href: "/catalog", label: "Catalogo" },
  { href: "/players", label: "Jugadores" },
  { href: "/changelog", label: "Changelog" },
  { href: "/shop", label: "Tienda" },
  { href: "/profile", label: "Perfil" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const adminSession = await getAdminSession();

  return (
    <html lang="es">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">SR</span>
              <span className="brand-dota" aria-label="Dota 2">D2</span>
              <span>SurvivalRPG</span>
            </Link>
            <nav className="nav" aria-label="Principal">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              {adminSession ? <Link className="admin-nav-link" href="/admin">Admin</Link> : null}
            </nav>
          </header>
          {children}
          <footer className="footer">
            SurvivalRPG - custom game para Dota 2 con temporadas, rankings publicos, progreso por SteamID y panel administrador.
          </footer>
        </div>
      </body>
    </html>
  );
}
