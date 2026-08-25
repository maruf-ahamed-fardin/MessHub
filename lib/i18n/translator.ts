import { translations } from "@/lib/i18n/translations";

export type Language = "bn" | "en";

type Leaf = { bn: string; en: string };

export function buildProxy<T extends object>(obj: T, lang: Language): Translated<T> {
  return new Proxy(obj, {
    get(target, key: string) {
      const val = (target as any)[key];
      if (val && typeof val === "object" && "bn" in val && "en" in val) {
        return (val as Leaf)[lang];
      }
      if (val && typeof val === "object") {
        return buildProxy(val, lang);
      }
      return val;
    },
  }) as Translated<T>;
}

export function getT(lang: Language = "bn") {
  return buildProxy(translations, lang);
}

export type Translated<T> = {
  [K in keyof T]: T[K] extends { bn: string; en: string }
    ? string
    : T[K] extends object
    ? Translated<T[K]>
    : T[K];
};
