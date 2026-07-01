"use client";

import { useLang } from "./LangProvider";

// Alterna o idioma da interface entre PT-BR e EN.
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      className="langtoggle"
      onClick={() => setLang(lang === "pt" ? "en" : "pt")}
      title={lang === "pt" ? "Switch to English" : "Mudar para português"}
      aria-label="Idioma / Language"
    >
      <span className={lang === "pt" ? "on" : ""}>PT</span>
      <span className="sep">/</span>
      <span className={lang === "en" ? "on" : ""}>EN</span>
    </button>
  );
}
