// ============================================================
// newsfeed - REGRAS DE LIXO (fonte unica).
//
// O que NAO e noticia e nao deve entrar no feed:
//   1) publieditorial / conteudo de marca / release patrocinado (por URL);
//   2) filings da SEC e cupom/propaganda de desconto (por titulo).
//
// Usado pelo robo (ingest-news.mjs, barra na entrada) e pelo auditor
// (audit-content.mjs, varre o que ja esta no banco). Mesma regra nos dois
// para nao divergir.
// ============================================================

// Segmentos de caminho que marcam conteudo pago/publieditorial (nao-jornalistico).
// Ex.: valor.globo.com/patrocinado/dino/... , /conteudo-de-marca/... , .../pulse-brand/...
export const ADVERTORIAL_SEGMENTS = [
  "patrocinado",
  "conteudo-de-marca",
  "conteudo-patrocinado",
  "publieditorial",
  "publi-editorial",
  "especial-publicitario",
  "branded-content",
  "brand-lab",
  "pulse-brand",
  "dino", // Agencia DINO: distribuicao de releases (aparece como /dino/)
];

const ADVERTORIAL_RE = new RegExp(
  "/(?:" + ADVERTORIAL_SEGMENTS.join("|") + ")(?:/|$|\\?)",
  "i",
);

// URL de publieditorial/release patrocinado?
export function isAdvertorialUrl(url = "") {
  return ADVERTORIAL_RE.test(url || "");
}

// Titulo-lixo: filings da SEC + cupom/propaganda de desconto.
export function isJunkTitle(title = "") {
  const t = title || "";
  // SEC filings (intl)
  if (/^\s*(Form\s+(144|3|4|5|S-1|8-K|10-K|10-Q|6-K|13[DGF])|DEF\s*14A|SC\s*13|Schedule\s*13)\b/i.test(t)) return true;
  if (/\bForm\s*144\b|\bDEF\s*14A\b/i.test(t)) return true;
  // cupom / codigo promocional / propaganda de desconto (NAO pega "cupom cambial/de juros")
  if (/^\s*(cupom|cupons|c[oó]digo promocional|c[oó]digo de desconto|vale[- ]?desconto)\b/i.test(t)) return true;
  if (/\bc[oó]digo promocional\b/i.test(t)) return true;
  if (/\bcupom\b.*\b(off|desconto|%)/i.test(t)) return true;
  // promo/deal de e-commerce (alta precisao): "90% OFF", "Prime Day", "Black Friday: ofertas"
  if (/\b\d{1,3}\s*%\s*off\b/i.test(t)) return true;
  if (/\bprime day\b/i.test(t)) return true;
  if (/\bblack friday\b.*\b(oferta|off|desconto|%)/i.test(t)) return true;
  return false;
}

// Descarte final: junta titulo + URL.
export function isJunk(title = "", url = "") {
  return isJunkTitle(title) || isAdvertorialUrl(url);
}
