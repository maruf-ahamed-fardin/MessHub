"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Theme = "light" | "dark";
type Language = "bn" | "en";

interface PreferencesContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (bnText: string, enText: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("bn");
  const router = useRouter();

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("messhub_theme") as Theme | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
        applyTheme("dark");
      }

      const savedLang = localStorage.getItem("messhub_lang") as Language | null;
      if (savedLang === "bn" || savedLang === "en") {
        setLanguageState(savedLang);
        document.cookie = `messhub_lang=${savedLang}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("messhub_theme", newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem("messhub_lang", newLang);
      // Also save to cookie so server components can read it
      document.cookie = `messhub_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    } catch {}
  };

  const toggleLanguage = () => {
    const next = language === "bn" ? "en" : "bn";
    setLanguage(next);
  };

  // Helper for bilingual translation
  const t = (bnText: string, enText: string) => {
    return language === "bn" ? bnText : enText;
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setTheme,
        toggleLanguage,
        setLanguage,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      theme: "light" as Theme,
      language: "bn" as Language,
      toggleTheme: () => {},
      setTheme: () => {},
      toggleLanguage: () => {},
      setLanguage: () => {},
      t: (bn: string, en: string) => bn,
    };
  }
  return context;
}
