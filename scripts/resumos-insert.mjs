// ============================================================
// Resumos Inteligentes - INSERIR (passo 2 de 2)
//
// Le um JSON array (o que a IA devolveu a partir de resumos-brief.md) e:
//   1. faz upsert dos campos de SITE em public.resumos (dedupe por tema+janela+data_ref);
//   2. grava o conteudo SOCIAL em redes-sociais/{tema}/{data_ref}/{janela}.md
//      (post unico: titulo + legenda para LinkedIn e Instagram).
//
// Rodar:  node scripts/resumos-insert.mjs resumos.json
// ============================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // raiz do projeto newsfeed

function loadEnv() {
  try {
    const txt = readFileSync(join(ROOT, ".env.local"), "utf8");
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
const JANELAS = new Set(["manha", "tarde", "noite"]);

// monta o markdown social (post unico por rede)
function socialMd(a) {
  const li = a.social?.linkedin ?? {};
  const ig = a.social?.instagram ?? {};
  let md = `---\n`;
  md += `tema: ${a.tema}\njanela: ${a.janela}\ndata: ${a.data_ref}\nn_fontes: ${a.n_fontes ?? 0}\n`;
  md += `---\n\n# ${a.titulo}\n\n`;
  md += `## LinkedIn\n\n`;
  if (li.titulo) md += `**${li.titulo}**\n\n`;
  md += `${li.legenda ?? ""}\n\n`;
  md += `## Instagram\n\n`;
  if (ig.titulo) md += `**${ig.titulo}**\n\n`;
  md += `${ig.legenda ?? ""}\n`;
  // fontes ao final, p/ conferencia
  if (Array.isArray(a.fontes) && a.fontes.length) {
    md += `\n## Fontes\n\n`;
    for (const f of a.fontes) md += `- [${f.titulo ?? f.url}](${f.url})\n`;
  }
  return md;
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("uso: node scripts/resumos-insert.mjs <arquivo.json>"); process.exit(1); }

  let arr;
  try { arr = JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { console.error("JSON invalido:", e.message); process.exit(1); }
  if (!Array.isArray(arr)) arr = [arr];

  const rows = [];
  const erros = [];
  let escritos = 0;

  for (const [i, a] of arr.entries()) {
    if (!a || !TEMAS.has(a.tema) || !JANELAS.has(a.janela) || !a.data_ref || !a.titulo) {
      erros.push(`#${i + 1}: faltam campos (tema/janela validos, data_ref, titulo)`);
      continue;
    }
    const n = a.n_fontes ?? (Array.isArray(a.fontes) ? a.fontes.length : 0);
    rows.push({
      tema: a.tema,
      janela: a.janela,
      data_ref: a.data_ref,
      titulo: a.titulo,
      resumo: a.resumo ?? null,
      destaques: Array.isArray(a.destaques) ? a.destaques : [],
      fontes: Array.isArray(a.fontes) ? a.fontes : [],
      n_fontes: n,
      publicado: a.publicado !== false,
      published_at: a.published_at || new Date().toISOString(),
    });

    // grava o social (se houver)
    if (a.social) {
      const dir = join(ROOT, "redes-sociais", a.tema, a.data_ref);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${a.janela}.md`), socialMd(a), "utf8");
      escritos++;
    }
  }

  if (erros.length) console.log("Ignorados:\n  " + erros.join("\n  "));
  if (rows.length === 0) { console.error("Nada valido pra inserir."); process.exit(1); }

  const { error } = await supabase
    .from("resumos")
    .upsert(rows, { onConflict: "tema,janela,data_ref" });
  if (error) { console.error("erro:", error.message); process.exit(1); }

  const porTema = {};
  for (const r of rows) porTema[r.tema] = (porTema[r.tema] || 0) + 1;
  console.log(`OK: ${rows.length} resumos no site.`, porTema);
  console.log(`Social: ${escritos} arquivo(s) em redes-sociais/.`);
}

main();
