// ============================================================
// Logis — Internationalization (i18n) context & hook
// Loads the user's language preference and provides t().
// Fallback: EN is always the fallback for any missing translation.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { userSettingsApi } from "./api";
import type { Language } from "./types";
import { translations, type TranslationKey } from "./translations";

/**
 * Map a Language code ("EN" | "LT") to a BCP-47 locale string suitable for
 * Intl.* / toLocale* APIs.
 */
export function languageToLocale(language: Language): string {
  return language === "LT" ? "lt-LT" : "en-GB";
}

interface I18nContextValue {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
  /** Switch the UI language. Set persist=false on public pages (login/signup),
   *  where the settings update request cannot be authenticated yet. */
  setLanguage: (lang: Language, persist?: boolean) => void;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("EN");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await userSettingsApi.get();
        if (!cancelled) setLanguageState(settings.language);
      } catch {
        // Keep default "EN" if settings can't be loaded
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((lang: Language, persist = true) => {
    setLanguageState(lang);
    if (persist) {
      // Persist to backend (fire-and-forget)
      void userSettingsApi.update({ language: lang });
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const entry = translations[key];
      if (!entry) return String(key);
      let text: string = entry[language] || entry.EN;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
