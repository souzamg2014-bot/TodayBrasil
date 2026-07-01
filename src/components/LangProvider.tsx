"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LangCtx = createContext<Ctx>({ lang: "pt", setLang: () => {}, t: (k) => k });

export function useLang() {
  return useContext(LangCtx);
}

// Provider global de idioma. Persiste em localStorage e seta <html lang>.
// Default = pt. Troca sem recarregar (as strings vem do dicionario em i18n.ts).
export default function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "pt") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  const t = (key: string, vars?: Record<string, string | number>) => tr(lang, key, vars);

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
