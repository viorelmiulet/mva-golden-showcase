import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "@/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "mva_language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ro") {
        return saved;
      }
      // Check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("en")) {
        return "en";
      }
    }
    return "ro"; // Default to Romanian
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
