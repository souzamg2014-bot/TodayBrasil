// Paises/regioes das fontes internacionais (filtro "Mundo"). O `id` bate com o
// campo country gravado em news_articles pela ingestao (scripts/sources.intl.mjs).
// Ordem = ordem de exibicao na barra lateral de paises.

export type Country = { id: string; label: string; en: string; flag: string };

export const COUNTRIES: Country[] = [
  // Americas
  { id: "US", label: "Estados Unidos", en: "United States", flag: "🇺🇸" },
  { id: "CA", label: "Canadá", en: "Canada", flag: "🇨🇦" },
  { id: "MX", label: "México", en: "Mexico", flag: "🇲🇽" },
  // Europa
  { id: "GB", label: "Reino Unido", en: "United Kingdom", flag: "🇬🇧" },
  { id: "DE", label: "Alemanha", en: "Germany", flag: "🇩🇪" },
  { id: "FR", label: "França", en: "France", flag: "🇫🇷" },
  { id: "ES", label: "Espanha", en: "Spain", flag: "🇪🇸" },
  { id: "IT", label: "Itália", en: "Italy", flag: "🇮🇹" },
  { id: "NL", label: "Holanda", en: "Netherlands", flag: "🇳🇱" },
  { id: "CH", label: "Suíça", en: "Switzerland", flag: "🇨🇭" },
  // Asia-Pacifico
  { id: "CN", label: "China", en: "China", flag: "🇨🇳" },
  { id: "HK", label: "Hong Kong", en: "Hong Kong", flag: "🇭🇰" },
  { id: "SG", label: "Singapura", en: "Singapore", flag: "🇸🇬" },
  { id: "JP", label: "Japão", en: "Japan", flag: "🇯🇵" },
  { id: "KR", label: "Coreia do Sul", en: "South Korea", flag: "🇰🇷" },
  { id: "IN", label: "Índia", en: "India", flag: "🇮🇳" },
  { id: "AU", label: "Austrália", en: "Australia", flag: "🇦🇺" },
  // Russia / Oriente Medio / Africa
  { id: "RU", label: "Rússia", en: "Russia", flag: "🇷🇺" },
  { id: "QA", label: "Catar", en: "Qatar", flag: "🇶🇦" },
  { id: "SA", label: "Arábia Saudita", en: "Saudi Arabia", flag: "🇸🇦" },
  { id: "AE", label: "Emirados Árabes", en: "UAE", flag: "🇦🇪" },
  { id: "MEA", label: "Oriente Médio", en: "Middle East", flag: "🕌" },
  { id: "ZA", label: "África do Sul", en: "South Africa", flag: "🇿🇦" },
  { id: "AFR", label: "África", en: "Africa", flag: "🌍" },
];

const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
export function getCountry(id: string): Country | undefined {
  return BY_ID.get(id);
}
// rotulo no idioma escolhido (fallback: id)
export function countryLabel(id: string, lang: "pt" | "en" = "pt"): string {
  const c = BY_ID.get(id);
  return c ? (lang === "en" ? c.en : c.label) : id;
}
