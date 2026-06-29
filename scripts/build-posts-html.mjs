// ============================================================
// Posts prontos - GERADOR do app de arte (redes-sociais/posts-prontos.html)
//
// Le um JSON de resumos (default: resumos.json) e injeta os posts no array
// `const POSTS = [...]` do posts-prontos.html, sem tocar no resto do app
// (estilo, editor, zoom/pan da imagem, legendas editaveis).
//
// Para cada resumo gera UM post (titulo da arte + legendas LinkedIn/Instagram).
//   - arte_titulo: titulo da arte; a parte entre [colchetes] sai pintada.
//                  se ausente, usa social.instagram.titulo.
//   - linkedin: social.linkedin.titulo + legenda.   instagram: social.instagram.legenda.
//
// Rodar:  node scripts/build-posts-html.mjs [arquivo.json]
// Obs: o app guarda ajustes (imagem, zoom, texto editado) por post no
//      localStorage, chaveado pelo id "tema/data/janela.md".
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDEM = ["industria", "inovacao", "ma", "politica", "startup"];

const inArg = process.argv[2] || "resumos.json";
const inPath = isAbsolute(inArg) ? inArg : join(ROOT, inArg);
const arr = JSON.parse(readFileSync(inPath, "utf8"));

function toPost(a) {
  const li = a.social?.linkedin ?? {};
  const ig = a.social?.instagram ?? {};
  const arteTitulo = a.arte_titulo || ig.titulo || a.titulo || "";
  const linkedin = [li.titulo, li.legenda].filter(Boolean).join("\n\n");
  return {
    id: `${a.tema}/${a.data_ref}/${a.janela}.md`,
    tema: a.tema,
    data: a.data_ref,
    titulo: arteTitulo,
    linkedin,
    instagram: ig.legenda || "",
  };
}

// ordena por tema (ORDEM) e depois por data, pra ficar estavel
const posts = [...arr]
  .filter((a) => a && a.tema && a.data_ref && a.janela)
  .sort((x, y) =>
    (ORDEM.indexOf(x.tema) - ORDEM.indexOf(y.tema)) ||
    String(x.data_ref).localeCompare(String(y.data_ref)) ||
    String(x.janela).localeCompare(String(y.janela)),
  )
  .map(toPost);

if (posts.length === 0) { console.error("Nenhum resumo valido em", inPath); process.exit(1); }

const htmlPath = join(ROOT, "redes-sociais", "posts-prontos.html");
let html = readFileSync(htmlPath, "utf8");
const re = /const POSTS = \[[\s\S]*?\n\];/;
if (!re.test(html)) { console.error("array `const POSTS` nao encontrado em posts-prontos.html"); process.exit(1); }
html = html.replace(re, "const POSTS = " + JSON.stringify(posts, null, 2) + ";");
writeFileSync(htmlPath, html, "utf8");

console.log(`OK: posts-prontos.html atualizado com ${posts.length} post(s).`);
console.log("  " + posts.map((p) => `${p.tema}/${p.data}`).join("  "));
