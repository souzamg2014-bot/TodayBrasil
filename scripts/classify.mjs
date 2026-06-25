// ============================================================
// Classificador de setor por palavra-chave (18 setores).
// Fonte unica: usado pelo robo (ingest-news.mjs) e pela varredura
// de inconsistencias (scan-sectors.mjs).
// ============================================================

// Convencao: um espaco no FIM da palavra-chave = casa palavra exata (ex: "pix ",
// "tim ") para evitar vazamento (pixel, time). Sem espaco = casa inicio de
// palavra/prefixo (ex: "agro" pega agronegocio, agropecuaria). O casamento e
// sempre por FRONTEIRA de palavra, nunca substring solto (que fazia "gado"
// casar advogado/empregado, "obra" casar obrigado, "ong" casar among/Hong).
export const KEYWORDS = {
  agronegocio: ["agro", "agronegocio", "agropecuaria", "safra", "soja ", "milho ", "milhos ", "boi ", "gado ", "fazenda", "produtor rural", "cafe ", "cana ", "canavial", "fertilizante", "colheita", "pecuaria"],
  "alimentos-bebidas": ["alimento", "bebida", "cerveja", "frigorifico", "laticinio", "padaria", "ultraprocessado", "marca de alimento"],
  "comercio-varejista": ["varejo", "e-commerce", "ecommerce", "magazine luiza", "shopping", "black friday", "loja", "vendas no varejo", "consumidor"],
  "comercio-atacadista": ["atacado", "atacadista", "distribuidor", "importacao", "exportacao", "atacarejo"],
  industria: ["industria", "fabrica", "manufatura", "siderurgia", "metalurgia", "montadora", "textil", "petroquimica", "producao industrial"],
  "construcao-imobiliario": ["construcao", "obra ", "obras ", "imovel", "imobiliario", "incorporadora", "engenharia civil", "lancamento imobiliario", "aluguel"],
  "tecnologia-software": ["tecnologia", "software", "startup", "inteligencia artificial", "ia ", "saas", "nuvem", "ciberseguranca", "fintech", "aplicativo", "tech"],
  telecomunicacoes: ["telecom", "banda larga", "5g ", "operadora", "provedor", "data center", "tim "],
  "servicos-financeiros": ["banco", "juros", "selic", "credito", "investimento", "bolsa de valores", "seguro", "cambio", "ibovespa", "pix ", "pagamento", "inadimplencia"],
  "servicos-empresariais": ["consultoria", "contabilidade", "advocacia", "auditoria", "recrutamento", "marketing", "publicidade", "recursos humanos"],
  "saude-bem-estar": ["saude", "hospital", "clinica", "medico", "farmacia", "plano de saude", "odontologia", "academia", "estetica", "bem-estar"],
  educacao: ["educacao", "escola", "ensino", "universidade", "vestibular", "enem ", "edtech", "curso"],
  "transporte-logistica": ["transporte", "logistica", "frete", "caminhao", "transportadora", "entrega", "mobilidade", "porto", "rodovia"],
  "energia-recursos": ["energia", "eletrica", "solar", "petroleo", "gas natural", "mineracao", "saneamento", "agua ", "aguas ", "sustentabilidade", "ambiental"],
  "turismo-hotelaria": ["turismo", "hotel", "viagem", "pousada", "evento", "gastronomia", "festival", "restaurante"],
  "servicos-domesticos": ["reforma residencial", "limpeza", "jardinagem", "eletricista", "encanador", "manutencao", "marido de aluguel"],
  "economia-criativa": ["moda ", "modas ", "musica", "cinema", "audiovisual", "fotografia", "design", "games", "influenciador", "creator", "conteudo"],
  "setor-publico-terceiro": ["governo", "prefeitura", "ministerio", "ong ", "ongs ", "terceiro setor", "politica publica", "licitacao", "congresso"],
};

// Exclusoes: frases que indicam o OUTRO sentido da palavra-chave. Cada match
// DESCONTA 1 do score do setor (neutraliza o falso positivo sem vetar o legitimo).
// Ex: "banco" pontua financeiro, mas "banco de dados" nao e banco.
export const EXCLUDE = {
  "servicos-financeiros": [
    "banco de dados", "banco de horas", "banco de talentos", "banco de imagens",
    "banco de leite", "banco de sangue", "banco de celulares", "banco de orgaos",
    "banco de alimentos", "banco de questoes", "banco de germoplasma",
    "celular seguro", "modo seguro", "ambiente seguro", "lugar seguro", "local seguro",
  ],
  telecomunicacoes: [
    "operadora de turismo", "operadora de viagens", "operadora de saude",
    "operadora de plano", "operadora de planos", "operadora de cartao",
    "operadora de transporte", "operadora logistica", "operadora de seguros",
  ],
  "construcao-imobiliario": [
    "obra de arte", "obras de arte", "obra prima", "obra-prima",
    "obra cinematografica", "obra literaria", "obra de ficcao", "obra musical",
  ],
};

// normaliza: minusculo, sem acento, nao-alfanumerico -> espaco, com espaco nas pontas
function normalize(s) {
  return " " + (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}

function toNeedle(w) {
  const exact = /\s$/.test(w);
  const core = normalize(w).trim();
  return " " + core + (exact ? " " : "");
}

// pre-compila os "needles": " core" (prefixo) ou " core " (palavra exata)
const MATCHERS = {};
for (const [sector, words] of Object.entries(KEYWORDS)) {
  MATCHERS[sector] = words.map(toNeedle);
}
const EXCLUDERS = {};
for (const [sector, words] of Object.entries(EXCLUDE)) {
  EXCLUDERS[sector] = words.map(toNeedle);
}

// pontua cada setor pelo numero de palavras-chave presentes (fronteira de palavra),
// descontando as exclusoes (frases de outro sentido).
export function scoreSectors(text) {
  const t = normalize(text);
  const scores = {};
  for (const [sector, needles] of Object.entries(MATCHERS)) {
    let score = 0;
    for (const n of needles) if (t.includes(n)) score++;
    if (score && EXCLUDERS[sector]) {
      for (const n of EXCLUDERS[sector]) if (t.includes(n)) score--;
    }
    if (score > 0) scores[sector] = score;
  }
  return scores;
}

export function classify(text) {
  const scores = scoreSectors(text);
  let best = "geral";
  let bestScore = 0;
  let tie = false;
  for (const [sector, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = sector; tie = false; }
    else if (score === bestScore && bestScore > 0) { tie = true; }
  }
  // empate no topo = ambiguo -> 'geral' (mantem o hint da fonte, evita chute)
  return tie ? "geral" : best;
}
