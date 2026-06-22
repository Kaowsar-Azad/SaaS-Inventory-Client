"use client";

import { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";

const translations = { en, bn };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLocale = localStorage.getItem("language");
    if (storedLocale && translations[storedLocale]) {
      setLocale(storedLocale);
    }
  }, []);

  const changeLanguage = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem("language", newLocale);
    }
  };

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[locale];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English if key is missing in Bengali
        let fallbackValue = translations["en"];
        for (const fk of keys) {
          if (fallbackValue && fallbackValue[fk] !== undefined) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // return key if not found in fallback either
          }
        }
        return fallbackValue;
      }
    }
    return value;
  };

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: "en", changeLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
