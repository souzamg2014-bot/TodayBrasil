"use client";

import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSector } from "@/lib/sectors";
import { THEMES, getTheme } from "@/lib/themes";
import { timeAgo } from "@/lib/time";
import { supabase } from "@/lib/supabase";
import Entrance from "@/components/Entrance";
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
};

export default function Home() {
  // multi-selecao de setores (vazio = tudo)
  const [selected, setSelected] = useState<string[]>([]);
  // lente ativa (uma de cada vez; null = nenhuma)
  const [theme, setTheme] = useState<string | null>(null);
  // escopo: 'br' (pt) ou 'mundo' (en+es)
  const [scope, setScope] = useState<"br" | "mundo">("br");
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
  const paid = isPaid(plan, planExp);

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

  async function goCheckout() {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: s ? { Authorization: `Bearer ${s.access_token}` } : {},
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
      params.set("lang", scope === "mundo" ? "en,es" : "pt");
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
    [sectorParam, debouncedQ, theme, scope, paid, session],
  );

  // recarrega do zero quando muda setor/busca (so logado)
  useEffect(() => {
    if (session) load(0, true);
  }, [load, session]);

  // termometro (so logado; recarrega quando o usuario faz uma busca nova)
  useEffect(() => {
    if (!session) return;
    fetch("/api/stats", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [debouncedQ, session]);

  const toggleSector = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const isOn = (id: string) => selected.includes(id);

  // lente: clicar ativa; clicar de novo desliga
  const toggleTheme = (id: string) => setTheme((cur) => (cur === id ? null : id));

  // troca Brasil/Mundo: limpa lente e busca (lentes sao PT, nao se aplicam ao Mundo)
  const switchScope = (s: "br" | "mundo") => {
    if (s === scope) return;
    setScope(s);
    setTheme(null);
    setSelected([]);
  };

  // gate: tela preta enquanto verifica; porta misteriosa se deslogado
  if (checking) return <div className="bootscreen" />;
  if (!session) return <Entrance />;

  return (
    <>
      <header className="top">
        <div className="shell">
          <div className="acct">
            <span className="acctmail">{session.user.email}</span>
            <span className={`plantag ${paid ? "on" : ""}`}>
              {paid ? (plan === "caderno" ? "Caderno" : "Pro") : "Grátis"}
            </span>
            {isAdmin && <a className="adminlink" href="/admin">Admin</a>}
            {!paid && (
              <button className="assinar" onClick={goCheckout}>
                Assinar Pro · R$ 9,90
              </button>
            )}
            <button className="sair" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
          <div className="brand">
            <h1>TodayBrasil</h1>
            <span>o que está acontecendo agora</span>
            <div className="scope">
              <button
                className={`scopebtn ${scope === "br" ? "on" : ""}`}
                onClick={() => switchScope("br")}
              >
                🇧🇷 Brasil
              </button>
              <button
                className={`scopebtn ${scope === "mundo" ? "on" : ""}`}
                onClick={() => switchScope("mundo")}
              >
                🌎 Mundo
              </button>
            </div>
          </div>
          <input
            className="search"
            disabled={!paid}
            placeholder={
              !paid
                ? "🔒 Busca disponível no Pro"
                : scope === "mundo"
                ? "Buscar nas notícias internacionais..."
                : "Buscar no título e no resumo das notícias..."
            }
            value={paid ? q : ""}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* lentes PRO: so no Brasil (sao por palavra-chave PT) */}
          {scope === "br" && (
          <div className="lensbar">
            <button
              className={`lensnav left ${atStart ? "hidden" : ""}`}
              aria-label="Lentes anteriores"
              onClick={() => nudgeLenses(-1)}
            >
              ‹
            </button>
            <div className="lenses" ref={lensesRef} onScroll={updateArrows} onWheel={onLensesWheel}>
              <span className="lenslabel">
                Lentes <em>PRO</em>
              </span>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`lens ${theme === t.id ? "active" : ""}`}
                  title={t.blurb}
                  onClick={() => toggleTheme(t.id)}
                >
                  <span className="lemoji">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <button
              className={`lensnav right ${atEnd ? "hidden" : ""}`}
              aria-label="Próximas lentes"
              onClick={() => nudgeLenses(1)}
            >
              ›
            </button>
          </div>
          )}

          {selected.length > 0 && (
            <div className="selinfo">
              Filtrando:{" "}
              {selected
                .map((id) => `${getSector(id)?.emoji ?? ""} ${getSector(id)?.label ?? id}`)
                .join(", ")}
              <button className="clear" onClick={() => setSelected([])}>
                limpar
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="shell layout">
        <main className="feed">
          {items.length === 0 && loading ? (
            <div className="state">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="state">Nenhuma notícia encontrada. Tente outro filtro.</div>
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
                              {lm.emoji} {lm.label}
                            </span>
                          );
                        })}
                        <span className="rtag">
                          {getSector(it.sector)?.emoji} {getSector(it.sector)?.label ?? it.sector}
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
                  {loading ? "Carregando..." : "Carregar mais"}
                </button>
              )}
              {!paid && items.length >= FREE_LIMIT && (
                <div className="paywall">
                  <h3>Você viu as {FREE_LIMIT} primeiras.</h3>
                  <p>
                    Assine o <strong>Pro</strong> por <strong>R$ 9,90/mês</strong> e libere o feed
                    completo, a busca, as lentes e as fontes primárias (CVM, falências, CAGED, IBAMA).
                  </p>
                  <button className="assinarbig" onClick={goCheckout}>
                    Assinar Pro · R$ 9,90/mês
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="side">
          <section className="panel">
            <h4>📊 Setores em alta</h4>
            <p className="hint">últimos 7 dias · clique pra filtrar</p>
            <ul className="rank">
              {(stats?.sectors ?? []).map((s) => {
                const meta = getSector(s.sector);
                const max = stats?.sectors?.[0]?.n || 1;
                return (
                  <li key={s.sector}>
                    <button
                      className={`rankrow ${isOn(s.sector) ? "on" : ""}`}
                      onClick={() => toggleSector(s.sector)}
                    >
                      <span className="rl">
                        {meta?.emoji} {meta?.label ?? s.sector}
                      </span>
                      <span className="rn">{s.n}</span>
                      <span className="bar" style={{ width: `${(s.n / max) * 100}%` }} />
                    </button>
                  </li>
                );
              })}
              {!stats && <li className="hint">carregando...</li>}
            </ul>
          </section>

          <section className="panel">
            <h4>🔥 Em alta</h4>
            <p className="hint">aparecem em X notícias (3 dias)</p>
            <div className="cloud">
              {(stats?.trending ?? []).map((t) => (
                <button key={t.term} className="termchip" onClick={() => setQ(t.term)}>
                  {t.term} <em>{t.ndoc}</em>
                </button>
              ))}
              {stats && stats.trending.length === 0 && <span className="hint">sem dados ainda</span>}
            </div>
          </section>

          <section className="panel">
            <h4>🔎 Mais buscados</h4>
            <p className="hint">o que as pessoas procuram</p>
            <ul className="rank">
              {(stats?.topSearches ?? []).map((s) => (
                <li key={s.q}>
                  <button className="rankrow" onClick={() => setQ(s.q)}>
                    <span className="rl">{s.q}</span>
                    <span className="rn">{s.hits}</span>
                  </button>
                </li>
              ))}
              {stats && stats.topSearches.length === 0 && (
                <li className="hint">ainda ninguém buscou. seja o primeiro 👆</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
