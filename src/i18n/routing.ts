import { defineRouting } from "next-intl/routing";

export const locales = [
  "zh-TW",
  "en",
  "ja",
  "ko",
  "th",
  "vi",
  "de",
  "fr",
  "es",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  th: "ภาษาไทย",
  vi: "Tiếng Việt",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
});
