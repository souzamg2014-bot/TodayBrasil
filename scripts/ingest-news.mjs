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
import { SOURCES_INTL } from "./sources.intl.mjs";
import { classifyThemes } from "./themes.mjs";
import { classify } from "./classify.mjs";
import { isJunk } from "./junk.mjs";

// idioma default (fontes PT). Fontes intl trazem o proprio lang.
const LANG = process.env.INGEST_LANG || "pt";
// qual conjunto de fontes: pt (default) | intl | all
const FEED_SET = process.env.FEED_SET || "pt";
// retencao: apaga noticias com mais de N horas (data da noticia). 0 = nao limpa.
const RETENTION_HOURS = Number(process.env.RETENTION_HOURS ?? 48);
// lentes de dados primarios (datadas pelo EVENTO, nao pela coleta: CVM, falencias,
// CAGED, IBAMA). Saem esporadicamente, entao tem retencao propria, contada pela
// data de COLETA (created_at), nao pela data do evento.
const LENTES_PRIMARIAS = ["cvm", "falimentar", "trabalho", "esg"];
const LENTE_RETENTION_DAYS = Number(process.env.LENTE_RETENTION_DAYS ?? 5);

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

// fontes (dedupe por URL). cada fonte: { url, sector, lang? }.
const RAW_FEEDS =
  FEED_SET === "intl" ? SOURCES_INTL :
  FEED_SET === "all" ? [...SOURCES, ...SOURCES_INTL] :
  SOURCES;
const FEEDS = [...new Map(RAW_FEEDS.map((s) => [s.url, s])).values()];

// classificador de setor: scripts/classify.mjs (compartilhado com a varredura)

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

// descarte de lixo (titulo SEC/cupom + URL publieditorial): scripts/junk.mjs

// Suporta RSS (<item>) e Atom (<entry>). feed = { sector, lang? }.
function parseEntries(xml, host, feed = {}) {
  const isIntl = feed.lang && feed.lang !== "pt";
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
    let sector, themes;
    if (isIntl) {
      // o classificador/lentes sao PT-BR: para intl usa o setor da fonte, sem lentes
      sector = feed.sector || "geral";
      themes = [];
    } else {
      sector = classify(`${title} ${desc}`);
      if (sector === "geral") sector = feed.sector || "geral";
      themes = classifyThemes(`${title} ${desc}`);
    }
    const lang = feed.lang || LANG;
    return {
      lang,
      country: feed.country || (lang === "pt" ? "BR" : null),
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
function googleNewsFeed(domain, lang = "pt") {
  const q = encodeURIComponent(`site:${domain}`);
  if (lang === "es") return `https://news.google.com/rss/search?q=${q}&hl=es-419&gl=MX&ceid=MX:es-419`;
  if (lang && lang !== "pt") return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

// Tenta o RSS nativo; se falhar, cai pro Google News mantendo o veiculo original.
async function getFeed(feed) {
  const domain = new URL(feed.url).hostname.replace(/^www\./, "");
  try {
    const { url, txt } = await resolveFeed(feed.url);
    return { txt, source: new URL(url).hostname.replace(/^www\./, ""), via: "rss" };
  } catch {
    const txt = await fetchText(googleNewsFeed(domain, feed.lang), 15000);
    return { txt, source: domain, via: "google" };
  }
}

// Regra de retencao, em duas faixas:
//  1) Noticias (fluxo RSS): expira por DATA DA NOTICIA (coalesce(published_at,
//     created_at)) com RETENTION_HOURS, igual ao que o feed mostra. As lentes
//     primarias ficam de fora dessa faixa (themes nao sobrepoe LENTES_PRIMARIAS).
//  2) Lentes primarias (CVM/falencias/CAGED/IBAMA): datadas pelo evento (data
//     antiga), entao expiram por DATA DE COLETA (created_at) com LENTE_RETENTION_DAYS.
async function purgeOld() {
  const lentesLit = `{${LENTES_PRIMARIAS.join(",")}}`;
  // 1) fluxo de noticias, exceto as lentes primarias
  if (RETENTION_HOURS > 0) {
    const cutoff = new Date(Date.now() - RETENTION_HOURS * 3600 * 1000).toISOString();
    const { count, error } = await supabase
      .from("news_articles")
      .delete({ count: "exact" })
      .or(`published_at.lt.${cutoff},and(published_at.is.null,created_at.lt.${cutoff})`)
      .not("themes", "ov", lentesLit);
    if (error) console.error(`  erro na limpeza de noticias (>${RETENTION_HOURS}h): ${error.message}`);
    else console.log(`\nLimpeza noticias: ${count ?? 0} com mais de ${RETENTION_HOURS}h apagadas (corte ${cutoff}).`);
  }
  // 2) lentes de dados primarios, por data de coleta
  if (LENTE_RETENTION_DAYS > 0) {
    const cutoffL = new Date(Date.now() - LENTE_RETENTION_DAYS * 86400 * 1000).toISOString();
    const { count, error } = await supabase
      .from("news_articles")
      .delete({ count: "exact" })
      .lt("created_at", cutoffL)
      .overlaps("themes", LENTES_PRIMARIAS);
    if (error) console.error(`  erro na limpeza de lentes (>${LENTE_RETENTION_DAYS}d): ${error.message}`);
    else console.log(`Limpeza lentes: ${count ?? 0} de dados primarios com mais de ${LENTE_RETENTION_DAYS}d apagadas (corte ${cutoffL}).`);
  }
}

// a coluna news_articles.country pode ainda nao existir (antes de rodar
// supabase/16_country.sql). Se faltar, ingerimos sem country em vez de quebrar.
let HAS_COUNTRY = true;
async function probeCountry() {
  const { error } = await supabase.from("news_articles").select("country").limit(1);
  if (error) {
    HAS_COUNTRY = false;
    console.log("coluna 'country' ausente: ingerindo sem country (rode supabase/16_country.sql).");
  }
}

async function main() {
  await probeCountry();
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
          let articles = parseEntries(txt, source, feed).filter((a) => a.title && a.url && !isJunk(a.title, a.url));
          if (articles.length === 0) {
            console.log(`  ${feed.url}: 0 itens`);
            failed.push(feed.url);
            return;
          }
          if (!HAS_COUNTRY) articles = articles.map(({ country, ...rest }) => rest);
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

  await purgeOld();
}

main();
