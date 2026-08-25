"use client";

import { usePreferences } from "@/lib/context/PreferencesContext";
import { getT, Language } from "@/lib/i18n/translator";

export { getT };

/**
 * Returns a translator function for Client Components.
 * Usage:  const T = useT();
 *         T.nav.home        → "Home" or "হোম"
 *         T.common.save     → "Save" or "সংরক্ষণ করুন"
 */
export function useT() {
  const { language } = usePreferences();
  return getT(language as Language);
}
