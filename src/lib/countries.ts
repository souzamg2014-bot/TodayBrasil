// Regioes economicas do filtro "Mundo". Trocamos a lista longa de paises por 3
// blocos do circuito economico: EUA, Asia e Zona do Euro. Cada regiao agrega os
// codigos de pais (`members`) gravados em news_articles.country pela ingestao
// (scripts/sources.intl.mjs). O feed do Mundo filtra por `country IN members`.
// Ordem = ordem de exibicao na barra lateral.

export type Region = {
  id: string;        // id da regiao (usado na URL e no filtro)
  label: string;     // rotulo PT
  en: string;        // rotulo EN
  flag: string;      // emoji
  members: string[]; // codigos de pais que compoem a regiao (batem com o country da ingestao)
};

export const REGIONS: Region[] = [
  { id: "US",   label: "Estados Unidos", en: "United States", flag: "🇺🇸", members: ["US"] },
  { id: "ASIA", label: "Ásia",           en: "Asia",          flag: "🌏", members: ["CN", "JP", "KR"] },
  { id: "EURO", label: "Zona do Euro",   en: "Eurozone",      flag: "🇪🇺", members: ["GB", "DE", "FR", "ES", "IT", "NL"] },
];

// uniao de todos os codigos cobertos (o Mundo sem regiao selecionada mostra so estes).
export const ALL_MEMBERS: string[] = REGIONS.flatMap((r) => r.members);

const BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string): Region | undefined {
  return BY_ID.get(id);
}

// codigos de pais de uma regiao (vazio = regiao invalida).
export function regionMembers(id: string): string[] {
  return BY_ID.get(id)?.members ?? [];
}

// rotulo da regiao no idioma escolhido (fallback: id).
export function regionLabel(id: string, lang: "pt" | "en" = "pt"): string {
  const r = BY_ID.get(id);
  return r ? (lang === "en" ? r.en : r.label) : id;
}
