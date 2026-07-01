// ============================================================
// Resumos Inteligentes - BRIEFING da janela (passo 1 de 2)
//
// Puxa os candidatos (Brasil, PT) de cada tema DENTRO de uma janela de tempo e
// monta um briefing. Voce (a IA) le e escreve UM resumo agregado por tema,
// cruzando o maior numero de fontes. Depois: resumos-insert.mjs.
//
// Rodar:  node scripts/resumos-brief.mjs
//   JANELA=tarde            (manha|tarde; default = janela atual pelo relogio BRT)
//   DATA=2026-06-28         (dia de referencia; default = hoje)
// Gera: resumos-brief.md (na raiz do projeto)
//
// Janelas (BRT, cobrem 24h sem sobreposicao): manha = 00:00->12:00 | tarde = 12:00->24:00
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

// tema do resumo -> de onde vem o material (lente ou setor) [mesmo mapa do caderno]
const TEMAS = [
  { id: "ma", label: "M&A", lens: "ma" },
  { id: "startup", label: "Startups", lens: "empreendedorismo" },
  { id: "inovacao", label: "Inovação & IA", lens: "inovacao" },
  { id: "industria", label: "Indústria", sector: "industria" },
  { id: "politica", label: "Política & Regulação", lens: "politica" },
];

// janelas em horas locais BRT; cobrem o dia inteiro sem sobreposicao.
// tarde termina as 24h = 00:00 do dia seguinte.
const JANELAS = {
  manha: { label: "Manhã", faixa: "0h–12h", start: 0, end: 12 },
  tarde: { label: "Tarde", faixa: "12h–24h", start: 12, end: 24 },
};

const BRT = "-03:00";
const PER = Number(process.env.RESUMOS_CANDIDATOS || 30);

// janela atual pelo relogio BRT (se nao informada)
function janelaAtual() {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" })
      .format(new Date()),
  );
  return h < 12 ? "manha" : "tarde";
}

const janelaId = (process.env.JANELA || janelaAtual()).toLowerCase();
const J = JANELAS[janelaId];
if (!J) { console.error(`JANELA invalida: ${janelaId}. Use manha|tarde.`); process.exit(1); }

// data de referencia (YYYY-MM-DD) em BRT
const hojeBRT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dataRef = process.env.DATA || hojeBRT;

// limites ISO da janela (em BRT). tarde termina as 24h = 00:00 do dia seguinte.
function isoAt(dateStr, hour) {
  return `${dateStr}T${String(hour).padStart(2, "0")}:00:00${BRT}`;
}
function diaSeguinte(dateStr) {
  const d = new Date(`${dateStr}T12:00:00${BRT}`);
  d.setDate(d.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}
const startISO = isoAt(dataRef, J.start);
const endISO = J.end >= 24 ? isoAt(diaSeguinte(dataRef), J.end - 24) : isoAt(dataRef, J.end);

async function candidatos(t) {
  let q = supabase
    .from("news_articles")
    .select("title, summary, source, url, published_at")
    .eq("lang", "pt")
    .gte("published_at", startISO)
    .lt("published_at", endISO)
    .order("published_at", { ascending: false })
    .limit(PER);
  if (t.lens) q = q.overlaps("themes", [t.lens]);
  if (t.sector) q = q.eq("sector", t.sector);
  const { data, error } = await q;
  if (error) { console.error(`erro ${t.id}:`, error.message); return []; }
  return data ?? [];
}

async function main() {
  let md = `# Briefing dos Resumos — ${dataRef} · janela ${janelaId} (${J.faixa})\n\n`;
  md += `Escreva **um resumo agregado por tema** seguindo docs/resumos-prompt.md.\n`;
  md += `Cruze o MAIOR numero de fontes. Saida: JSON array (tema, janela, data_ref, titulo, resumo, destaques[], fontes[], n_fontes, social{}).\n`;
  md += `Para todos os itens: \`janela\`="${janelaId}", \`data_ref\`="${dataRef}".\n`;
  md += `Periodo coberto (BRT): ${startISO} -> ${endISO}.\n`;

  for (const t of TEMAS) {
    const itens = await candidatos(t);
    md += `\n---\n\n## TEMA: ${t.id}  (${t.label}) — ${itens.length} candidatos\n\n`;
    if (itens.length === 0) { md += "_sem material nesta janela._\n"; continue; }
    itens.forEach((a, i) => {
      const hora = a.published_at
        ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(a.published_at))
        : "";
      md += `${i + 1}. **${a.title}** — ${a.source} · ${hora}\n`;
      if (a.summary) md += `   ${a.summary.replace(/\s+/g, " ").slice(0, 280)}\n`;
      md += `   ${a.url}\n\n`;
    });
  }

  writeFileSync(new URL("../resumos-brief.md", import.meta.url), md, "utf8");
  console.log(`OK: resumos-brief.md gerado (janela ${janelaId}, ${dataRef}).`);
  console.log("Cole/leia o arquivo e escreva resumos.json; depois rode resumos-insert.mjs.");
}

main();
