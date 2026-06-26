// Lentes "premium": temas que cruzam TODOS os setores.
// So rotulos p/ os chips. As regras de matching ficam em
// scripts/themes.mjs (fonte unica) - os ids aqui PRECISAM bater com os de la.

export type Theme = {
  id: string;
  label: string;
  blurb: string; // descricao curta (tooltip / futuro)
};

export const THEMES: Theme[] = [
  { id: "ma", label: "M&A", blurb: "Fusões, aquisições e mudanças de controle em qualquer setor" },
  { id: "empreendedorismo", label: "Empreendedorismo", blurb: "Fundadores, startups e novos negócios" },
  { id: "politica", label: "Política & Regulação", blurb: "Governo, leis e marcos regulatórios" },
  { id: "inovacao", label: "Inovação & IA", blurb: "Tecnologia, IA, patentes e P&D" },
  { id: "investimentos", label: "Investimentos", blurb: "IPOs, aportes, rodadas e mercado de capitais" },
  // lentes de FONTE PRIMARIA (alimentadas por ingester proprio, nao por noticia)
  { id: "cvm", label: "Fatos Relevantes CVM", blurb: "Fatos relevantes protocolados na CVM por companhias abertas" },
  { id: "falimentar", label: "Movimento Falimentar", blurb: "Falências e recuperações judiciais ajuizadas nos tribunais (DataJud/CNJ)" },
  { id: "trabalho", label: "Mercado de Trabalho", blurb: "Saldo de empregos formais (CAGED/Novo Caged, via BCB)" },
  { id: "esg", label: "ESG", blurb: "Autuações ambientais de empresas pelo IBAMA" },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export function getTheme(id: string): Theme | undefined {
  return BY_ID.get(id);
}
