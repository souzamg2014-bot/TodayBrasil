// ============================================================
// AUDITORIA AUTOMATICA DOS FILTROS (zero token, sem banco).
//
// Os filtros (setor + lentes) sao o coracao do produto. Este script roda
// sozinho (no CI, ver .github/workflows/audit-filters.yml) e protege tres
// coisas:
//
//   1) GOLDEN  - re-classifica manchetes-verdade (scripts/fixtures.filters.mjs)
//                e exige o setor/lentes corretos. Pega regressao em quem mexe
//                em classify.mjs ou themes.mjs.
//   2) DRIFT   - cruza os ids do classificador (.mjs) com a taxonomia que a UI
//                mostra (src/lib/sectors.ts, src/lib/themes.ts). Pega setor/lente
//                que existe num lado e nao no outro (chip sem palavra-chave, id
//                renomeado, etc).
//   3) LINT    - sanidade das regras: palavra-chave duplicada, que normaliza pra
//                vazio, exclusao orfa, prefixo curto demais (risco de ruido) e
//                colisao da mesma palavra em varios setores.
//
// Erros (drift, golden, duplicata, normaliza vazio) -> exit 1 (quebra o CI).
// Avisos (colisao, prefixo curto, exclusao orfa) -> so reporta.
//
// Rodar:  npm run audit:filters   (ou: node scripts/audit-filters.mjs)
//   AUDIT_STRICT=1  -> trata avisos como erro tambem.
// ============================================================

import { readFileSync } from "node:fs";
import { KEYWORDS, EXCLUDE, scoreSectors, classify } from "./classify.mjs";
import { THEME_RULES, classifyThemes, normalize } from "./themes.mjs";
import { SECTOR_CASES, THEME_CASES } from "./fixtures.filters.mjs";

// lentes alimentadas por fonte primaria (ingester proprio), nao por palavra-chave:
// existem em themes.ts mas de proposito NAO tem regra em themes.mjs.
const PRIMARY_SOURCE_LENSES = new Set(["cvm", "falimentar", "trabalho", "esg"]);

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// ---- le os ids da taxonomia que a UI usa (arquivos .ts) ----
function idsFromTs(relPath) {
  try {
    const txt = readFileSync(new URL(relPath, import.meta.url), "utf8");
    return [...txt.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  } catch (e) {
    err(`nao consegui ler ${relPath}: ${e.message}`);
    return [];
  }
}
const uiSectors = idsFromTs("../src/lib/sectors.ts"); // inclui 'geral'
const uiThemes = idsFromTs("../src/lib/themes.ts");

// ============================================================
// 1) GOLDEN
// ============================================================
let goldenPass = 0;
function runGolden() {
  console.log("== 1) GOLDEN (manchetes-verdade) ==");

  for (const c of SECTOR_CASES) {
    const got = classify(c.text);
    if (got === c.sector) goldenPass++;
    else err(`setor: esperava [${c.sector}] mas veio [${got}]  «${c.text}»`);
  }

  const sortU = (a) => [...new Set(a)].sort();
  const eq = (a, b) => {
    const x = sortU(a), y = sortU(b);
    return x.length === y.length && x.every((v, i) => v === y[i]);
  };
  for (const c of THEME_CASES) {
    const got = classifyThemes(c.text);
    if (eq(got, c.themes)) goldenPass++;
    else err(`lentes: esperava [${sortU(c.themes).join(",") || "—"}] mas veio [${sortU(got).join(",") || "—"}]  «${c.text}»`);
  }

  const total = SECTOR_CASES.length + THEME_CASES.length;
  console.log(`   ${goldenPass}/${total} casos ok\n`);
}

// ============================================================
// 2) DRIFT (classificador .mjs  x  taxonomia .ts)
// ============================================================
function runDrift() {
  console.log("== 2) DRIFT (classificador x taxonomia da UI) ==");
  const kwSectors = new Set(Object.keys(KEYWORDS));
  const uiSet = new Set(uiSectors);

  for (const id of kwSectors)
    if (!uiSet.has(id)) err(`drift setor: classify.mjs classifica "${id}" mas sectors.ts nao tem esse chip`);
  for (const id of uiSectors)
    if (id !== "geral" && !kwSectors.has(id)) err(`drift setor: sectors.ts mostra "${id}" mas classify.mjs nao tem palavras-chave (setor nunca seria atribuido)`);

  const ruleThemes = new Set(Object.keys(THEME_RULES));
  const uiThemeSet = new Set(uiThemes);
  for (const id of ruleThemes)
    if (!uiThemeSet.has(id)) err(`drift lente: themes.mjs tem regra "${id}" mas themes.ts nao mostra o chip`);
  for (const id of uiThemes) {
    if (PRIMARY_SOURCE_LENSES.has(id)) continue; // fonte primaria, sem regra de palavra-chave
    if (!ruleThemes.has(id)) err(`drift lente: themes.ts mostra "${id}" mas themes.mjs nao tem regra de matching`);
  }
  console.log(`   setores: ${kwSectors.size} no matcher, ${uiSectors.length} na UI · lentes: ${ruleThemes.size} regras, ${uiThemes.length} chips\n`);
}

// ============================================================
// 3) LINT (sanidade das regras)
// ============================================================
function runLint() {
  console.log("== 3) LINT (sanidade das palavras-chave/lentes) ==");

  // a) palavra que normaliza pra vazio + duplicata dentro do mesmo setor
  const seenBySector = {};
  const ownerOf = {}; // needle normalizado -> [setores]
  for (const [sector, words] of Object.entries(KEYWORDS)) {
    const seen = (seenBySector[sector] = new Set());
    for (const w of words) {
      const exact = /\s$/.test(w);
      const core = normalizeKw(w);
      if (!core) { err(`lint: palavra-chave vazia/sem letra em [${sector}]: ${JSON.stringify(w)}`); continue; }
      const key = core + (exact ? " " : "");
      if (seen.has(key)) warn(`lint: palavra-chave duplicada em [${sector}]: "${w}"`);
      seen.add(key);
      (ownerOf[core] = ownerOf[core] || []).push(sector);
      // c) prefixo curto demais sem espaco no fim = casa muito (risco de ruido)
      if (!exact && core.length <= 2) warn(`lint: prefixo curto "${w}" em [${sector}] (<=2 letras, sem espaco final): casa muita coisa`);
    }
  }

  // b) colisao: mesma palavra-chave em 2+ setores (ambiguidade -> tende a 'geral')
  for (const [core, owners] of Object.entries(ownerOf)) {
    const uniq = [...new Set(owners)];
    if (uniq.length > 1) warn(`lint: palavra "${core}" aparece em varios setores: ${uniq.join(", ")} (vira empate/geral)`);
  }

  // d) exclusao orfa: a frase de EXCLUDE nao contem nenhuma palavra-chave do setor
  //    (entao nunca teria pontuado pra precisar descontar)
  for (const [sector, phrases] of Object.entries(EXCLUDE)) {
    const needles = (KEYWORDS[sector] || []).map(normalizeKw).filter(Boolean);
    for (const p of phrases) {
      const np = " " + normalizeKw(p) + " ";
      const cobre = needles.some((n) => np.includes(" " + n));
      if (!cobre) warn(`lint: exclusao orfa em [${sector}]: "${p}" nao contem nenhuma palavra-chave do setor`);
    }
  }

  // e) lentes: termo 'not' duplicado, termo vazio
  for (const [id, rule] of Object.entries(THEME_RULES)) {
    const all = [...(rule.any || []), ...(rule.not || [])];
    const seen = new Set();
    for (const t of all) {
      const n = normalize(t).trim();
      if (!n) { err(`lint: termo de lente vazio em [${id}]: ${JSON.stringify(t)}`); continue; }
      if (seen.has(n)) warn(`lint: termo de lente duplicado em [${id}]: "${t}"`);
      seen.add(n);
    }
  }

  console.log(`   ok (ver avisos abaixo, se houver)\n`);
}

// normaliza igual ao classify.mjs (minusculo, sem acento, so [a-z0-9], trim)
function normalizeKw(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

// ============================================================
runGolden();
runDrift();
runLint();

if (warns.length) {
  console.log(`AVISOS (${warns.length}):`);
  for (const w of warns) console.log("  ⚠ " + w);
  console.log("");
}

const strict = process.env.AUDIT_STRICT === "1";
const hardFail = errors.length > 0 || (strict && warns.length > 0);

if (errors.length) {
  console.log(`ERROS (${errors.length}):`);
  for (const e of errors) console.log("  ✖ " + e);
}

if (hardFail) {
  console.log(`\nAUDITORIA FALHOU. ${errors.length} erro(s)${strict ? `, ${warns.length} aviso(s) [strict]` : ""}.`);
  process.exit(1);
}
console.log(`AUDITORIA OK. ${goldenPass} casos golden passaram, ${warns.length} aviso(s), 0 erro(s).`);
