// Paises/regioes das fontes internacionais (filtro "Mundo"). O `id` bate com o
// campo country gravado em news_articles pela ingestao (scripts/sources.intl.mjs).
// Ordem = ordem de exibicao na barra lateral de paises.

export type Country = { id: string; label: string; flag: string };

export const COUNTRIES: Country[] = [
  // Americas
  { id: "US", label: "Estados Unidos", flag: "🇺🇸" },
  { id: "CA", label: "Canadá", flag: "🇨🇦" },
  { id: "MX", label: "México", flag: "🇲🇽" },
  // Europa
  { id: "GB", label: "Reino Unido", flag: "🇬🇧" },
  { id: "DE", label: "Alemanha", flag: "🇩🇪" },
  { id: "FR", label: "França", flag: "🇫🇷" },
  { id: "ES", label: "Espanha", flag: "🇪🇸" },
  { id: "IT", label: "Itália", flag: "🇮🇹" },
  { id: "NL", label: "Holanda", flag: "🇳🇱" },
  { id: "CH", label: "Suíça", flag: "🇨🇭" },
  // Asia-Pacifico
  { id: "CN", label: "China", flag: "🇨🇳" },
  { id: "HK", label: "Hong Kong", flag: "🇭🇰" },
  { id: "SG", label: "Singapura", flag: "🇸🇬" },
  { id: "JP", label: "Japão", flag: "🇯🇵" },
  { id: "KR", label: "Coreia do Sul", flag: "🇰🇷" },
  { id: "IN", label: "Índia", flag: "🇮🇳" },
  { id: "AU", label: "Austrália", flag: "🇦🇺" },
  // Russia / Oriente Medio / Africa
  { id: "RU", label: "Rússia", flag: "🇷🇺" },
  { id: "QA", label: "Catar", flag: "🇶🇦" },
  { id: "SA", label: "Arábia Saudita", flag: "🇸🇦" },
  { id: "AE", label: "Emirados Árabes", flag: "🇦🇪" },
  { id: "MEA", label: "Oriente Médio", flag: "🕌" },
  { id: "ZA", label: "África do Sul", flag: "🇿🇦" },
  { id: "AFR", label: "África", flag: "🌍" },
];

const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
export function getCountry(id: string): Country | undefined {
  return BY_ID.get(id);
}
