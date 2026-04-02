import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('fr'); // Default to French

  useEffect(() => {
    // Inject google fonts dynamically
    if (!document.getElementById('arabic-fonts')) {
      const link = document.createElement('link');
      link.id = 'arabic-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    // Toggle Document Direction and Root Font
    const root = document.documentElement;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
    
    if (lang === 'ar') {
      root.style.fontFamily = "'Cairo', sans-serif";
    } else {
      root.style.fontFamily = ''; // Revert to tailwind sans
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
