// ============================================================
// newsfeed - backfill das LENTES no que ja existe no banco.
//
// Le todas as noticias (id, title, summary), aplica as MESMAS regras do
// robo (scripts/themes.mjs) e grava themes[]. Roda quantas vezes quiser
// (idempotente: sempre recalcula a partir do texto).
//
// Rodar:  npm run backfill:themes
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (igual ingest).
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { classifyThemes } from "./themes.mjs";

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

const PAGE = 1000;   // linhas por leitura
const CONC = 20;     // updates em paralelo

async function main() {
  let from = 0;
  let processed = 0;
  let tagged = 0;
  const byTheme = {};

  for (;;) {
    const { data, error } = await supabase
      .from("news_articles")
      .select("id, title, summary")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("erro lendo:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (let i = 0; i < data.length; i += CONC) {
      const batch = data.slice(i, i + CONC);
      await Promise.all(
        batch.map(async (row) => {
          const themes = classifyThemes(`${row.title ?? ""} ${row.summary ?? ""}`);
          const { error: upErr } = await supabase
            .from("news_articles")
            .update({ themes })
            .eq("id", row.id);
          if (upErr) {
            console.error(`  erro id ${row.id}: ${upErr.message}`);
            return;
          }
          processed++;
          if (themes.length) {
            tagged++;
            for (const th of themes) byTheme[th] = (byTheme[th] || 0) + 1;
          }
        }),
      );
    }

    console.log(`  ...${processed} processadas`);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`\nPronto. ${processed} noticias, ${tagged} com pelo menos 1 lente.`);
  console.log("Por lente:", byTheme);
}

main();
