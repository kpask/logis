import { useI18n } from "../i18n";
import type { TranslationKey } from "../translations";
import type { Language } from "../types";

const LANGUAGE_OPTIONS: { value: Language; labelKey: TranslationKey }[] = [
  { value: "EN", labelKey: "languageEnglish" },
  { value: "LT", labelKey: "languageLithuanian" },
];

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="page-container page-container--form">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t("settingsTitle")}</h1>
          <p className="page-header-subtitle">{t("settingsSubtitle")}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {t("settingsLanguage")}
          </div>
          <div className="muted small">{t("settingsLanguageHelp")}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LANGUAGE_OPTIONS.map((option) => (
            <label
              key={option.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                background:
                  language === option.value
                    ? "var(--color-primary-soft)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="language"
                value={option.value}
                checked={language === option.value}
                onChange={() => setLanguage(option.value)}
              />
              <span style={{ fontWeight: 500 }}>{t(option.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
