// ============================================================
// newsfeed - LENTES (temas que cruzam todos os setores)
//
// Diferente de "setor" (1 noticia = 1 setor), uma lente e ortogonal:
// uma fusao na saude, no agro ou na tech aparece toda junta em "M&A".
// Uma noticia pode ter 0, 1 ou varias lentes.
//
// Esta e a UNICA fonte das regras de matching. O robo (ingest) e o
// backfill importam daqui. O front (src/lib/themes.ts) so guarda os
// rotulos/emoji p/ os chips - os ids precisam bater com os daqui.
//
// Matching: zero token. Normaliza o texto (sem acento, minusculo) e
// procura prefixos de palavra. "adquir" pega adquiriu/adquire/adquirir.
// Termos curtos/ambiguos levam espaco no fim ("ipo ") p/ casar palavra
// inteira e evitar ruido.
// ============================================================

// normaliza: minusculo, tira acento, mantem & $ - (m&a, r$, scale-up),
// troca o resto por espaco e poe um espaco nas pontas (fronteira de palavra).
export function normalize(s = "") {
  return (
    " " +
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9&$-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " "
  );
}

// casa um termo como inicio de palavra (prefixo). Se o termo terminar com
// espaco, exige palavra inteira.
function has(text, term) {
  return text.includes(" " + term);
}

// Cada lente: any = sinais positivos (basta 1). not = corta ruido (se algum
// bater, a lente nao se aplica). Termos ja normalizados (sem acento, minusculo).
export const THEME_RULES = {
  // M&A - Fusoes e Aquisicoes
  ma: {
    any: [
      "fusao", "fusoes", "aquisic", "adquir", "incorporac",
      "joint venture", "oferta hostil", "oferta publica de aquisic",
      "due diligence", "participacao acionaria", "controle acionario",
      "assume o controle", "compra de controle", "m&a",
      "fusoes e aquisic", "megafusao", "takeover", "take over",
      "comprou fatia", "comprou a participac", "aporte para adquir",
    ],
    not: [],
  },

  // Empreendedorismo
  empreendedorismo: {
    any: [
      "empreend", "fundador", "fundadora", "cofundador", "co-fundador",
      "startup", "abriu a empresa", "abriu o negocio", "abriu sua empresa",
      "montou a empresa", "montou o negocio", "criou a empresa",
      "negocio proprio", "mei ", "microempreend", "investimento anjo",
      "aceleradora", "incubadora", "unicornio", "scale-up", "bootstrap",
      "comecou do zero", "do zero",
    ],
    not: [],
  },

  // Politica & Regulacao
  politica: {
    any: [
      "governo", "congresso", "senado", "camara dos deputados",
      "ministerio", "ministro", "ministra", "nova lei", "projeto de lei",
      "medida provisoria", "marco regulatorio", "regulac", "regulamentac",
      "stf ", "supremo tribunal", "reforma tributaria", "reforma administrativa",
      "decreto", "sancao presidencial", "politica publica", "licitac",
      "anatel", "anvisa", "cvm ", "banco central", "planalto", "tributac",
    ],
    not: [],
  },

  // Inovacao & IA
  inovacao: {
    any: [
      "inteligencia artificial", "ia generativa", "machine learning",
      "aprendizado de maquina", "patente", "p&d", "pesquisa e desenvolvimento",
      "inovac", "lancamento de", "lancou o", "nova tecnologia", "chatgpt",
      "openai", "anthropic", "modelo de linguagem", "automac", "robotica",
      "biotecnologia", "deep tech", "computacao quantica",
      "realidade virtual", "realidade aumentada",
    ],
    not: [],
  },

  // Investimentos & Mercado
  investimentos: {
    any: [
      "ipo ", "abertura de capital", "captou", "captac", "aporte",
      "rodada de", "rodada serie", "serie a", "serie b", "serie c",
      "valuation", "fundo de investimento", "venture capital",
      "private equity", "levantou r$", "investimento de r$", "b3 ",
      "ibovespa", "acoes da", "dividendos", "follow-on", "oferta de acoes",
    ],
    not: [],
  },
};

// Retorna os ids das lentes que se aplicam ao texto (titulo + resumo).
export function classifyThemes(text) {
  const t = normalize(text);
  const out = [];
  for (const [id, rule] of Object.entries(THEME_RULES)) {
    if (rule.not.some((w) => has(t, w))) continue;
    if (rule.any.some((w) => has(t, w))) out.push(id);
  }
  return out;
}
