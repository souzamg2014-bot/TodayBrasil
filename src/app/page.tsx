"use client";

import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { sectorLabel } from "@/lib/sectors";
import { THEMES, getTheme } from "@/lib/themes";
import { COUNTRIES, countryLabel } from "@/lib/countries";
import { timeAgo } from "@/lib/time";
import { supabase } from "@/lib/supabase";
import Entrance from "@/components/Entrance";
import PlansModal from "@/components/PlansModal";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import { useLang } from "@/components/LangProvider";
import { isPaid, FREE_LIMIT, type Plan } from "@/lib/plans";

type Item = {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  sector: string;
  themes: string[] | null;
  published_at: string | null;
};

type Stats = {
  sectors: { sector: string; n: number }[];
  topSearches: { q: string; hits: number }[];
  trending: { term: string; ndoc: number }[];
  countries?: { country: string; n: number }[];
};

export default function Home() {
  const { lang, t } = useLang();
  // multi-selecao de setores (vazio = tudo)
  const [selected, setSelected] = useState<string[]>([]);
  // lente ativa (uma de cada vez; null = nenhuma)
  const [theme, setTheme] = useState<string | null>(null);
  // escopo: 'br' (pt) ou 'mundo' (todos != pt)
  const [scope, setScope] = useState<"br" | "mundo">("br");
  // pais selecionado no Mundo (null = todos)
  const [country, setCountry] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const reqId = useRef(0);

  // sessao + plano (paywall)
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [plan, setPlan] = useState<Plan>("free");
  const [planExp, setPlanExp] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [atHome, setAtHome] = useState(false); // logo -> volta pra porta (home)
  const [showPlans, setShowPlans] = useState(false);
  const [pdfItem, setPdfItem] = useState<Item | null>(null); // leitor de PDF da CVM
  const paid = isPaid(plan, planExp);

  const openResumos = () => {
    if (paid) window.location.href = "/resumos";
    else setShowPlans(true);
  };

  const openAlertas = () => {
    if (paid) window.location.href = "/alertas";
    else setShowPlans(true);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setChecking(false);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // deep-link: /?sector=, /?theme= ou /?q= (usado pelos alertas) prefiltra o feed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const qp = sp.get("q");
    const sec = sp.get("sector");
    const th = sp.get("theme");
    const co = sp.get("country");
    if (qp) setQ(qp);
    if (sec) setSelected(sec.split(",").map((s) => s.trim()).filter(Boolean));
    if (th) setTheme(th);
    if (co) { setScope("mundo"); setCountry(co); }
  }, []);

  // carrega o plano do perfil ao logar
  useEffect(() => {
    if (!session) { setPlan("free"); setPlanExp(null); setIsAdmin(false); return; }
    supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) { setPlan((data.plan as Plan) ?? "free"); setPlanExp(data.plan_expires_at ?? null); }
      });
    // is_admin separado (tolera coluna ainda nao existir antes do 10_admin.sql)
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data?.is_admin), () => setIsAdmin(false));
  }, [session]);

  async function goCheckout(planId: "pro") {
    setShowPlans(false);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}),
        },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.message || "Assinatura em breve.");
    } catch {
      alert("Não foi possível iniciar a assinatura agora.");
    }
  }

  // rolagem horizontal das lentes (setas + roda do mouse)
  const lensesRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const updateArrows = useCallback(() => {
    const el = lensesRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);
  const nudgeLenses = (dir: number) =>
    lensesRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  const onLensesWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = lensesRef.current;
    if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
  };

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const sectorParam = selected.length ? selected.join(",") : "all";

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++reqId.current;
      setLoading(true);
      const params = new URLSearchParams({ sector: sectorParam, page: String(nextPage) });
      params.set("scope", scope);
      if (scope === "mundo" && country) params.set("country", country);
      if (debouncedQ && paid) params.set("q", debouncedQ); // busca: so Pro
      if (scope === "br" && theme) params.set("theme", theme);
      try {
        const res = await fetch(`/api/news?${params}`, {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json();
        if (id !== reqId.current) return; // resposta obsoleta
        let next: Item[] = data.items ?? [];
        // paywall: free ve so as primeiras FREE_LIMIT, sem carregar mais
        if (!paid) next = next.slice(0, FREE_LIMIT);
        setItems((prev) => (replace ? next : [...prev, ...next]));
        setHasMore(paid ? Boolean(data.hasMore) : false);
        setPage(nextPage);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [sectorParam, debouncedQ, theme, scope, country, paid, session],
  );

  // recarrega do zero quando muda setor/busca (so logado)
  useEffect(() => {
    if (session) load(0, true);
  }, [load, session]);

  // termometro (so logado; recarrega quando muda busca ou escopo Brasil/Mundo)
  useEffect(() => {
    if (!session) return;
    fetch(`/api/stats?scope=${scope}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [debouncedQ, session, scope]);

  const toggleSector = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const isOn = (id: string) => selected.includes(id);

  // lente: clicar ativa; clicar de novo desliga
  const toggleTheme = (id: string) => setTheme((cur) => (cur === id ? null : id));

  // troca Brasil/Mundo: limpa lente, pais e setores (contextos diferentes)
  const switchScope = (s: "br" | "mundo") => {
    if (s === scope) return;
    setScope(s);
    setTheme(null);
    setSelected([]);
    setCountry(null);
  };

  // gate: tela preta enquanto verifica; porta misteriosa se deslogado
  if (checking) return <div className="bootscreen" />;
  if (!session) return <Entrance />;
  // home (porta) com usuario logado: ENTRAR entra direto no feed
  if (atHome) return <Entrance loggedIn onEnter={() => setAtHome(false)} />;

  const countryN = new Map((stats?.countries ?? []).map((c) => [c.country, c.n]));
  const toggleCountry = (id: string) => setCountry((cur) => (cur === id ? null : id));

  return (
    <>
      <header className="top">
        <div className="shell">
          <div className="acct">
            <span className="acctmail">{session.user.email}</span>
            <span className={`plantag ${paid ? "on" : ""}`}>
              {paid ? "Pro" : t("free")}
            </span>
            {isAdmin && <a className="adminlink" href="/admin">Admin</a>}
            <LangToggle />
            <ThemeToggle />
            {!paid && (
              <button className="assinar" onClick={() => setShowPlans(true)}>
                {t("assinar")}
              </button>
            )}
            <button className="sair" onClick={() => supabase.auth.signOut()}>
              {t("sair")}
            </button>
          </div>
          <div className="brand">
            <h1 className="logobtn" onClick={() => setAtHome(true)} title={t("inicio")}>
              Today<em>Brasil</em>
            </h1>
            <button className="cadernobtn" onClick={openResumos}>
              {t("resumos")}
            </button>
            <button className="cadernobtn" onClick={openAlertas}>
              {t("alertas")}
            </button>
            <div className="scope">
              <button
                className={`scopebtn ${scope === "br" ? "on" : ""}`}
                onClick={() => switchScope("br")}
              >
                {t("brasil")}
              </button>
              <button
                className={`scopebtn ${scope === "mundo" ? "on" : ""}`}
                onClick={() => switchScope("mundo")}
              >
                {t("mundo")}
              </button>
            </div>
          </div>
          <input
            className="search"
            disabled={!paid}
            placeholder={
              !paid
                ? t("searchLocked")
                : scope === "mundo"
                ? t("searchWorld")
                : t("searchBr")
            }
            value={paid ? q : ""}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* lentes PRO: so no Brasil (sao por palavra-chave PT) */}
          {scope === "br" && (
          <div className="lensbar">
            <button
              className={`lensnav left ${atStart ? "hidden" : ""}`}
              aria-label="Temas anteriores"
              onClick={() => nudgeLenses(-1)}
            >
              ‹
            </button>
            <div className="lenses" ref={lensesRef} onScroll={updateArrows} onWheel={onLensesWheel}>
              <span className="lenslabel">
                {t("temas")} <em>PRO</em>
              </span>
              {THEMES.map((th) => {
                const label = lang === "en" ? th.en : th.label;
                return (
                  <button
                    key={th.id}
                    className={`lens ${theme === th.id ? "active" : ""} ${paid ? "" : "locked"}`}
                    title={paid ? th.blurb : `${label} · ${t("availablePro")}`}
                    onClick={() => (paid ? toggleTheme(th.id) : setShowPlans(true))}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              className={`lensnav right ${atEnd ? "hidden" : ""}`}
              aria-label="Próximos temas"
              onClick={() => nudgeLenses(1)}
            >
              ›
            </button>
          </div>
          )}

          {selected.length > 0 && (
            <div className="selinfo">
              {t("filtering")}{" "}
              {selected.map((id) => sectorLabel(id, lang)).join(", ")}
              <button className="clear" onClick={() => setSelected([])}>
                {t("clear")}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="shell layout">
        <main className="feed">
          {items.length === 0 && loading ? (
            <div className="state">{t("loading")}</div>
          ) : items.length === 0 ? (
            <div className="state">{t("empty")}</div>
          ) : (
            <>
              <ul className="list">
                {items.map((it) => (
                  <li key={it.id}>
                    <a
                      className="row"
                      href={it.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if ((it.themes ?? []).includes("cvm") && it.url) {
                          e.preventDefault();
                          setPdfItem(it);
                        }
                      }}
                    >
                      <div className="rmeta">
                        <span className="rsource">{it.source}</span>
                        {it.published_at && (
                          <>
                            <span className="dot">•</span>
                            <span>{timeAgo(it.published_at)}</span>
                          </>
                        )}
                        {(it.themes ?? []).map((th) => {
                          const lm = getTheme(th);
                          if (!lm) return null;
                          return (
                            <span key={th} className="ltag">
                              {lang === "en" ? lm.en : lm.label}
                            </span>
                          );
                        })}
                        <span className="rtag">
                          {sectorLabel(it.sector, lang)}
                        </span>
                      </div>
                      <h3>{it.title}</h3>
                      {it.summary && <p>{it.summary.slice(0, 220)}</p>}
                    </a>
                  </li>
                ))}
              </ul>
              {paid && hasMore && (
                <button className="more" disabled={loading} onClick={() => load(page + 1, false)}>
                  {loading ? t("loading") : t("loadMore")}
                </button>
              )}
              {!paid && items.length >= FREE_LIMIT && (
                <div className="paywall">
                  <h3>{t("paywallSeen", { n: FREE_LIMIT })}</h3>
                  <p>{t("paywallCopy")}</p>
                  <button className="assinarbig" onClick={() => setShowPlans(true)}>
                    {t("seePlans")}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="side">
          {scope === "mundo" && (
            <section className="panel">
              <h4>{t("countries")}</h4>
              <p className="hint">{t("clickCountry")}</p>
              <ul className="rank">
                <li>
                  <button className={`rankrow ${!country ? "on" : ""}`} onClick={() => setCountry(null)}>
                    <span className="rl">🌐 {t("allCountries")}</span>
                  </button>
                </li>
                {COUNTRIES.map((c) => {
                  const n = countryN.get(c.id) ?? 0;
                  return (
                    <li key={c.id}>
                      <button
                        className={`rankrow ${country === c.id ? "on" : ""}`}
                        onClick={() => toggleCountry(c.id)}
                      >
                        <span className="rl">{c.flag} {countryLabel(c.id, lang)}</span>
                        {n > 0 && <span className="rn">{n}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <section className="panel">
            <h4>{t("trendingSectors")}</h4>
            <p className="hint">{t("last7")}</p>
            <ul className="rank">
              {(stats?.sectors ?? []).map((s) => {
                const max = stats?.sectors?.[0]?.n || 1;
                return (
                  <li key={s.sector}>
                    <button
                      className={`rankrow ${isOn(s.sector) ? "on" : ""}`}
                      onClick={() => toggleSector(s.sector)}
                    >
                      <span className="rl">{sectorLabel(s.sector, lang)}</span>
                      <span className="rn">{s.n}</span>
                      <span className="bar" style={{ width: `${(s.n / max) * 100}%` }} />
                    </button>
                  </li>
                );
              })}
              {!stats && <li className="hint">{t("loadingShort")}</li>}
            </ul>
          </section>
        </aside>
      </div>

      {showPlans && <PlansModal onClose={() => setShowPlans(false)} onChoose={goCheckout} />}

      {pdfItem && pdfItem.url && (
        <div className="pdfback" onClick={() => setPdfItem(null)}>
          <div className="pdfmodal" onClick={(e) => e.stopPropagation()}>
            <div className="pdfhead">
              <div className="pdfmeta">
                <span className="rsource">{pdfItem.source}</span>
                {pdfItem.published_at && (
                  <>
                    <span className="dot">•</span>
                    <span>{timeAgo(pdfItem.published_at)}</span>
                  </>
                )}
                <h3>{pdfItem.title}</h3>
              </div>
              <div className="pdfacts">
                <a
                  className="pdfbtn"
                  href={`/api/cvm-pdf?url=${encodeURIComponent(pdfItem.url)}&dl=1`}
                >
                  ⬇ Baixar PDF
                </a>
                <a
                  className="pdfbtn ghost"
                  href={pdfItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir original
                </a>
                <button className="pdfclose" onClick={() => setPdfItem(null)} title="Fechar">
                  ✕
                </button>
              </div>
            </div>
            <iframe
              className="pdfframe"
              src={`/api/cvm-pdf?url=${encodeURIComponent(pdfItem.url)}`}
              title={pdfItem.title}
            />
          </div>
        </div>
      )}
    </>
  );
}
