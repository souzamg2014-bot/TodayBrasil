// ============================================================
// Caderno Exclusivo - BRIEFING do dia (passo 1 de 3)
//
// Puxa o material das lentes/setor (Brasil, PT) dos ultimos dias e monta um
// briefing por tema com candidatos. Voce cola o briefing pro redator (a IA),
// que escreve 5 materias por tema. Depois: caderno-insert.mjs.
//
// Rodar:  node scripts/caderno-brief.mjs
//   CADERNO_DIAS=2        (janela)
//   CADERNO_CANDIDATOS=25 (candidatos por tema)
// Gera: caderno-brief.md (na raiz do projeto)
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
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

// tema do Caderno -> de onde vem o material (lente ou setor)
const TEMAS = [
  { id: "ma", label: "M&A", lens: "ma" },
  { id: "startup", label: "Startups", lens: "empreendedorismo" },
  { id: "inovacao", label: "Inovação & IA", lens: "inovacao" },
  { id: "industria", label: "Indústria", sector: "industria" },
  { id: "politica", label: "Política & Regulação", lens: "politica" },
];

const DIAS = Number(process.env.CADERNO_DIAS || 2);
const PER = Number(process.env.CADERNO_CANDIDATOS || 25);
const JA_DIAS = Number(process.env.CADERNO_JA_DIAS || 10); // janela do que ja saiu
const cutoff = new Date(Date.now() - DIAS * 86400 * 1000).toISOString();

// o que ja virou materia (p/ NAO repetir): urls de fontes ja usadas + titulos
async function jaPublicado() {
  const desde = new Date(Date.now() - JA_DIAS * 86400 * 1000).toISOString();
  const { data } = await supabase
    .from("caderno_articles")
    .select("titulo, tema, fontes, published_at")
    .gte("published_at", desde)
    .order("published_at", { ascending: false });
  const urls = new Set();
  for (const a of data ?? [])
    for (const f of a.fontes ?? []) if (f?.url) urls.add(f.url);
  return { urls, artigos: data ?? [] };
}

async function candidatos(t, usadas) {
  let q = supabase
    .from("news_articles")
    .select("title, summary, source, url, published_at")
    .eq("lang", "pt")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(PER * 2); // pega mais p/ compensar os que serao filtrados
  if (t.lens) q = q.overlaps("themes", [t.lens]);
  if (t.sector) q = q.eq("sector", t.sector);
  const { data, error } = await q;
  if (error) { console.error(`erro ${t.id}:`, error.message); return []; }
  // remove o que ja foi usado como fonte de materia anterior
  return (data ?? []).filter((a) => !usadas.has(a.url)).slice(0, PER);
}

async function main() {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const { urls: usadas, artigos } = await jaPublicado();

  let md = `# Briefing do Caderno — ${hoje}\n\n`;
  md += `Janela: últimos ${DIAS} dia(s). Escreva **5 matérias por tema** seguindo docs/caderno-prompt.md.\n`;
  md += `Saída: um JSON array (campos: tema, slug, titulo, highlight, resumo, conteudo, fontes[]).\n\n`;

  // o que NAO repetir (ja publicado nos ultimos dias)
  md += `## JÁ PUBLICADO (NÃO repetir estes assuntos) — ${artigos.length}\n\n`;
  if (artigos.length === 0) md += "_nada ainda._\n";
  for (const a of artigos) md += `- [${a.tema}] ${a.titulo}\n`;
  md += `\n(As notícias já usadas como fonte foram removidas dos candidatos abaixo.)\n`;

  for (const t of TEMAS) {
    const itens = await candidatos(t, usadas);
    md += `\n---\n\n## TEMA: ${t.id}  (${t.label}) — ${itens.length} candidatos\n\n`;
    if (itens.length === 0) { md += "_sem material recente._\n"; continue; }
    itens.forEach((a, i) => {
      const d = a.published_at ? new Date(a.published_at).toLocaleDateString("pt-BR") : "";
      md += `${i + 1}. **${a.title}** — ${a.source} · ${d}\n`;
      if (a.summary) md += `   ${a.summary.replace(/\s+/g, " ").slice(0, 280)}\n`;
      md += `   ${a.url}\n\n`;
    });
  }

  writeFileSync(new URL("../caderno-brief.md", import.meta.url), md, "utf8");
  console.log(`OK: caderno-brief.md gerado (${TEMAS.length} temas, janela ${DIAS}d).`);
  console.log("Cole o conteudo do arquivo pro redator (a IA).");
}

main();
