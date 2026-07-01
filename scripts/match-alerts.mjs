// ============================================================
// TodayBrasil - Central de Alertas: MOTOR DE MATCHING (custo zero)
//
// Roda DEPOIS da ingestao (mesmo workflow do GitHub Actions). Pega as noticias
// recem-coletadas, cruza com as REGRAS dos usuarios PAGOS (alert_rules) e grava
// NOTIFICACOES. A central in-app e o Web Push leem dessas notificacoes.
//
// Tipos de regra (v1): keyword (texto), sector (1 dos 18), lente (1 das 9).
//   - keyword: casa por substring normalizada (sem acento, minusculo) em titulo+resumo
//   - sector : article.sector === value
//   - lente  : article.themes contem value
//
// Conteudo da notificacao (por rodada, por regra):
//   - keyword     : 1 notificacao com a noticia mais recente que casou + convite ao site
//   - sector/lente: 1 notificacao AGREGADA ("N novas noticias em X"), sem listar tudo
//
// Rodar:  node scripts/match-alerts.mjs
//   ALERT_LOOKBACK_MIN=30   janela de noticias por created_at (default 30 min)
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { initPush, sendToSubs } from "./push-send.mjs";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente / .env.local");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const LOOKBACK_MIN = Number(process.env.ALERT_LOOKBACK_MIN ?? 30);

// alertas sao recurso PAGO (pro | caderno, dentro da validade). Mesma regra do isPaid.
function isPaid(plan, exp) {
  if (plan !== "pro" && plan !== "caderno") return false;
  if (!exp) return true;
  return new Date(exp).getTime() > Date.now();
}

// normaliza p/ comparar keyword: minusculo, sem acento, nao-alfanumerico -> espaco,
// com espaco nas pontas (fronteira de palavra). Evita casar "ia" dentro de
// "familia" ou "aco" dentro de "espaco" (mesma logica de classify/themes).
const COMBINING = /[̀-ͯ]/g; // marcas de acento (apos NFD)
function norm(s = "") {
  return (
    " " +
    s.normalize("NFD").replace(COMBINING, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() +
    " "
  );
}

// rotulos oficiais p/ o texto do alerta (espelham src/lib/themes.ts e sectors.ts).
// Nao dependemos do `label` salvo na regra: regras antigas podem estar sem ele.
const THEME_LABELS = {
  ma: "M&A", empreendedorismo: "Empreendedorismo", politica: "Política & Regulação",
  inovacao: "Inovação & IA", investimentos: "Investimentos", cvm: "Fatos Relevantes CVM",
  falimentar: "Movimento Falimentar", trabalho: "Mercado de Trabalho", esg: "ESG",
};
const SECTOR_LABELS = {
  agronegocio: "Agronegócio", "alimentos-bebidas": "Alimentos e Bebidas",
  "comercio-varejista": "Varejo", "comercio-atacadista": "Atacado e Distribuição",
  industria: "Indústria", "construcao-imobiliario": "Construção e Imobiliário",
  "tecnologia-software": "Tecnologia", telecomunicacoes: "Telecom",
  "servicos-financeiros": "Financeiro", "servicos-empresariais": "Serviços Empresariais",
  "saude-bem-estar": "Saúde", educacao: "Educação",
  "transporte-logistica": "Transporte e Logística", "energia-recursos": "Energia e Recursos",
  "turismo-hotelaria": "Turismo e Hotelaria", "servicos-domesticos": "Serviços e Pequenos Negócios",
  "economia-criativa": "Economia Criativa", "setor-publico-terceiro": "Setor Público e ONGs",
  geral: "Geral",
};

// nome de exibicao da regra. keyword: texto digitado (label) ou value.
function displayLabel(rule) {
  if (rule.kind === "sector") return SECTOR_LABELS[rule.value] || rule.label || rule.value;
  if (rule.kind === "lente") return THEME_LABELS[rule.value] || rule.label || rule.value;
  return rule.label || rule.value; // keyword
}

function ruleMatchesArticle(rule, art) {
  if (rule.kind === "sector") return art.sector === rule.value;
  if (rule.kind === "lente") return Array.isArray(art.themes) && art.themes.includes(rule.value);
  if (rule.kind === "keyword") {
    const hay = norm(`${art.title} ${art.summary ?? ""}`);
    const kw = norm(rule.value).trim();        // "petrobras", "tarifa aco"
    return kw.length > 0 && hay.includes(" " + kw); // inicio de palavra (prefixo)
  }
  return false;
}

async function main() {
  // 1) regras ativas
  const { data: rules, error: rErr } = await supabase
    .from("alert_rules")
    .select("id, user_id, kind, value, label, channels, active")
    .eq("active", true);
  if (rErr) { console.error("erro lendo alert_rules:", rErr.message); process.exit(1); }
  if (!rules?.length) { console.log("Sem regras ativas. Nada a fazer."); return; }

  // 1b) plano dos donos. alert_rules.user_id e profiles.id ambos referenciam
  // auth.users (nao ha FK entre as duas), entao o PostgREST nao faz embed:
  // buscamos os profiles a parte e filtramos por plano pago em memoria.
  const userIds = [...new Set(rules.map((r) => r.user_id))];
  const { data: profs, error: pErr } = await supabase
    .from("profiles")
    .select("id, plan, plan_expires_at")
    .in("id", userIds);
  if (pErr) { console.error("erro lendo profiles:", pErr.message); process.exit(1); }
  const planById = new Map((profs ?? []).map((p) => [p.id, p]));

  const liveRules = rules.filter((r) => {
    const p = planById.get(r.user_id);
    return isPaid(p?.plan, p?.plan_expires_at);
  });
  if (liveRules.length === 0) {
    console.log("Sem regras ativas de usuarios pagos. Nada a fazer.");
    return;
  }

  // 2) noticias recentes (por data de coleta)
  const cutoff = new Date(Date.now() - LOOKBACK_MIN * 60 * 1000).toISOString();
  const { data: arts, error: aErr } = await supabase
    .from("news_articles")
    .select("id, title, summary, url, sector, themes, published_at, created_at")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (aErr) { console.error("erro lendo news_articles:", aErr.message); process.exit(1); }
  if (!arts?.length) { console.log(`Sem noticias novas (ultimos ${LOOKBACK_MIN} min).`); return; }

  // 3) gera as notificacoes conforme o tipo da regra. arts vem ordenado por
  //    created_at desc, entao matches[0] e a noticia mais recente que casou.
  const rows = [];
  const wantsPush = new Map(); // rule_id -> regra pede push? (1 linha por regra por rodada)
  const seenArticle = new Set(); // evita 2 linhas com o mesmo (user, article) no batch

  for (const rule of liveRules) {
    const matches = arts.filter((a) => ruleMatchesArticle(rule, a));
    if (matches.length === 0) continue;
    const label = displayLabel(rule);
    wantsPush.set(rule.id, Array.isArray(rule.channels) && rule.channels.includes("push"));

    if (rule.kind === "keyword") {
      // 1 notificacao com a noticia mais recente + convite ao site.
      const art = matches[0];
      const akey = `${rule.user_id}|${art.id}`;
      if (seenArticle.has(akey)) continue; // outra regra ja usou essa noticia neste batch
      seenArticle.add(akey);
      rows.push({
        user_id: rule.user_id,
        rule_id: rule.id,
        article_id: art.id, // dedupe cross-rodada por unique(user_id, article_id)
        kind: rule.kind,
        value: rule.value,
        title: `Nova notícia sobre "${label}"`,
        body: `${art.title}\n\nEntre no TodayBrasil para conferir.`,
        url: `/?q=${encodeURIComponent(rule.value)}`,
      });
    } else {
      // sector | lente: notificacao AGREGADA (nao lista todas). article_id null
      // permite varias agregadas (uma por regra por rodada).
      const n = matches.length;
      rows.push({
        user_id: rule.user_id,
        rule_id: rule.id,
        article_id: null,
        kind: rule.kind,
        value: rule.value,
        title: `${n} ${n === 1 ? "nova notícia" : "novas notícias"} em ${label}`,
        body: "Confira as novidades no TodayBrasil.",
        url: rule.kind === "sector"
          ? `/?sector=${encodeURIComponent(rule.value)}`
          : `/?theme=${encodeURIComponent(rule.value)}`,
      });
    }
  }

  if (rows.length === 0) { console.log("Nenhuma noticia recente casou com as regras."); return; }

  // 4) grava. keyword deduplica por unique(user_id, article_id); as agregadas
  //    (article_id null) sempre entram. .select() devolve so as NOVAS.
  const { data: inserted, error: iErr } = await supabase
    .from("notifications")
    .upsert(rows, { onConflict: "user_id,article_id", ignoreDuplicates: true })
    .select("id, user_id, rule_id, article_id, title, body, url");
  if (iErr) { console.error("erro inserindo notifications:", iErr.message); process.exit(1); }

  const novas = inserted ?? [];
  console.log(`Regras ativas (pagas): ${liveRules.length} | noticias na janela: ${arts.length}`);
  console.log(`Notificacoes candidatas: ${rows.length} | novas gravadas: ${novas.length}.`);

  // 5) Web Push (opcional): so para as NOVAS cujas regras pedem 'push'.
  await dispatchPush(novas, wantsPush);
}

// Envia Web Push para as notificacoes novas marcadas com canal 'push'.
// No-op se a lib/chaves nao estiverem configuradas (a central in-app ja resolveu).
async function dispatchPush(novas, wantsPush) {
  const alvo = novas.filter((n) => wantsPush.get(n.rule_id));
  if (alvo.length === 0) return;
  const on = await initPush();
  if (!on) { console.log(`Push: desativado (lib/chaves ausentes). ${alvo.length} alerta(s) ficam so na central.`); return; }

  // agrupa por usuario p/ buscar as inscricoes uma vez
  const porUser = {};
  for (const n of alvo) (porUser[n.user_id] ??= []).push(n);

  let enviados = 0;
  const deadAll = [];
  for (const [userId, lista] of Object.entries(porUser)) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (!subs?.length) continue;
    for (const n of lista) {
      const dead = await sendToSubs(subs, {
        title: n.title,
        body: n.body ?? "",
        url: n.url ?? "/alertas",
        tag: n.id,
      });
      deadAll.push(...dead);
      enviados++;
    }
  }
  // limpa inscricoes expiradas (404/410)
  if (deadAll.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", deadAll);
  }
  console.log(`Push: ${enviados} alerta(s) enviados; ${deadAll.length} inscricao(oes) expirada(s) removida(s).`);
}

main();
