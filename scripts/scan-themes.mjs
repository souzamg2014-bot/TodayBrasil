// ============================================================
// Auditoria das LENTES por palavra-chave (ma, empreendedorismo, politica,
// inovacao, investimentos). Para cada lente, mostra QUAL termo disparou e
// quantos itens, com amostras, p/ achar termo vazando (falso positivo).
//
// Rodar:  node scripts/scan-themes.mjs           (todas)
//         node scripts/scan-themes.mjs ma        (so uma lente, com mais amostras)
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { THEME_RULES, normalize } from "./themes.mjs";

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

const only = process.argv[2]; // lente especifica, opcional
const LENSES = only ? [only] : Object.keys(THEME_RULES);
const has = (t, term) => t.includes(" " + term);

async function fetchLens(ids) {
  const all = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("news_articles")
      .select("title, summary, themes")
      .overlaps("themes", ids)
      .range(from, from + PAGE - 1);
    if (error) { console.error("erro:", error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

async function main() {
  const rows = await fetchLens(LENSES);
  console.log(`Itens nas lentes ${LENSES.join(",")}: ${rows.length}\n`);

  for (const lens of LENSES) {
    const rule = THEME_RULES[lens];
    if (!rule) { console.log(`(lente ${lens} nao e por palavra-chave)`); continue; }
    const items = rows.filter((r) => (r.themes || []).includes(lens));
    const byTerm = {};   // termo -> { n, samples[] }
    for (const r of items) {
      const t = normalize(`${r.title} ${r.summary || ""}`);
      for (const term of rule.any) {
        if (has(t, term)) {
          const b = (byTerm[term] = byTerm[term] || { n: 0, samples: [] });
          b.n++;
          if (b.samples.length < (only ? 6 : 3)) b.samples.push(r.title);
        }
      }
    }
    console.log(`\n===== ${lens}: ${items.length} itens =====`);
    const ranked = Object.entries(byTerm).sort((a, b) => b[1].n - a[1].n);
    for (const [term, b] of ranked) {
      console.log(`  "${term}"  -> ${b.n}`);
      for (const s of b.samples) console.log(`        ${s.slice(0, 85)}`);
    }
  }
}

main();
