// ============================================================
// newsfeed - AUDITORIA DE CONTEUDO do banco (o que ja entrou).
//
// A ingestao (ingest-news.mjs) barra o lixo na ENTRADA. Este script e a REDE DE
// SEGURANCA: varre o que ja esta em news_articles com as MESMAS regras
// (scripts/junk.mjs) e:
//   - reporta o publieditorial/lixo encontrado (com amostra);
//   - com --purge, apaga esse lixo;
//   - reporta "suspeitos" por titulo (promo/oferta/review) para revisao humana,
//     SEM apagar (pode ter falso positivo, ex.: "Oferta Publica" da CVM).
//
// Rodar:  node scripts/audit-content.mjs            (so reporta, banco inteiro)
//         node scripts/audit-content.mjs --purge    (reporta + apaga o lixo)
//   AUDIT_SINCE_MIN=120  -> audita so o que entrou nos ultimos N min (rede de
//                           seguranca por ciclo de ingestao; leve). 0 = tudo.
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { isJunk, isAdvertorialUrl, isJunkTitle } from "./junk.mjs";

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

const PURGE = process.argv.includes("--purge");
const SINCE_MIN = Number(process.env.AUDIT_SINCE_MIN || 0);
const PAGE = 1000;

// sinais fracos por titulo (so revisao humana, nao apaga)
const SUSPECT = /\b(promoc\w*|desconto|cupom|\d+%\s*off|melhores\s+\w+|vale a pena|black friday|frete gr[aá]tis)\b/i;
// nao confundir com finas legitimas
const SUSPECT_OK = /oferta p[uú]blica|oferta hostil/i;

async function fetchAll() {
  const cutoff = SINCE_MIN > 0 ? new Date(Date.now() - SINCE_MIN * 60 * 1000).toISOString() : null;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from("news_articles")
      .select("id, title, url, source")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (cutoff) q = q.gte("created_at", cutoff);
    const { data, error } = await q;
    if (error) { console.error("erro lendo news_articles:", error.message); process.exit(1); }
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

async function main() {
  const rows = await fetchAll();
  console.log(`Escopo: ${SINCE_MIN > 0 ? `ultimos ${SINCE_MIN} min` : "banco inteiro"} | analisadas: ${rows.length}`);

  const junk = rows.filter((r) => isJunk(r.title, r.url));
  const byReason = { advertorial: 0, titulo: 0 };
  const bySource = {};
  for (const r of junk) {
    if (isAdvertorialUrl(r.url)) byReason.advertorial++;
    else if (isJunkTitle(r.title)) byReason.titulo++;
    const s = r.source || "?";
    bySource[s] = (bySource[s] || 0) + 1;
  }

  console.log(`\nLIXO (regra junk.mjs): ${junk.length}`);
  console.log(`  publieditorial/advertorial (URL): ${byReason.advertorial}`);
  console.log(`  titulo-lixo (SEC/cupom):          ${byReason.titulo}`);
  const topSrc = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (topSrc.length) console.log("  por fonte:", Object.fromEntries(topSrc));
  for (const r of junk.slice(0, 8)) console.log(`   · [${r.source}] ${(r.title || "").slice(0, 66)}`);

  // suspeitos por titulo (nao apaga)
  const suspects = rows.filter(
    (r) => !isJunk(r.title, r.url) && SUSPECT.test(r.title || "") && !SUSPECT_OK.test(r.title || ""),
  );
  console.log(`\nSUSPEITOS por titulo (revisar, NAO apagados): ${suspects.length}`);
  for (const r of suspects.slice(0, 10)) console.log(`   ? [${r.source}] ${(r.title || "").slice(0, 66)}`);

  if (!PURGE) {
    console.log(`\n(Modo relatorio. Rode com --purge para apagar os ${junk.length} itens de lixo.)`);
    return;
  }
  if (junk.length === 0) { console.log("\nNada a apagar."); return; }

  let apagados = 0;
  const ids = junk.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { error, count } = await supabase
      .from("news_articles")
      .delete({ count: "exact" })
      .in("id", chunk);
    if (error) { console.error("erro apagando:", error.message); process.exit(1); }
    apagados += count ?? chunk.length;
  }
  console.log(`\nPURGE: ${apagados} item(ns) de lixo apagado(s).`);
}

main();
