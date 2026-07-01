"use client";

import { useEffect } from "react";

// Registra o service worker no carregamento (habilita instalar como app + offline).
// O mesmo SW cuida do Web Push. Silencioso se o navegador nao suportar.
export default function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}
