export const languages = [
  { code: "es", label: "Espanol", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Francais", flag: "🇫🇷" },
  { code: "pt", label: "Portugues", flag: "🇧🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
] as const;

export type LanguageCode = typeof languages[number]["code"];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && languages.some((language) => language.code === value);
}
