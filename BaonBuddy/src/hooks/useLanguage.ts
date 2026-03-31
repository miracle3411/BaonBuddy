import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { getSettings } from '../storage/storage';
import { t as translate, tFn as translateFn, TranslationKey } from '../constants/translations';

interface LanguageContextValue {
  lang: Language;
  t: (key: TranslationKey) => string;
  tFn: typeof translateFn;
  setLang: (lang: Language) => void;
  reload: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fil',
  t: (key) => translate(key, 'fil'),
  tFn: (key: any, lang: any) => translateFn(key, lang),
  setLang: () => {},
  reload: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('fil');

  const loadLanguage = useCallback(async () => {
    try {
      const settings = await getSettings();
      setLang(settings.language ?? 'fil');
    } catch {
      // default to Filipino
    }
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const t = useCallback((key: TranslationKey) => translate(key, lang), [lang]);

  const value: LanguageContextValue = {
    lang,
    t,
    tFn: translateFn,
    setLang,
    reload: loadLanguage,
  };

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
