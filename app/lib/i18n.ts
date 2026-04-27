import { cookies } from "next/headers";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import fr from "../i18n/fr.json";
import pt from "../i18n/pt.json";
import ru from "../i18n/ru.json";
import { isLanguageCode, type LanguageCode } from "./i18n-data";

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  de,
  en,
  es,
  fr,
  pt,
  ru,
};

export async function getCurrentLanguage(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const value = cookieStore.get("srpg_lang")?.value;
  return isLanguageCode(value) ? value : "es";
}

export function getDictionary(language: LanguageCode) {
  return dictionaries[language] ?? dictionaries.es;
}

export function translate(dictionary: Record<string, string>, key: string) {
  return dictionary[key] ?? dictionaries.es[key] ?? key;
}
