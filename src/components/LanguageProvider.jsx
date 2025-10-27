import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

const translations = {
  zh: {
    nav_dashboard: "我的活动",
    nav_create: "AI创建活动",
    nav_reports: "复盘报告",
    loading: "加载中...",
    language: "语言",
    language_zh: "中文",
    language_en: "English",
  },
  en: {
    nav_dashboard: "My Events",
    nav_create: "AI Create Event",
    nav_reports: "Review Reports",
    loading: "Loading...",
    language: "Language",
    language_zh: "中文",
    language_en: "English",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("zh");

  return (
    <LanguageContext.Provider value={{ 
      language, 
      switchLanguage: (lang) => setLanguage(lang === "en" ? "en" : "zh"), 
      t: (key) => translations[language]?.[key] || key,
      isReady: true 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
