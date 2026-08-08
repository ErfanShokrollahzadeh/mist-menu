"use client";
import { createContext, useContext, useState, useEffect } from "react";
import translations from "@/data/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("tr");

  useEffect(() => {
    const saved = localStorage.getItem("mist-lang");
    if (saved) {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "tr" ? "en" : "tr";
    setLang(nextLang);
    localStorage.setItem("mist-lang", nextLang);
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
