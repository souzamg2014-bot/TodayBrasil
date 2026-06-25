// ============================================================
// newsfeed - ingester CVM: lente "Fatos Relevantes CVM"
//
// Baixa o indice IPE do ano corrente da CVM (dados abertos), filtra
// Categoria = "Fato Relevante" (mercado inteiro, sem filtro de empresa)
// e grava cada um como item do feed com themes=['cvm'].
//
// Porte Node do scripts/ipe-diario/atualizar_ipe.py (balancos2026), mas
// aqui faz UPSERT (dedupe por url=Link_Download), nao truncate.
//
// Rodar:  npm run ingest:cvm
//   DRY=1 -> so imprime, nao grava.
//   CVM_ANO=2026 (default: ano corrente)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { unzipSync } from "fflate";

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

const ANO = Number(process.env.CVM_ANO || new Date().getFullYear());
const URL_IPE = `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${ANO}.zip`;

// CSV com ; e aspas (campos podem conter ; e quebras de linha). Tokenizer simples.
function parseCSV(text, sep = ";") {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignora */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const norm = (s) => (s || "").trim().replace(/\s+/g, " ");

// "2026-02-05" (so data) ou "2026-06-20 18:30:00" -> ISO com -03:00 (Brasilia)
function parseEntrega(v) {
  let s = norm(v);
  if (!s) return null;
  s = s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += "T12:00:00-03:00";        // data pura -> meio-dia
  else if (!/[zZ]|[+-]\d\d:\d\d$/.test(s)) s += "-03:00";           // datetime sem fuso
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function dataBR(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// mapeia nome de coluna (normalizado) -> chave canonica
function colKey(h) {
  const u = h.trim().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "_").toUpperCase();
  const map = {
    CNPJ_COMPANHIA: "cnpj", NOME_COMPANHIA: "nome", CATEGORIA: "categoria",
    TIPO: "tipo", ESPECIE: "especie", ASSUNTO: "assunto",
    DATA_ENTREGA: "entrega", DATA_REFERENCIA: "referencia",
    LINK_DOWNLOAD: "link", PROTOCOLO_ENTREGA: "protocolo",
  };
  return map[u] || null;
}

async function main() {
  console.log(`[CVM] ano=${ANO} baixando ${URL_IPE}`);
  const res = await fetch(URL_IPE, { headers: { "User-Agent": "Mozilla/5.0 newsfeed" } });
  if (!res.ok) { console.error(`[CVM] HTTP ${res.status}`); process.exit(1); }
  const zipped = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(zipped);
  const csvName = Object.keys(files).find((n) => n.toLowerCase().endsWith(".csv"));
  if (!csvName) { console.error("[CVM] nenhum CSV no zip"); process.exit(1); }

  const text = new TextDecoder("windows-1252").decode(files[csvName]); // CVM = latin1
  const rows = parseCSV(text);
  if (rows.length < 2) { console.error("[CVM] CSV vazio"); process.exit(1); }

  const header = rows[0].map(colKey);
  const idx = {};
  header.forEach((k, i) => { if (k) idx[k] = i; });
  console.log(`[CVM] ${rows.length - 1} linhas brutas`);

  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (k) => (idx[k] != null ? norm(row[idx[k]]) : "");
    if (get("categoria") !== "Fato Relevante") continue;
    const link = get("link");
    if (!link) continue; // sem link nao ha como dedupar
    const nome = get("nome") || "Companhia aberta";
    const assunto = get("assunto");
    const entrega = parseEntrega(get("entrega"));
    items.push({
      lang: "pt",
      sector: "geral",
      themes: ["cvm"],
      title: (assunto ? `${nome}: ${assunto}` : `${nome}: fato relevante`).slice(0, 200),
      summary: [
        `Fato relevante protocolado na CVM em ${dataBR(entrega)}.`,
        assunto || "",
        "Fonte: CVM (dados abertos).",
      ].filter(Boolean).join(" ").slice(0, 600),
      source: "CVM",
      url: link,
      image_url: null,
      published_at: entrega,
    });
  }

  const uniq = [...new Map(items.map((it) => [it.url, it])).values()];
  console.log(`[CVM] ${uniq.length} fatos relevantes`);

  if (DRY) {
    console.log("[DRY] amostra:");
    for (const it of uniq.slice(0, 5)) console.log(" •", it.title, "|", it.published_at);
    return;
  }

  let total = 0;
  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    const { error } = await supabase
      .from("news_articles")
      .upsert(chunk, { onConflict: "url", ignoreDuplicates: true });
    if (error) { console.error("[CVM] erro upsert:", error.message); process.exit(1); }
    total += chunk.length;
  }
  console.log(`[CVM] OK: ${total} itens enviados (duplicados ignorados).`);
}

main();
