"use client";

import { usePreferences } from "@/lib/context/PreferencesContext";
import { translations } from "@/lib/i18n/translations";

type Language = "bn" | "en";

/**
 * Returns a translator function.
 * Usage:  const T = useT();
 *         T.nav.home        → "Home" or "হোম"
 *         T.common.save     → "Save" or "সংরক্ষণ করুন"
 */
export function useT() {
  const { language } = usePreferences();
  return buildProxy(translations, language as Language);
}

/**
 * Server-side / outside-provider fallback.
 * Pass lang from cookie or default to "bn".
 */
export function getT(lang: Language = "bn") {
  return buildProxy(translations, lang);
}

type Leaf = { bn: string; en: string };

function buildProxy<T extends object>(obj: T, lang: Language): Translated<T> {
  return new Proxy(obj, {
    get(target, key: string) {
      const val = (target as any)[key];
      if (val && typeof val === "object" && "bn" in val && "en" in val) {
        // It's a leaf node
        return (val as Leaf)[lang];
      }
      if (val && typeof val === "object") {
        // It's a namespace object — recurse
        return buildProxy(val, lang);
      }
      return val;
    },
  }) as Translated<T>;
}

// Type magic: convert { bn: string; en: string } → string recursively
type Translated<T> = {
  [K in keyof T]: T[K] extends { bn: string; en: string }
    ? string
    : T[K] extends object
    ? Translated<T[K]>
    : T[K];
};
