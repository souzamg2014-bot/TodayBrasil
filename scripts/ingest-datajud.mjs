// ============================================================
// newsfeed - ingester DataJud (CNJ): lente "Movimento Falimentar"
//
// Puxa da API publica do DataJud os processos das classes de falencia/
// recuperacao (CNJ/TPU): 129 Recuperacao Judicial, 130 Falencia,
// 131 Recuperacao Extrajudicial. Cada processo recente vira um item do
// feed com themes=['falimentar'].
//
// Obs: a API publica NAO traz o nome das partes (privacidade). Trazemos
// metadados: classe, vara/comarca (orgaoJulgador), tribunal e data.
//
// Rodar:  npm run ingest:datajud
//   DRY=1 -> so imprime, nao grava.
//   DATAJUD_UFS=sp,rj,mg,rs,pr  (default)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const DRY = process.env.DRY === "1";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY (ou use DRY=1).");
  process.exit(1);
}
const supabase = DRY ? null : createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// chave PUBLICA do CNJ (pode ser trocada pelo CNJ; conferir no datajud-wiki)
const APIKEY = process.env.DATAJUD_APIKEY ||
  "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

const UFS = (process.env.DATAJUD_UFS || "sp,rj,mg,rs,pr")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const CLASSES = [129, 130, 131]; // RJ, Falencia, Rec. Extrajudicial
const SIZE = Number(process.env.DATAJUD_SIZE || 100); // por tribunal, por rodada
const DAYS = Number(process.env.DATAJUD_DAYS || 45);  // janela (filtro client-side)

// 20 digitos -> NNNNNNN-DD.AAAA.J.TR.OOOO
function formatProc(n) {
  const s = String(n).replace(/\D/g, "").padStart(20, "0");
  return `${s.slice(0, 7)}-${s.slice(7, 9)}.${s.slice(9, 13)}.${s.slice(13, 14)}.${s.slice(14, 16)}.${s.slice(16, 20)}`;
}

// "20260531224257" -> ISO com fuso de Brasilia (-03:00)
function parseAjuiz(v) {
  const s = String(v || "").replace(/\D/g, "");
  if (s.length < 8) return null;
  const y = s.slice(0, 4), mo = s.slice(4, 6), d = s.slice(6, 8);
  const h = s.slice(8, 10) || "00", mi = s.slice(10, 12) || "00", se = s.slice(12, 14) || "00";
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}-03:00`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

function dataBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const titleCase = (s) =>
  (s || "").toLowerCase().replace(/\s+/g, " ").trim()
    .split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

// marcadores de pessoa JURIDICA (so empresas; ignoramos pessoa fisica)
const COMPANY_RE = /(\bS[.\/ ]?A\.?\b|\bLTDA\b|EIRELI|\bEPP\b|\bME\b|MASSA FALIDA|EM RECUPERA|COMPANHIA|\bCIA\b|PARTICIPA|INCORPORAD|EMPREEND|IND[UÚ]STRIA|COM[ÉE]RCIO|AGROPECU|TRANSPORT|CONSTRU|HOLDING|\bGRUPO\b)/i;

// DJEN / Comunica (CNJ): diario de justica eletronico nacional. Publico, traz
// as partes de forma estruturada (destinatarios[].nome).
async function fetchParties(procMasked) {
  try {
    const r = await fetch(
      `https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroProcesso=${encodeURIComponent(procMasked)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return [];
    const j = await r.json();
    const names = [];
    for (const it of j.items || [])
      for (const d of it.destinatarios || []) if (d && d.nome) names.push(String(d.nome));
    return names;
  } catch {
    return [];
  }
}

function cleanCompany(n) {
  let s = n.replace(/\s+/g, " ").trim();
  // tira sufixos de situacao (em recuperacao, falido, massa falida)
  s = s.replace(/\s*-?\s*(EM RECUPERA[ÇC][ÃA]O.*|FALID[OA]|MASSA FALIDA.*)$/i, "").trim();
  s = s.replace(/^MASSA FALIDA DE\s+/i, "").trim();
  s = titleCase(s);
  // conectores em minuscula (mas nunca a 1a palavra)
  s = s.replace(/(?!^)\b(De|Da|Do|Dos|Das|E)\b/g, (m) => m.toLowerCase());
  // normaliza formas societarias
  s = s.replace(/\bS[.\s]?A\.?\b/gi, "S.A.").replace(/\bS\/A\b/gi, "S.A.")
       .replace(/\bMe\b/g, "ME").replace(/\bEpp\b/g, "EPP").replace(/\bEireli\b/gi, "EIRELI");
  s = s.replace(/\.{2,}/g, ".").trim(); // "S.A.." -> "S.A."
  return s;
}

// escolhe o 1o destinatario que parece pessoa juridica
function pickCompany(names) {
  const uniq = [...new Set(names.map((n) => n.replace(/\s+/g, " ").trim()))];
  const comp = uniq.find((n) => COMPANY_RE.test(n));
  return comp ? cleanCompany(comp) : null;
}

async function searchTribunal(uf) {
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_tj${uf}/_search`;
  const body = {
    size: SIZE,
    query: {
      bool: {
        filter: [
          { terms: { "classe.codigo": CLASSES } },
          { term: { nivelSigilo: 0 } }, // so processos publicos
        ],
      },
    },
    sort: [{ dataAjuizamento: { order: "desc" } }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: APIKEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j?.hits?.hits ?? [];
}

function toItem(src) {
  const ajuiz = parseAjuiz(src.dataAjuizamento);
  const proc = formatProc(src.numeroProcesso);
  const classe = src.classe?.nome || "Processo falimentar";
  const orgao = src.orgaoJulgador?.nome || "";
  const trib = src.tribunal || "";
  const assuntos = (src.assuntos || []).map((a) => a.nome).filter(Boolean).slice(0, 3);
  return {
    lang: "pt",
    sector: "geral",
    themes: ["falimentar"],
    // fallback; o nome da empresa entra via DJEN no enriquecimento (main)
    title: `${classe} (${trib})`.slice(0, 200),
    summary: [
      orgao ? `${orgao}.` : "",
      `Processo ${proc} ajuizado em ${dataBR(ajuiz)}.`,
      assuntos.length ? `Assuntos: ${assuntos.join(", ")}.` : "",
      `Fonte: DataJud/CNJ (${trib}).`,
    ].filter(Boolean).join(" ").slice(0, 600),
    source: `DataJud · ${trib}`,
    // a API nao da link cidadao por processo; busca pelo numero resolve bem
    url: `https://www.google.com/search?q=${encodeURIComponent('"' + proc + '"')}`,
    image_url: null,
    published_at: ajuiz,
    _proc: proc,
    _classe: classe,
  };
}

async function main() {
  const cutoff = Date.now() - DAYS * 86400 * 1000;
  let total = 0;
  const byUf = {};
  const rows = [];

  for (const uf of UFS) {
    try {
      const hits = await searchTribunal(uf);
      const items = hits
        .map((h) => toItem(h._source))
        .filter((it) => it.published_at && new Date(it.published_at).getTime() >= cutoff);
      byUf[uf] = items.length;
      rows.push(...items);
      console.log(`  tj${uf}: ${hits.length} processos, ${items.length} na janela de ${DAYS}d`);
    } catch (e) {
      console.error(`  falhou tj${uf}: ${e.message}`);
    }
  }

  // dedupe por url dentro desta rodada
  const uniq = [...new Map(rows.map((r) => [r.url, r])).values()];

  // enriquece com o nome da empresa (pessoa juridica) via DJEN/Comunica
  let enriched = 0;
  const CONC = 6;
  for (let i = 0; i < uniq.length; i += CONC) {
    await Promise.all(
      uniq.slice(i, i + CONC).map(async (it) => {
        const company = pickCompany(await fetchParties(it._proc));
        if (company) {
          it.title = `${it._classe}: ${company}`.slice(0, 200);
          it.summary = `${company}. ${it.summary}`.slice(0, 600);
          enriched++;
        }
      }),
    );
  }
  for (const it of uniq) { delete it._proc; delete it._classe; }
  console.log(`[DJEN] ${enriched}/${uniq.length} itens com nome de empresa`);

  if (DRY) {
    console.log(`\n[DRY] ${uniq.length} itens (amostra):`);
    for (const r of uniq.slice(0, 8)) console.log(" •", r.title, "|", r.source);
    return;
  }

  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    // sem ignoreDuplicates: re-rodar ATUALIZA o titulo/resumo quando o DJEN
    // passa a ter o nome da empresa de um processo ja gravado.
    const { error } = await supabase
      .from("news_articles")
      .upsert(chunk, { onConflict: "url" });
    if (error) { console.error("erro upsert:", error.message); process.exit(1); }
    total += chunk.length;
  }

  console.log(`\nPronto. ${total} itens enviados (duplicados ignorados). Por UF:`, byUf);
}

main();
