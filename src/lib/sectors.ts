// Taxonomia de setores (18). Usada nos filtros do feed e na classificacao.

export type Sector = {
  id: string;
  label: string;
};

export const SECTORS: Sector[] = [
  { id: "agronegocio", label: "Agronegócio" },
  { id: "alimentos-bebidas", label: "Alimentos e Bebidas" },
  { id: "comercio-varejista", label: "Varejo" },
  { id: "comercio-atacadista", label: "Atacado e Distribuição" },
  { id: "industria", label: "Indústria" },
  { id: "construcao-imobiliario", label: "Construção e Imobiliário" },
  { id: "tecnologia-software", label: "Tecnologia" },
  { id: "telecomunicacoes", label: "Telecom" },
  { id: "servicos-financeiros", label: "Financeiro" },
  { id: "servicos-empresariais", label: "Serviços Empresariais" },
  { id: "saude-bem-estar", label: "Saúde" },
  { id: "educacao", label: "Educação" },
  { id: "transporte-logistica", label: "Transporte e Logística" },
  { id: "energia-recursos", label: "Energia e Recursos" },
  { id: "turismo-hotelaria", label: "Turismo e Hotelaria" },
  { id: "servicos-domesticos", label: "Serviços e Pequenos Negócios" },
  { id: "economia-criativa", label: "Economia Criativa" },
  { id: "setor-publico-terceiro", label: "Setor Público e ONGs" },
  { id: "geral", label: "Geral" },
];

const BY_ID = new Map(SECTORS.map((s) => [s.id, s]));
export function getSector(id: string): Sector | undefined {
  return BY_ID.get(id);
}
