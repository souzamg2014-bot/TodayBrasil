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
  // M&A - Fusoes e Aquisicoes.
  // Precisao > recall: os prefixos soltos "aquisic"/"adquir" pegavam procurement
  // ("ONU adquire sacos"), juridico ("direito adquirido") e generico. Agora exige
  // objeto corporativo (empresa/controle/participacao/fatia) ou verbo ATIVO como
  // palavra inteira ("adquire "), com blocklist de procurement/consumo/juridico.
  ma: {
    any: [
      // sinais fortes, standalone
      "fusao", "fusoes", "megafusao", "fusoes e aquisic", "m&a", "takeover", "take over",
      "joint venture", "oferta hostil", "oferta publica de aquisic", "opa para",
      // incorporacao societaria (nao "incorporacao de tecnologia")
      "incorporacao de acoes", "incorporacao societaria", "incorporacao reversa",
      "incorporacao total", "incorporacao da participac",
      // controle / participacao acionaria
      "participacao acionaria", "controle acionario",
      "assume o controle", "assumiu o controle", "assumir o controle",
      "compra de controle", "compra do controle", "compra o controle",
      // fatia / participacao
      "comprar fatia", "comprou fatia", "compra de fatia", "vende fatia", "venda de fatia",
      "aquisicao de fatia", "adquiriu fatia", "adquire fatia", "adquirir fatia",
      "comprou a participac", "comprar a participac", "vender a participac",
      "adquiriu participac", "adquire participac", "adquirir participac",
      // aquisicao corporativa: exige objeto (da/do empresa, controle, participacao)
      "aquisicao da", "aquisicao do", "aquisicao de participac", "aquisicao de controle",
      "aquisicao bilionaria", "aquisicao milionaria", "aquisicao estrategica",
      "anuncia aquisic", "anunciou a aquisic", "anuncio da aquisic", "anuncio de aquisic",
      "concluiu a aquisic", "concluir a aquisic", "fechou a aquisic", "fechar a aquisic",
      "acordo de aquisic", "processo de aquisic", "para aquisic da", "para aquisic do",
      // verbo adquirir ATIVO como palavra inteira (evita "adquirido/adquirida" juridico)
      "adquire ", "adquiriu ", "adquirir ",
      // voz passiva de M&A: "empresa e adquirida por/pelo X" (nao "direito adquirido")
      "adquirida por", "adquirida pelo", "adquirida pela",
      "adquirido por", "adquirido pelo", "adquirido pela",
      "adquiridos por", "adquiridas por",
      // compra de unidade / operacao / rival / fornecedora (M&A, nao consumo)
      "comprar unidade", "comprar a unidade", "compra da unidade", "compra de unidade",
      "comprar operacao", "comprar a operacao", "compra da operacao", "aquisicao da operacao",
      "acerta compra", "acerta a compra", "acordo para comprar",
      "compra de fornecedora", "compra de rival", "compra da rival",
      // OPA (oferta publica de aquisicao / fechamento de capital)
      "opa ", "edital de opa", "lanca opa", "encerra opa", "opa de aquisic",
    ],
    // exclusoes: sentidos que NAO sao M&A corporativo.
    not: [
      // marketing / consumo
      "custo de aquisic", "poder de aquisic", "aquisicao de clientes",
      "aquisicao de novos clientes", "aquisicao de usuarios", "aquisicao de leads",
      "aquisicao de habito", "aquisicao de conhecimento", "aquisicao de talento",
      "aquisicao de imovel", "aquisicao de imoveis", "aquisicao da casa propria",
      "aquisicao e engajamento", "aquisicao e o engajamento", "aquisicao e retencao",
      // procurement / compra publica de bens (nao e deal societario)
      "aquisicoes emergenciais", "aquisicao emergencial", "aquisicao de materiais",
      "aquisicao de material", "aquisicao de insumos", "aquisicao de vacinas",
      "aquisicao de medicamentos", "aquisicao de doses", "aquisicao de equipamentos",
      "aquisicao de terras", "aquisicao de terra", "aquisicao de alimentos",
      "aquisicao da tecnologia", "aquisicao de tecnologia",
      // verbo ativo em sentido de compra/consumo/procurement
      "adquirir conhecimento", "adquirir o habito", "adquirir habito",
      "adquirir o produto", "adquirir produtos", "adquirir bens de consumo",
      "onde adquirir", "como adquirir", "adquirir o jogo",
      "adquirir um produto", "adquirir um aparelho", "adquirir um smartwatch",
      "adquirir um celular", "adquirir um carro", "adquirir um veiculo",
      "adquirir um imovel", "adquirir um plano", "adquirir ingresso",
      "adquirir um notebook", "adquirir um computador", "adquirir um novo computador",
      "adquirir um laptop", "adquirir o game", "adquirir games", "adquirir um game",
      "necessidade de adquirir", "adquirir outro",
      "adquirir vacinas", "adquirir medicamentos", "adquirir doses", "adquirir imunizantes",
      "adquirir equipamentos", "adquirir alimentos", "adquirir insumos", "adquirir materiais",
      "adquirir merenda", "adquirir combustivel", "adquirir sacos", "adquirir cadaveres",
      "adquire vacinas", "adquire medicamentos", "adquire equipamentos", "adquire sacos",
      "adquire alimentos", "adquire imoveis", "adquire um", "adquire uma",
      "adquire navios", "adquirir navios", "adquirir a maquina", "adquire a maquina",
      "adquirir a tecnologia", "adquirir tecnologia", "adquirira",
      "governo adquire", "prefeitura adquire", "onu adquire", "ministerio adquire",
      // consumo/varejo/listicle
      "em promocao", "como comprar", "vale a pena comprar", "melhores estudios",
      "melhores jogos", "renovar o setup", "selecao de notebooks",
      // conhecimento/competencia ("o conhecimento so se adquire...")
      "se adquire",
      // crime/consumo (receptacao) e retrospectiva de carreira ("diz adeus")
      "receptacao", "diz adeus",
      // direito adquirido (juridico) e particípios de sentido nao-M&A
      "direitos adquiridos", "direito adquirido", "adquiridos antes", "adquirido antes",
      "conhecimento adquirido", "experiencia adquirida", "habito adquirido",
      "imunidade adquirida", "gosto adquirido",
      // "takeover" fora de M&A (motim, ciberseguranca, fisico)
      "account takeover", "jail takeover", "prison takeover", "server takeover",
      "takeover at a",
    ],
  },

  // Empreendedorismo. "empreend" (prefixo) pegava "empreendimento" imobiliario;
  // trocado pelos termos de EMPREENDEDOR (pessoa/atividade), nao de obra.
  empreendedorismo: {
    any: [
      "empreendedor", "empreendedora", "empreendedores", "empreendedorismo", "empreender",
      "fundador", "fundadora", "cofundador", "co-fundador",
      "startup", "abriu a empresa", "abriu o negocio", "abriu sua empresa",
      "montou a empresa", "montou o negocio", "criou a empresa",
      "negocio proprio", "mei ", "microempreend", "investimento anjo",
      "aceleradora", "incubadora", "unicornio", "scale-up", "bootstrap",
      "comecou do zero", "construiu do zero",
    ],
    // fundador de gigante citado em bio/frase (nao e materia de empreendedorismo)
    not: [
      "fundador da microsoft", "fundador da apple", "fundador da amazon",
      "fundador do facebook", "fundador da tesla", "fundador da meta",
    ],
  },

  // Politica & Regulacao
  politica: {
    any: [
      "governo", "congresso nacional", "senado", "camara dos deputados",
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
      "inovac", "nova tecnologia", "chatgpt",
      "openai", "anthropic", "modelo de linguagem", "automac", "robotica",
      "biotecnologia", "deep tech", "computacao quantica",
      "realidade virtual", "realidade aumentada",
    ],
    // "patente" tambem e posto militar (STM, "perda de patente")
    not: ["perda de patente", "posto e patente", "patente militar", "na patente de"],
  },

  // Investimentos & Mercado. Removidos os prefixos soltos que vazavam:
  //   "b3 " (vaga/leilao "na B3"), "serie a/b/c" (futebol Serie B!),
  //   "aporte"/"captac"/"captou" (credito agro, captacao de agua) -> agora exigem valor.
  investimentos: {
    any: [
      "ipo ", "abertura de capital", "oferta publica de acoes", "oferta subsequente",
      "captou r$", "captou us$", "captacao de recursos",
      "aporte de r$", "aporte de us$", "aporte de capital", "aporte financeiro", "novo aporte",
      "recebe aporte", "recebeu aporte", "aporte de fundo", "aporte de investidor", "aporte da gestora",
      "rodada de investiment", "rodada de financiamento", "rodada de captac",
      "rodada serie", "rodada seed", "seed round", "series a round", "series b round",
      "valuation", "fundo de investimento", "venture capital",
      "private equity", "levantou r$", "levantou us$", "investimento de r$", "investimento de us$",
      "ibovespa", "pregao", "bolsa de valores", "dividendos", "follow-on", "oferta de acoes",
      "acoes da", "acoes ordinarias", "acoes preferenciais", "cotacao das acoes",
    ],
    // "acoes" tambem = medidas/iniciativas (nao bolsa)
    not: [
      "plano de acoes", "acoes afirmativas", "acoes de combate", "acoes sociais",
      "acoes integradas", "acoes judiciais", "acoes coletivas", "acoes educativas",
      "acoes de prevencao", "acoes humanitarias", "acoes de marketing",
      "acoes da campanha", "acoes da policia", "acoes da prefeitura",
      "acoes da justica", "acoes da educacao", "acoes da saude", "acoes do governo",
    ],
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
