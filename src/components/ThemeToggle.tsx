"use client";

import { useEffect, useState } from "react";

// Alterna a paleta P&B entre claro e escuro. Persiste em localStorage e seta
// data-theme no <html> (o script antiflash no layout aplica antes da pintura).
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  };

  return (
    <button
      className="themetoggle"
      onClick={toggle}
      title={theme === "light" ? "Mudar para escuro" : "Mudar para claro"}
      aria-label="Alternar tema claro/escuro"
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}
