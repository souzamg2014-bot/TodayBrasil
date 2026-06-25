// ============================================================
// Backfill de SETOR: re-classifica o que ja esta no banco com o
// classificador corrigido (scripts/classify.mjs, por fronteira de palavra).
//
// Regra: so atualiza quando o novo setor e != 'geral' e != do gravado.
// Empate/sem match -> mantem o setor atual (nao mexe). Itens das lentes de
// fonte primaria (cvm/falimentar/trabalho/esg) sao ignorados.
//
// Rodar:  DRY=1 node scripts/backfill-sectors.mjs   (so conta)
//         node scripts/backfill-sectors.mjs          (aplica)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { classify } from "./classify.mjs";

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
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const LENS_SOURCED = new Set(["cvm", "falimentar", "trabalho", "esg"]);

async function main() {
  let from = 0, scanned = 0, toUpdate = [];
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("news_articles")
      .select("id, title, summary, sector, themes")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error("erro:", error.message); process.exit(1); }
    if (!data?.length) break;
    for (const r of data) {
      scanned++;
      if ((r.themes || []).some((t) => LENS_SOURCED.has(t))) continue;
      const novo = classify(`${r.title} ${r.summary || ""}`);
      if (novo !== "geral" && novo !== r.sector) toUpdate.push({ id: r.id, sector: novo });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`Escaneados: ${scanned} | a atualizar: ${toUpdate.length}`);
  if (DRY) { console.log("[DRY] nada gravado."); return; }

  let done = 0;
  const CONC = 20;
  for (let i = 0; i < toUpdate.length; i += CONC) {
    await Promise.all(
      toUpdate.slice(i, i + CONC).map(async (u) => {
        const { error } = await supabase.from("news_articles").update({ sector: u.sector }).eq("id", u.id);
        if (error) console.error(`  erro ${u.id}: ${error.message}`);
        else done++;
      }),
    );
  }
  console.log(`OK: ${done} setores corrigidos.`);
}

main();
