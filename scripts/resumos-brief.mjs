// ============================================================
// Resumos Inteligentes - BRIEFING por setor (passo 1 de 2)
//
// Puxa os candidatos (Brasil, PT) de cada SETOR do dia e monta um briefing.
// Voce (a IA) le e escreve UM resumo agregado por setor, cruzando o maior numero
// de fontes possivel. Depois: resumos-insert.mjs.
//
// Deixamos de usar janelas (manha/tarde): agora e um panorama do dia por setor.
//
// Rodar:  node scripts/resumos-brief.mjs
//   DATA=2026-07-02     (dia de referencia; default = hoje BRT)
//   HORAS=48            (janela de lookback em horas ate agora; default 48)
//   RESUMOS_CANDIDATOS=60  (candidatos por setor; default 60)
// Gera: resumos-brief.md (na raiz do projeto)
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

// setor do resumo -> de onde vem o material (setor da taxonomia ou lente).
// Espelha src/lib/resumos.ts (mantenha os dois em sincronia).
const TEMAS = [
  { id: "ma",         label: "M&A",                      lens: "ma" },
  { id: "agro",       label: "Agronegócio",              sector: "agronegocio" },
  { id: "comercio",   label: "Comércio e Varejo",        sector: "comercio-varejista" },
  { id: "industria",  label: "Indústria",                sector: "industria" },
  { id: "tecnologia", label: "Tecnologia",               sector: "tecnologia-software" },
  { id: "telecom",    label: "Telecom",                  sector: "telecomunicacoes" },
  { id: "financeiro", label: "Financeiro",               sector: "servicos-financeiros" },
  { id: "transporte", label: "Transporte e Logística",   sector: "transporte-logistica" },
  { id: "energia",    label: "Energia",                  sector: "energia-recursos" },
  { id: "saude",      label: "Saúde",                    sector: "saude-bem-estar" },
  { id: "construcao", label: "Construção e Imobiliário", sector: "construcao-imobiliario" },
];

const PER = Number(process.env.RESUMOS_CANDIDATOS || 60);
const HORAS = Number(process.env.HORAS || 48);

// data de referencia (YYYY-MM-DD) em BRT
const hojeBRT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dataRef = process.env.DATA || hojeBRT;

// janela de lookback: das ultimas HORAS horas ate agora.
const startISO = new Date(Date.now() - HORAS * 3600 * 1000).toISOString();

async function candidatos(t) {
  let q = supabase
    .from("news_articles")
    .select("title, summary, source, url, published_at")
    .eq("lang", "pt")
    .gte("published_at", startISO)
    .order("published_at", { ascending: false })
    .limit(PER);
  if (t.lens) q = q.overlaps("themes", [t.lens]);
  if (t.sector) q = q.eq("sector", t.sector);
  const { data, error } = await q;
  if (error) { console.error(`erro ${t.id}:`, error.message); return []; }
  return data ?? [];
}

async function main() {
  let md = `# Briefing dos Resumos por setor — ${dataRef} (últimas ${HORAS}h)\n\n`;
  md += `Escreva **um resumo agregado por setor** seguindo docs/resumos-prompt.md.\n`;
  md += `Cruze o MAIOR numero de fontes. Texto DETALHADO. Saida: JSON array (tema, data_ref, titulo, resumo, destaques[], fontes[], n_fontes, arte_titulo, social{}).\n`;
  md += `Para todos os itens: \`data_ref\`="${dataRef}" (o campo \`janela\` e preenchido pelo insert como 'geral').\n`;

  for (const t of TEMAS) {
    const itens = await candidatos(t);
    md += `\n---\n\n## SETOR: ${t.id}  (${t.label}) — ${itens.length} candidatos\n\n`;
    if (itens.length === 0) { md += "_sem material neste periodo._\n"; continue; }
    itens.forEach((a, i) => {
      const hora = a.published_at
        ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(a.published_at))
        : "";
      md += `${i + 1}. **${a.title}** — ${a.source} · ${hora}\n`;
      if (a.summary) md += `   ${a.summary.replace(/\s+/g, " ").slice(0, 320)}\n`;
      md += `   ${a.url}\n\n`;
    });
  }

  writeFileSync(new URL("../resumos-brief.md", import.meta.url), md, "utf8");
  console.log(`OK: resumos-brief.md gerado (${dataRef}, últimas ${HORAS}h, até ${PER} por setor).`);
  console.log("Leia o arquivo e escreva resumos.json; depois rode resumos-insert.mjs.");
}

main();
