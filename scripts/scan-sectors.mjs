// ============================================================
// Varredura de inconsistencias de SETOR no feed.
// Re-roda o classificador sobre o que esta no banco e sinaliza:
//   1) hint-based: setor veio da FONTE (texto nao bateu nenhuma palavra)
//   2) mismatch: o classificador hoje discorda do setor gravado
//   3) baixa confianca: decidido por 1 unica palavra (bestScore==1)
//   4) ambiguo: 1o e 2o setor empatados ou a 1 de distancia
// So leitura. Itens das lentes de fonte primaria (cvm/falimentar/trabalho/esg)
// sao ignorados (nao sao classificados por palavra-chave).
//
// Rodar:  node scripts/scan-sectors.mjs
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { scoreSectors, classify } from "./classify.mjs";

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

const LENS_SOURCED = new Set(["cvm", "falimentar", "trabalho", "esg"]);
const top = (scores) =>
  Object.entries(scores).sort((a, b) => b[1] - a[1]); // [ [sector,score], ... ]

async function fetchAll() {
  const all = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("news_articles")
      .select("id, title, summary, source, sector, themes")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error("erro:", error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

async function main() {
  const rows = await fetchAll();
  const news = rows.filter((r) => !(r.themes || []).some((t) => LENS_SOURCED.has(t)));
  console.log(`Total: ${rows.length} | classificaveis (noticias): ${news.length}\n`);

  // ANTES (gravado) x DEPOIS (classificador corrigido)
  const transitions = {};
  const samples = {};
  let changed = 0;
  for (const r of news) {
    const novo = classify(`${r.title} ${r.summary || ""}`);
    // mantem o setor da fonte (hint) quando o texto nao bate nada
    const final = novo === "geral" ? r.sector : novo;
    if (final !== r.sector) {
      changed++;
      const k = `${r.sector} -> ${final}`;
      transitions[k] = (transitions[k] || 0) + 1;
      (samples[k] = samples[k] || []).push(r.title);
    }
  }
  console.log(`== ANTES x DEPOIS (classificador por fronteira de palavra) ==`);
  console.log(`Mudariam de setor: ${changed} de ${news.length} (${((changed / news.length) * 100).toFixed(1)}%)\n`);
  const tr = Object.entries(transitions).sort((a, b) => b[1] - a[1]).slice(0, 22);
  for (const [k, n] of tr) {
    console.log(`   ${n.toString().padStart(4)}  ${k}`);
    console.log(`         ex: ${(samples[k][0] || "").slice(0, 78)}`);
  }
  console.log("");

  const hint = [];     // texto nao bate nada -> setor da fonte
  const mismatch = []; // classificador discorda
  const weak = [];     // decidido por 1 palavra
  const ambig = [];    // 1o e 2o quase empatados
  const bySrcSector = {}; // fonte::setor (so dos hint) p/ achar padrao sistematico

  for (const r of news) {
    const scores = scoreSectors(`${r.title} ${r.summary || ""}`);
    const ranked = top(scores);
    const best = ranked[0]; // pode ser undefined
    if (!best) {
      hint.push(r);
      const k = `${r.source} :: ${r.sector}`;
      bySrcSector[k] = (bySrcSector[k] || 0) + 1;
      continue;
    }
    const [bestSector, bestScore] = best;
    const storedScore = scores[r.sector] || 0;
    if (bestSector !== r.sector && bestScore > storedScore) {
      mismatch.push({ r, bestSector, bestScore, storedScore, ranked });
    } else if (bestScore === 1) {
      weak.push({ r, bestSector, ranked });
    }
    const second = ranked[1];
    if (second && best[1] - second[1] <= 0 && best[0] === r.sector) {
      ambig.push({ r, ranked });
    }
  }

  console.log(`== 1) HINT-BASED (setor veio da fonte, texto nao bateu nada): ${hint.length} ==`);
  const srcRank = Object.entries(bySrcSector).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, n] of srcRank) console.log(`   ${n.toString().padStart(4)}  ${k}`);

  console.log(`\n== 2) MISMATCH (classificador discorda do setor gravado): ${mismatch.length} ==`);
  for (const m of mismatch.slice(0, 25)) {
    const r = m.ranked.map(([s, n]) => `${s}:${n}`).join(", ");
    console.log(`   [${m.r.sector}] -> sugere [${m.bestSector}]  ${m.r.title.slice(0, 80)}`);
    console.log(`        scores: ${r}  | fonte: ${m.r.source}`);
  }

  console.log(`\n== 3) BAIXA CONFIANCA (1 palavra decidiu): ${weak.length} (amostra) ==`);
  for (const w of weak.slice(0, 20)) {
    console.log(`   [${w.r.sector}]  ${w.r.title.slice(0, 90)}  | fonte: ${w.r.source}`);
  }

  console.log(`\n== 4) AMBIGUO (1o e 2o empatados): ${ambig.length} (amostra) ==`);
  for (const a of ambig.slice(0, 15)) {
    const r = a.ranked.slice(0, 3).map(([s, n]) => `${s}:${n}`).join(", ");
    console.log(`   [${a.r.sector}]  ${a.r.title.slice(0, 80)}  | ${r}`);
  }
}

main();
