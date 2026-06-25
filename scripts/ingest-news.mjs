// ============================================================
// newsfeed - robo de ingestao de noticias (zero token)
//
// Varre RSS de muitos portais, classifica cada noticia nos 18 setores
// por palavra-chave, extrai imagem quando houver e salva em news_articles
// (dedupe por URL).
//
// Rodar:  npm run ingest    (ou: node scripts/ingest-news.mjs)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
// (ou nas variaveis de ambiente, ex: no GitHub Actions).
//
// Fase 1: so PT-BR. Multilingue (en/es) entra na fase 2 com novas listas.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SOURCES } from "./sources.pt.mjs";
import { classifyThemes } from "./themes.mjs";

// idioma desta rodada (fase 1 = pt). No futuro: rodar o robo por lang.
const LANG = process.env.INGEST_LANG || "pt";

function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente / .env.local");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// fontes vem de sources.pt.mjs (dedupe por URL). cada fonte: { url, sector }.
const FEEDS = [...new Map(SOURCES.map((s) => [s.url, s])).values()];

// ---- palavras-chave por setor (18) ----
const KEYWORDS = {
  agronegocio: ["agro", "agronegocio", "agropecuaria", "safra", "soja", "milho", "boi", "gado", "fazenda", "produtor rural", "cafe", "cana", "fertilizante", "colheita", "pecuaria"],
  "alimentos-bebidas": ["alimento", "bebida", "cerveja", "frigorifico", "laticinio", "padaria", "food", "ultraprocessado", "marca de alimento"],
  "comercio-varejista": ["varejo", "e-commerce", "ecommerce", "magazine luiza", "shopping", "black friday", "loja", "vendas no varejo", "consumidor"],
  "comercio-atacadista": ["atacado", "atacadista", "distribuidor", "importacao", "exportacao", "atacarejo"],
  industria: ["industria", "fabrica", "manufatura", "siderurgia", "metalurgia", "montadora", "textil", "petroquimica", "producao industrial"],
  "construcao-imobiliario": ["construcao", "obra", "imovel", "imobiliario", "incorporadora", "engenharia civil", "lancamento imobiliario", "aluguel"],
  "tecnologia-software": ["tecnologia", "software", "startup", "inteligencia artificial", " ia ", "saas", "nuvem", "ciberseguranca", "fintech", "app ", "tech"],
  telecomunicacoes: ["telecom", "banda larga", "5g", "operadora", "provedor", "data center", "vivo", "claro", "tim "],
  "servicos-financeiros": ["banco", "juros", "selic", "credito", "investimento", "bolsa", "seguro", "cambio", "ibovespa", "pix", "pagamento", "inadimplencia"],
  "servicos-empresariais": ["consultoria", "contabilidade", "advocacia", "auditoria", "recrutamento", "marketing", "publicidade", "recursos humanos"],
  "saude-bem-estar": ["saude", "hospital", "clinica", "medico", "farmacia", "plano de saude", "odontologia", "academia", "estetica", "bem-estar"],
  educacao: ["educacao", "escola", "ensino", "universidade", "vestibular", "enem", "edtech", "curso"],
  "transporte-logistica": ["transporte", "logistica", "frete", "caminhao", "transportadora", "entrega", "mobilidade", "porto", "rodovia"],
  "energia-recursos": ["energia", "eletrica", "solar", "petroleo", "gas natural", "mineracao", "saneamento", "agua", "sustentabilidade", "ambiental"],
  "turismo-hotelaria": ["turismo", "hotel", "viagem", "pousada", "evento", "gastronomia", "festival", "restaurante"],
  "servicos-domesticos": ["reforma residencial", "limpeza", "jardinagem", "eletricista", "encanador", "manutencao", "marido de aluguel"],
  "economia-criativa": ["moda", "musica", "cinema", "audiovisual", "fotografia", "design", "games", "influenciador", "creator", "conteudo"],
  "setor-publico-terceiro": ["governo", "prefeitura", "ministerio", "ong", "terceiro setor", "politica publica", "licitacao", "congresso"],
};

function classify(text) {
  const t = " " + text.toLowerCase() + " ";
  let best = "geral";
  let bestScore = 0;
  for (const [sector, words] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const w of words) if (t.includes(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = sector;
    }
  }
  return best;
}

// decodifica as entidades mais comuns ANTES de tirar tags. Google News manda
// a descricao com HTML escapado (&lt;a href...&gt;); sem decodificar, sobra
// "href"/"target" como texto e suja resumo + termos em alta.
function decodeEntities(s = "") {
  return s
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}
function strip(s = "") {
  let t = s.replace(/<!\[CDATA\[|\]\]>/g, "");
  t = decodeEntities(t); // &lt;a href...&gt; -> <a href...>
  t = t.replace(/<[^>]+>/g, " "); // agora remove as tags reais
  t = t.replace(/&[a-z#0-9]+;/gi, " "); // entidades que sobraram
  return t.replace(/\s+/g, " ").trim();
}
function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? strip(m[1]) : "";
}

// extrai a primeira imagem do item: media:content, media:thumbnail,
// enclosure (type image) ou <img src> dentro do conteudo.
function pickImage(block) {
  let m =
    block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i) ||
    block.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (m) return m[1];
  m = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i) ||
      block.match(/<enclosure[^>]+type=["']image[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return null;
}

// User-Agent de navegador (evita muitos bloqueios 403).
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return decodeBody(res, Buffer.from(await res.arrayBuffer()));
  } finally {
    clearTimeout(to);
  }
}

// Decodifica o corpo no charset certo. Muitos feeds BR (ex: Folha) sao
// ISO-8859-1/Windows-1252; ler como UTF-8 gera "for�a", "S�o Paulo".
function decodeBody(res, buf) {
  let charset = "";
  const ct = res.headers.get("content-type") || "";
  const mCt = ct.match(/charset=["']?([\w-]+)/i);
  if (mCt) charset = mCt[1].toLowerCase();
  if (!charset) {
    const head = buf.subarray(0, 300).toString("latin1");
    const mx = head.match(/encoding=["']([\w-]+)["']/i);
    if (mx) charset = mx[1].toLowerCase();
  }
  if (["iso-8859-1", "latin1", "latin-1", "windows-1252", "cp1252"].includes(charset)) {
    return new TextDecoder("windows-1252").decode(buf);
  }
  try {
    return new TextDecoder(charset || "utf-8").decode(buf);
  } catch {
    return buf.toString("utf-8");
  }
}

const looksLikeFeed = (txt) =>
  /<rss[\s>]|<feed[\s>]|<rdf:rdf|<item[\s>]|<entry[\s>]/i.test(txt.slice(0, 5000));

// acha o endereco do RSS dentro de uma pagina HTML (<link rel="alternate" ...>)
function findFeedLink(html, baseUrl) {
  for (const tag of html.match(/<link[^>]+>/gi) || []) {
    if (/rel=["']?alternate/i.test(tag) && /(rss|atom)\+xml/i.test(tag)) {
      const m = tag.match(/href=["']([^"']+)["']/i);
      if (m) return new URL(m[1], baseUrl).href;
    }
  }
  return null;
}

const COMMON = ["/feed/", "/rss/", "/feed", "/rss.xml", "/index.xml"];

// Resolve um feed a partir de qualquer URL (home, /feed, /rss, etc).
async function resolveFeed(url) {
  let txt = null;
  let firstErr = null;
  try {
    txt = await fetchText(url);
  } catch (e) {
    firstErr = e;
  }
  if (txt && looksLikeFeed(txt)) return { txt, url };
  if (txt && /<html/i.test(txt.slice(0, 3000))) {
    const link = findFeedLink(txt, url);
    if (link) {
      try {
        const t2 = await fetchText(link);
        if (looksLikeFeed(t2)) return { txt: t2, url: link };
      } catch {}
    }
  }
  const origin = new URL(url).origin;
  for (const suf of COMMON) {
    const cand = origin + suf;
    if (cand === url) continue;
    try {
      const t = await fetchText(cand);
      if (looksLikeFeed(t)) return { txt: t, url: cand };
    } catch {}
  }
  throw firstErr || new Error("feed nao encontrado");
}

const safeDate = (s) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// Suporta RSS (<item>) e Atom (<entry>). hintSector = setor da fonte (fallback).
function parseEntries(xml, host, hintSector = "geral") {
  const blocks = [
    ...[...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((m) => m[0]),
    ...[...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((m) => m[0]),
  ];
  return blocks.map((block) => {
    const title = pick(block, "title");
    let link = pick(block, "link");
    if (!link) {
      const m = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (m) link = m[1];
    }
    const desc = pick(block, "description") || pick(block, "summary") || pick(block, "content");
    const pub =
      pick(block, "pubDate") || pick(block, "published") || pick(block, "updated") || pick(block, "dc:date");
    // classifica pelo texto; se nao achou setor, usa o setor da fonte
    let sector = classify(`${title} ${desc}`);
    if (sector === "geral") sector = hintSector;
    // lentes (temas que cruzam setores): 0, 1 ou varias por noticia
    const themes = classifyThemes(`${title} ${desc}`);
    return {
      lang: LANG,
      sector,
      themes,
      title,
      summary: desc.slice(0, 600),
      source: host,
      url: link,
      image_url: pickImage(block),
      published_at: pub ? safeDate(pub) : null,
    };
  });
}

// Fallback universal: Google News RSS por dominio (nao bloqueia, traz manchetes
// recentes do veiculo). Usado quando o site nao expoe RSS ou bloqueia o robo.
function googleNewsFeed(domain) {
  const q = encodeURIComponent(`site:${domain}`);
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

// Tenta o RSS nativo; se falhar, cai pro Google News mantendo o veiculo original.
async function getFeed(feed) {
  const domain = new URL(feed.url).hostname.replace(/^www\./, "");
  try {
    const { url, txt } = await resolveFeed(feed.url);
    return { txt, source: new URL(url).hostname.replace(/^www\./, ""), via: "rss" };
  } catch {
    const txt = await fetchText(googleNewsFeed(domain), 15000);
    return { txt, source: domain, via: "google" };
  }
}

async function main() {
  const feeds = FEEDS;
  let total = 0;
  let ok = 0;
  let fail = 0;
  let viaGoogle = 0;
  const bySector = {};
  const byTheme = {};
  const failed = [];
  const CONC = 6;

  for (let i = 0; i < feeds.length; i += CONC) {
    const batch = feeds.slice(i, i + CONC);
    await Promise.all(
      batch.map(async (feed) => {
        try {
          const { txt, source, via } = await getFeed(feed);
          if (via === "google") viaGoogle++;
          const articles = parseEntries(txt, source, feed.sector).filter((a) => a.title && a.url);
          if (articles.length === 0) {
            console.log(`  ${feed.url}: 0 itens`);
            failed.push(feed.url);
            return;
          }
          const { error } = await supabase
            .from("news_articles")
            .upsert(articles, { onConflict: "url", ignoreDuplicates: true });
          if (error) {
            console.error(`  erro ${feed.url}: ${error.message}`);
            fail++;
            failed.push(feed.url);
            return;
          }
          total += articles.length;
          ok++;
          for (const a of articles) {
            bySector[a.sector] = (bySector[a.sector] || 0) + 1;
            for (const th of a.themes) byTheme[th] = (byTheme[th] || 0) + 1;
          }
          console.log(`  ${feed.url}: ${articles.length} itens${via === "google" ? " [google]" : ""}`);
        } catch (e) {
          console.error(`  falhou ${feed.url}: ${e.message}`);
          fail++;
          failed.push(feed.url);
        }
      }),
    );
  }

  console.log(`\nPronto. ${ok} feeds ok (${viaGoogle} via Google News), ${fail} falharam, total de fontes: ${feeds.length}.`);
  console.log(`${total} noticias processadas (duplicadas ignoradas).`);
  console.log("Por setor:", bySector);
  console.log("Por lente:", byTheme);
  if (failed.length) {
    console.log(`\nSem feed (${failed.length}):`);
    for (const u of failed) console.log(`  - ${u}`);
  }
}

main();
