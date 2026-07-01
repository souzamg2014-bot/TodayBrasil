// Lentes "premium": temas que cruzam TODOS os setores.
// So rotulos p/ os chips. As regras de matching ficam em
// scripts/themes.mjs (fonte unica) - os ids aqui PRECISAM bater com os de la.

export type Theme = {
  id: string;
  label: string;
  en: string;
  blurb: string; // descricao curta (tooltip / futuro)
};

export const THEMES: Theme[] = [
  { id: "ma", label: "M&A", en: "M&A", blurb: "Fusões, aquisições e mudanças de controle em qualquer setor" },
  { id: "empreendedorismo", label: "Empreendedorismo", en: "Entrepreneurship", blurb: "Fundadores, startups e novos negócios" },
  { id: "politica", label: "Política & Regulação", en: "Politics & Regulation", blurb: "Governo, leis e marcos regulatórios" },
  { id: "inovacao", label: "Inovação & IA", en: "Innovation & AI", blurb: "Tecnologia, IA, patentes e P&D" },
  { id: "investimentos", label: "Investimentos", en: "Investments", blurb: "IPOs, aportes, rodadas e mercado de capitais" },
  // lentes de FONTE PRIMARIA (alimentadas por ingester proprio, nao por noticia)
  { id: "cvm", label: "Fatos Relevantes CVM", en: "CVM Material Facts", blurb: "Fatos relevantes protocolados na CVM por companhias abertas" },
  { id: "falimentar", label: "Movimento Falimentar", en: "Bankruptcies", blurb: "Falências e recuperações judiciais ajuizadas nos tribunais (DataJud/CNJ)" },
  { id: "trabalho", label: "Mercado de Trabalho", en: "Labor Market", blurb: "Saldo de empregos formais (CAGED/Novo Caged, via BCB)" },
  { id: "esg", label: "ESG", en: "ESG", blurb: "Autuações ambientais de empresas pelo IBAMA" },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export function getTheme(id: string): Theme | undefined {
  return BY_ID.get(id);
}
// rotulo no idioma escolhido (fallback: id)
export function themeLabel(id: string, lang: "pt" | "en" = "pt"): string {
  const t = BY_ID.get(id);
  return t ? (lang === "en" ? t.en : t.label) : id;
}
