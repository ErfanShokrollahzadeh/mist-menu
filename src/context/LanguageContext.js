"use client";
import { createContext, useContext } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children, lang, dictionary }) {
  const t = (key) => {
    return dictionary[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
