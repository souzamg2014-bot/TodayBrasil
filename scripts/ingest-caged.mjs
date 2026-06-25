// ============================================================
// newsfeed - ingester CAGED: lente "Mercado de Trabalho"
//
// Puxa do SGS do Banco Central a serie 28763 (estoque de emprego formal
// do Novo Caged, ~47,8 milhoes). O SALDO mensal (vagas liquidas criadas)
// e a variacao mes a mes. Gera 1 item por mes com themes=['trabalho'].
//
// API SGS (JSON, sem chave):
//   https://api.bcb.gov.br/dados/serie/bcdata.sgs.28763/dados/ultimos/15?formato=json
//
// Rodar:  npm run ingest:caged   (DRY=1 -> so imprime)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
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

const DRY = process.env.DRY === "1";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY (ou use DRY=1).");
  process.exit(1);
}
const supabase = DRY ? null : createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const SERIE = 28763; // Novo Caged - estoque de emprego formal
const N = Number(process.env.CAGED_MESES || 14); // quantos meses puxar

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// "01/04/2026" -> {y,m,d}
function parseBR(s) {
  const [d, m, y] = s.split("/").map(Number);
  return { y, m, d };
}
const milhar = (n) => Math.round(n).toLocaleString("pt-BR");
const milhoes = (n) => (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

async function main() {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIE}/dados/ultimos/${N}?formato=json`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`[CAGED] HTTP ${res.status}`); process.exit(1); }
  const serie = await res.json(); // [{data:"01/04/2026", valor:"47810425.00"}, ...]
  serie.sort((a, b) => {
    const A = parseBR(a.data), B = parseBR(b.data);
    return A.y - B.y || A.m - B.m;
  });

  const items = [];
  for (let i = 1; i < serie.length; i++) {
    const cur = serie[i], prev = serie[i - 1];
    const estoque = Number(cur.valor);
    const saldo = estoque - Number(prev.valor);
    if (!isFinite(saldo)) continue;
    const { y, m } = parseBR(cur.data);
    const mesAno = `${MESES[m - 1]}/${y}`;
    const sinal = saldo >= 0 ? "+" : "-";
    const abs = Math.abs(saldo);
    items.push({
      lang: "pt",
      sector: "geral",
      themes: ["trabalho"],
      title: `Emprego formal: ${sinal}${milhar(abs)} vagas líquidas em ${mesAno} (CAGED)`,
      summary:
        `Saldo de empregos formais (Novo Caged) em ${mesAno}: ${sinal}${milhar(abs)} postos. ` +
        `Estoque total: ${milhoes(estoque)} milhões de vínculos. ` +
        `Fonte: Banco Central (SGS, série ${SERIE}), com base no CAGED/MTE.`,
      source: "CAGED · MTE/BCB",
      url: `https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/novo-caged#${y}${String(m).padStart(2, "0")}`,
      image_url: null,
      published_at: new Date(`${y}-${String(m).padStart(2, "0")}-01T12:00:00-03:00`).toISOString(),
    });
  }

  console.log(`[CAGED] ${items.length} meses`);
  if (DRY) {
    for (const it of items) console.log(" •", it.title);
    return;
  }
  const { error } = await supabase
    .from("news_articles")
    .upsert(items, { onConflict: "url", ignoreDuplicates: true });
  if (error) { console.error("[CAGED] erro upsert:", error.message); process.exit(1); }
  console.log(`[CAGED] OK: ${items.length} itens enviados (duplicados ignorados).`);
}

main();
