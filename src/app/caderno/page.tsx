"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CADERNO_TEMAS, getTema } from "@/lib/caderno-temas";

type Art = {
  id: string; slug: string; tema: string; titulo: string;
  highlight: string | null; resumo: string | null; published_at: string;
};

export default function Caderno() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "anon">("loading");
  const [arts, setArts] = useState<Art[]>([]);
  const [tema, setTema] = useState<string | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("anon"); return; }
      const res = await fetch("/api/caderno", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.status === 403) { setState("forbidden"); return; }
      const data = await res.json();
      setArts(data.articles ?? []);
      setState("ok");
    })();
    supabase.from("caderno_favorites").select("article_id").then(({ data }) => {
      setFavs(new Set((data ?? []).map((d) => d.article_id)));
    });
  }, []);

  if (state === "loading") return <div className="cadwrap"><p className="hint">Carregando...</p></div>;
  if (state === "anon") return <div className="cadwrap"><p>Faça login.</p><a className="hint" href="/">← início</a></div>;
  if (state === "forbidden")
    return (
      <div className="cadwrap caddenied">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <h1 className="cadlogo">Caderno <em>Exclusivo</em></h1>
        <p>Conteúdo do plano <strong>Exclusivo</strong> (R$ 29,90/mês): análises escritas pela nossa redação.</p>
        <a className="abtn" href="/">← Voltar ao feed</a>
      </div>
    );

  const shown = tema ? arts.filter((a) => a.tema === tema) : arts;
  const favoritas = arts.filter((a) => favs.has(a.id));

  return (
    <div className="cadwrap">
      <header className="cadhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← feed</a>
      </header>
      <h1 className="cadlogo">Caderno <em>Exclusivo</em></h1>

      <div className="cadtemas">
        <button className={`tchip ${!tema ? "on" : ""}`} onClick={() => setTema(null)}>Todos</button>
        {CADERNO_TEMAS.map((t) => (
          <button key={t.id} className={`tchip ${tema === t.id ? "on" : ""}`} onClick={() => setTema(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="cadlayout">
        <main>
          {shown.length === 0 ? (
            <p className="hint" style={{ marginTop: 28 }}>Nenhuma matéria publicada ainda.</p>
          ) : (
            <ul className="cadlist">
              {shown.map((a) => (
                <li key={a.id}>
                  <a className="cadcard" href={`/caderno/${a.slug}`}>
                    <span className="cadtema">
                      {getTema(a.tema)?.emoji} {getTema(a.tema)?.label ?? a.tema}
                      {favs.has(a.id) && <span className="favmark"> ★</span>}
                    </span>
                    <h3>{a.titulo}</h3>
                    {a.highlight && <p className="cadhi">{a.highlight}</p>}
                    {a.resumo && <p className="cadresumo">{a.resumo}</p>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>

        <aside className="cadside">
          <section className="panel">
            <h4>★ Favoritas</h4>
            {favoritas.length === 0 ? (
              <p className="hint">Favorite matérias para guardar aqui.</p>
            ) : (
              <ul className="favlist">
                {favoritas.map((a) => (
                  <li key={a.id}>
                    <a href={`/caderno/${a.slug}`}>
                      <span className="favtema">{getTema(a.tema)?.emoji}</span> {a.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
