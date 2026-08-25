import { cookies } from "next/headers";
import { getT } from "@/lib/i18n/useT";

type Language = "bn" | "en";

/**
 * Server-side translation helper.
 * Reads language from cookie set by PreferencesContext.
 * Usage in async server components:
 *   const T = await getServerT();
 *   T.common.save → "Save" or "সংরক্ষণ করুন"
 */
export async function getServerT() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("messhub_lang")?.value ?? "bn") as Language;
  return getT(lang);
}
