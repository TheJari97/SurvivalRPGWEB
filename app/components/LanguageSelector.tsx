"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { languages, type LanguageCode } from "../lib/i18n-data";

export function LanguageSelector({ currentLanguage }: { currentLanguage: LanguageCode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeLanguage(language: string) {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    window.location.href = `/api/i18n/set?lang=${encodeURIComponent(language)}&next=${encodeURIComponent(next)}`;
  }

  return (
    <label className="language-select" aria-label="Idioma">
      <span>{languages.find((language) => language.code === currentLanguage)?.flag ?? "🌐"}</span>
      <select value={currentLanguage} onChange={(event) => changeLanguage(event.target.value)}>
        {languages.map((language) => (
          <option value={language.code} key={language.code}>
            {language.flag} {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
