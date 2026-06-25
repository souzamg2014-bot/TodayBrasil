"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SECTORS, getSector } from "@/lib/sectors";
import { timeAgo } from "@/lib/time";

type Item = {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  image_url: string | null;
  sector: string;
  published_at: string | null;
};

export default function Home() {
  const [sector, setSector] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++reqId.current;
      setLoading(true);
      const params = new URLSearchParams({ sector, page: String(nextPage) });
      if (debouncedQ) params.set("q", debouncedQ);
      try {
        const res = await fetch(`/api/news?${params}`);
        const data = await res.json();
        if (id !== reqId.current) return; // resposta obsoleta
        const next: Item[] = data.items ?? [];
        setItems((prev) => (replace ? next : [...prev, ...next]));
        setHasMore(Boolean(data.hasMore));
        setPage(nextPage);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [sector, debouncedQ],
  );

  // recarrega do zero quando muda setor ou busca
  useEffect(() => {
    load(0, true);
  }, [load]);

  return (
    <>
      <header className="top">
        <div className="shell">
          <div className="brand">
            <h1>TodayBrasil</h1>
            <span>o que está acontecendo agora</span>
          </div>
          <input
            className="search"
            placeholder="Buscar por palavra-chave ou tema..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="chips">
            <button
              className={`chip ${sector === "all" ? "active" : ""}`}
              onClick={() => setSector("all")}
            >
              ✨ Tudo
            </button>
            {SECTORS.map((s) => (
              <button
                key={s.id}
                className={`chip ${sector === s.id ? "active" : ""}`}
                onClick={() => setSector(s.id)}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="shell">
        {items.length === 0 && loading ? (
          <div className="state">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="state">Nenhuma notícia encontrada. Tente outro filtro.</div>
        ) : (
          <>
            <div className="grid">
              {items.map((it) => (
                <a
                  key={it.id}
                  className="card"
                  href={it.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {it.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={it.image_url} alt="" loading="lazy" />
                  )}
                  <div className="body">
                    <div className="meta">
                      <span>{it.source}</span>
                      {it.published_at && (
                        <>
                          <span className="dot">•</span>
                          <span>{timeAgo(it.published_at)}</span>
                        </>
                      )}
                    </div>
                    <h3>{it.title}</h3>
                    {it.summary && <p>{it.summary.slice(0, 160)}</p>}
                    <span className="tag">
                      {getSector(it.sector)?.emoji} {getSector(it.sector)?.label ?? it.sector}
                    </span>
                  </div>
                </a>
              ))}
            </div>
            {hasMore && (
              <button className="more" disabled={loading} onClick={() => load(page + 1, false)}>
                {loading ? "Carregando..." : "Carregar mais"}
              </button>
            )}
          </>
        )}
      </main>
    </>
  );
}
