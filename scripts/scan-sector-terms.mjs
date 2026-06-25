// ============================================================
// Auditoria de SETOR por termo: para cada setor, mostra QUAL palavra-chave
// disparou e quantos itens (com amostra), p/ achar termo vazando.
// Tambem lista os itens "hint" (sem palavra; herdaram o setor da fonte) por
// fonte, que sao os mais sujeitos a erro.
//
// Rodar:  node scripts/scan-sector-terms.mjs              (todos os setores)
//         node scripts/scan-sector-terms.mjs agronegocio  (um setor, + amostras)
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { KEYWORDS, scoreSectors } from "./classify.mjs";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const only = process.argv[2];
const SECTORS = only ? [only] : Object.keys(KEYWORDS);
const nSamples = only ? 6 : 2;

// mesma normalizacao do classify.mjs
function normalize(s) {
  return " " + (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}
function matched(text, sector) {
  const t = normalize(text);
  return KEYWORDS[sector].map((w) => {
    const exact = /\s$/.test(w);
    const core = normalize(w).trim();
    return t.includes(" " + core + (exact ? " " : "")) ? w.trim() : null;
  }).filter(Boolean);
}

async function fetchSector(sec) {
  const all = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("news_articles")
      .select("title, summary, source")
      .eq("sector", sec)
      .range(from, from + PAGE - 1);
    if (error) { console.error("erro:", error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

async function main() {
  for (const sec of SECTORS) {
    const items = await fetchSector(sec);
    const byTerm = {};
    const hintBySource = {};
    let hint = 0;
    for (const r of items) {
      const terms = matched(`${r.title} ${r.summary || ""}`, sec);
      if (terms.length === 0) {
        hint++;
        hintBySource[r.source] = (hintBySource[r.source] || 0) + 1;
        continue;
      }
      for (const term of terms) {
        const b = (byTerm[term] = byTerm[term] || { n: 0, s: [] });
        b.n++;
        if (b.s.length < nSamples) b.s.push(r.title);
      }
    }
    console.log(`\n===== ${sec}: ${items.length} (por palavra: ${items.length - hint} | hint: ${hint}) =====`);
    for (const [term, b] of Object.entries(byTerm).sort((a, b) => b[1].n - a[1].n)) {
      console.log(`  "${term}" -> ${b.n}`);
      for (const s of b.s) console.log(`       ${s.slice(0, 84)}`);
    }
    if (hint) {
      const top = Object.entries(hintBySource).sort((a, b) => b[1] - a[1]).slice(0, 6);
      console.log(`  [hint por fonte] ${top.map(([k, n]) => `${k}:${n}`).join("  ")}`);
    }
  }
}

main();
