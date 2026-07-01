// Taxonomia de setores (18). Usada nos filtros do feed e na classificacao.

export type Sector = {
  id: string;
  label: string;
  en: string;
};

export const SECTORS: Sector[] = [
  { id: "agronegocio", label: "Agronegócio", en: "Agribusiness" },
  { id: "alimentos-bebidas", label: "Alimentos e Bebidas", en: "Food & Beverage" },
  { id: "comercio-varejista", label: "Varejo", en: "Retail" },
  { id: "comercio-atacadista", label: "Atacado e Distribuição", en: "Wholesale & Distribution" },
  { id: "industria", label: "Indústria", en: "Industry" },
  { id: "construcao-imobiliario", label: "Construção e Imobiliário", en: "Construction & Real Estate" },
  { id: "tecnologia-software", label: "Tecnologia", en: "Technology" },
  { id: "telecomunicacoes", label: "Telecom", en: "Telecom" },
  { id: "servicos-financeiros", label: "Financeiro", en: "Financial" },
  { id: "servicos-empresariais", label: "Serviços Empresariais", en: "Business Services" },
  { id: "saude-bem-estar", label: "Saúde", en: "Health" },
  { id: "educacao", label: "Educação", en: "Education" },
  { id: "transporte-logistica", label: "Transporte e Logística", en: "Transport & Logistics" },
  { id: "energia-recursos", label: "Energia e Recursos", en: "Energy & Resources" },
  { id: "turismo-hotelaria", label: "Turismo e Hotelaria", en: "Tourism & Hospitality" },
  { id: "servicos-domesticos", label: "Serviços e Pequenos Negócios", en: "Services & Small Business" },
  { id: "economia-criativa", label: "Economia Criativa", en: "Creative Economy" },
  { id: "setor-publico-terceiro", label: "Setor Público e ONGs", en: "Public & Nonprofit" },
  { id: "geral", label: "Geral", en: "General" },
];

const BY_ID = new Map(SECTORS.map((s) => [s.id, s]));
export function getSector(id: string): Sector | undefined {
  return BY_ID.get(id);
}
// rotulo no idioma escolhido (fallback: id)
export function sectorLabel(id: string, lang: "pt" | "en" = "pt"): string {
  const s = BY_ID.get(id);
  return s ? (lang === "en" ? s.en : s.label) : id;
}
