// ============================================================
// newsfeed - ingester IBAMA: lente "ESG"
//
// Baixa (streaming) o pacote de autos de infracao do IBAMA (dados abertos),
// processa SO o CSV do ano corrente (auto_infracao_ano_{ANO}.csv), filtra
// autos LAVRADOS de pessoa JURIDICA recentes e grava com themes=['esg'].
//
// O zip tem ~112MB (um CSV por ano, 1977..hoje). Com streaming so o ano
// corrente e descompactado/parseado. Atualiza pouco -> rodar SEMANAL.
//
// Rodar:  npm run ingest:ibama   (DRY=1 -> so imprime; IBAMA_DIAS=120)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Unzip, UnzipInflate } from "fflate";

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

const ANO = Number(process.env.IBAMA_ANO || new Date().getFullYear());
const DIAS = Number(process.env.IBAMA_DIAS || 120);
const ZIP_URL = "https://dadosabertos.ibama.gov.br/dados/SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip";

const cutoff = Date.now() - DIAS * 86400 * 1000;
const norm = (s) => (s || "").trim().replace(/\s+/g, " ");
// Title Case por palavra (preserva acentos; o \b ASCII miscaseava ç/ã/õ)
const titleCase = (s) =>
  norm(s).toLowerCase().split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

function parseData(v) {
  const s = norm(v).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00-03:00`);
  return isNaN(d.getTime()) ? null : d;
}
const dataBR = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
function valBR(v) {
  const n = Number(norm(v).replace(/\./g, "").replace(",", "."));
  return isFinite(n) && n > 0 ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
}

function rowToItem(get) {
  if (get("DES_STATUS_FORMULARIO") !== "Lavrado") return null;
  const tp = get("TP_PESSOA_INFRATOR").toUpperCase();
  if (!(tp === "PJ" || tp.startsWith("JUR"))) return null; // so empresas (Pessoa Juridica)
  const d = parseData(get("DAT_HORA_AUTO_INFRACAO"));
  if (!d || d.getTime() < cutoff) return null;

  const nome = titleCase(get("NOME_INFRATOR")) || "Empresa não identificada";
  const mun = titleCase(get("MUNICIPIO"));
  const uf = get("UF");
  const infr = norm(get("DES_INFRACAO")) || norm(get("DES_AUTO_INFRACAO"));
  const grav = norm(get("GRAVIDADE_INFRACAO"));
  const val = valBR(get("VAL_AUTO_INFRACAO"));
  const num = get("NUM_AUTO_INFRACAO");

  return {
    lang: "pt",
    sector: "energia-recursos",
    themes: ["esg"],
    title: `${nome}: auto de infração ambiental (IBAMA)`.slice(0, 200),
    summary: [
      `Autuada pelo IBAMA em ${dataBR(d)}${mun ? ` em ${mun}/${uf}` : uf ? ` (${uf})` : ""}.`,
      infr ? `${infr}.` : "",
      val ? `Multa: R$ ${val}.` : "",
      grav ? `Gravidade: ${grav}.` : "",
    ].filter(Boolean).join(" ").slice(0, 600),
    source: "IBAMA",
    url: `https://www.google.com/search?q=${encodeURIComponent(`IBAMA auto de infração ${num} ${nome}`)}`,
    image_url: null,
    published_at: d.toISOString(),
  };
}

async function main() {
  const target = `auto_infracao_ano_${ANO}.csv`;
  console.log(`[IBAMA] baixando ${ZIP_URL} (so ${target}, janela ${DIAS}d)`);

  const items = [];
  let header = null;
  // parser CSV em streaming, COM aspas (campos tem ; e \n dentro)
  let field = "", row = [], inQ = false, pending = "";
  function endField() { row.push(field); field = ""; }
  function endRow() {
    endField();
    if (row.length === 1 && row[0] === "") { row = []; return; } // linha em branco
    if (!header) {
      header = {};
      row.forEach((c, i) => { header[norm(c).toUpperCase()] = i; });
    } else {
      const get = (k) => (header[k] != null ? norm(row[header[k]]) : "");
      const it = rowToItem(get);
      if (it) items.push(it);
    }
    row = [];
  }
  function feed(text) {
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ";") endField();
      else if (c === "\n") endRow();
      else if (c === "\r") { /* ignora */ }
      else field += c;
    }
  }

  await new Promise((resolve, reject) => {
    const unzip = new Unzip();
    unzip.register(UnzipInflate);
    const dec = new TextDecoder("utf-8"); // UM decoder (mantem bytes UTF-8 partidos entre chunks)
    let handled = false;
    unzip.onfile = (file) => {
      if (file.name !== target) return; // ignora os outros anos (nao descompacta)
      handled = true;
      file.ondata = (err, chunk, final) => {
        if (err) return reject(err);
        // segura 1 char (p/ o peek de aspas escapadas "" funcionar no limite do chunk)
        let text = pending + dec.decode(chunk, { stream: !final });
        if (!final) { pending = text.slice(-1); text = text.slice(0, -1); }
        else { pending = ""; }
        feed(text);
        if (final) { if (field.length || row.length) endRow(); resolve(); }
      };
      file.start();
    };
    (async () => {
      try {
        const res = await fetch(ZIP_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) { unzip.push(new Uint8Array(0), true); break; }
          unzip.push(value, false);
        }
        if (!handled) resolve(); // ano corrente ainda nao existe no pacote
      } catch (e) { reject(e); }
    })();
  });

  const uniq = [...new Map(items.map((it) => [it.url, it])).values()];
  console.log(`[IBAMA] ${uniq.length} autos (Juridica, Lavrado, ${DIAS}d)`);

  if (DRY) {
    for (const it of uniq.slice(0, 8)) console.log(" •", it.title, "|", it.published_at?.slice(0, 10));
    return;
  }
  let total = 0;
  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    const { error } = await supabase
      .from("news_articles")
      .upsert(chunk, { onConflict: "url", ignoreDuplicates: true });
    if (error) { console.error("[IBAMA] erro upsert:", error.message); process.exit(1); }
    total += chunk.length;
  }
  console.log(`[IBAMA] OK: ${total} itens enviados (duplicados ignorados).`);
}

main();
