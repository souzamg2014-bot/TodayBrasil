// ============================================================
// Caderno Exclusivo - INSERIR materias (passo 3 de 3)
//
// Le um JSON array (o que o redator/IA devolveu) e grava em caderno_articles.
// Dedupe/atualizacao por slug.
//
// Rodar:  node scripts/caderno-insert.mjs caderno-articles.json
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TEMAS = new Set(["ma", "startup", "inovacao", "industria", "politica"]);
const slugify = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("uso: node scripts/caderno-insert.mjs <arquivo.json>"); process.exit(1); }

  let arr;
  try {
    arr = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) { console.error("JSON invalido:", e.message); process.exit(1); }
  if (!Array.isArray(arr)) arr = [arr];

  const rows = [];
  const erros = [];
  for (const [i, a] of arr.entries()) {
    if (!a || !TEMAS.has(a.tema) || !a.titulo || !a.conteudo) {
      erros.push(`#${i + 1}: faltam campos (tema valido, titulo, conteudo)`);
      continue;
    }
    rows.push({
      tema: a.tema,
      slug: (a.slug && slugify(a.slug)) || slugify(a.titulo),
      titulo: a.titulo,
      highlight: a.highlight ?? null,
      resumo: a.resumo ?? null,
      conteudo: a.conteudo,
      fontes: Array.isArray(a.fontes) ? a.fontes : [],
      imagem_url: a.imagem_url ?? null,
      publicado: a.publicado !== false,
      published_at: a.published_at || new Date().toISOString(),
    });
  }

  if (erros.length) { console.log("Ignorados:\n  " + erros.join("\n  ")); }
  if (rows.length === 0) { console.error("Nada valido pra inserir."); process.exit(1); }

  const { error } = await supabase
    .from("caderno_articles")
    .upsert(rows, { onConflict: "slug" }); // re-rodar atualiza pelo slug
  if (error) { console.error("erro:", error.message); process.exit(1); }

  const porTema = {};
  for (const r of rows) porTema[r.tema] = (porTema[r.tema] || 0) + 1;
  console.log(`OK: ${rows.length} matérias gravadas.`, porTema);
}

main();
