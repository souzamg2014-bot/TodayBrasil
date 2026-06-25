// Taxonomia de setores (18). Usada nos filtros do feed e na classificacao.

export type Sector = {
  id: string;
  label: string;
  emoji: string;
};

export const SECTORS: Sector[] = [
  { id: "agronegocio", label: "Agronegócio", emoji: "🌾" },
  { id: "alimentos-bebidas", label: "Alimentos e Bebidas", emoji: "🍽️" },
  { id: "comercio-varejista", label: "Varejo", emoji: "🛍️" },
  { id: "comercio-atacadista", label: "Atacado e Distribuição", emoji: "📦" },
  { id: "industria", label: "Indústria", emoji: "🏭" },
  { id: "construcao-imobiliario", label: "Construção e Imobiliário", emoji: "🏗️" },
  { id: "tecnologia-software", label: "Tecnologia", emoji: "💻" },
  { id: "telecomunicacoes", label: "Telecom", emoji: "📡" },
  { id: "servicos-financeiros", label: "Financeiro", emoji: "💰" },
  { id: "servicos-empresariais", label: "Serviços Empresariais", emoji: "💼" },
  { id: "saude-bem-estar", label: "Saúde", emoji: "🩺" },
  { id: "educacao", label: "Educação", emoji: "🎓" },
  { id: "transporte-logistica", label: "Transporte e Logística", emoji: "🚚" },
  { id: "energia-recursos", label: "Energia e Recursos", emoji: "⚡" },
  { id: "turismo-hotelaria", label: "Turismo e Hotelaria", emoji: "✈️" },
  { id: "servicos-domesticos", label: "Serviços e Pequenos Negócios", emoji: "🔧" },
  { id: "economia-criativa", label: "Economia Criativa", emoji: "🎨" },
  { id: "setor-publico-terceiro", label: "Setor Público e ONGs", emoji: "🏛️" },
  { id: "geral", label: "Geral", emoji: "📰" },
];

const BY_ID = new Map(SECTORS.map((s) => [s.id, s]));
export function getSector(id: string): Sector | undefined {
  return BY_ID.get(id);
}
