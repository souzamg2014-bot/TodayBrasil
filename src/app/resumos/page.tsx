"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEMAS, JANELAS, getTema, getJanela } from "@/lib/resumos";

type Destaque = { fato: string; fonte?: string; url?: string };
type Fonte = { titulo?: string; url?: string };
type Resumo = {
  id: string; tema: string; janela: string; data_ref: string;
  titulo: string; resumo: string | null;
  destaques: Destaque[] | null; fontes: Fonte[] | null; n_fontes: number;
};

function dataLabel(d: string) {
  // d = "YYYY-MM-DD"
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Resumos() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "anon">("loading");
  const [items, setItems] = useState<Resumo[]>([]);
  const [tema, setTema] = useState<string | null>(null);
  const [janela, setJanela] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("anon"); return; }
      const res = await fetch("/api/resumos", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.status === 403) { setState("forbidden"); return; }
      const data = await res.json();
      setItems(data.resumos ?? []);
      setState("ok");
    })();
  }, []);

  if (state === "loading") return <div className="cadwrap"><p className="hint">Carregando...</p></div>;
  if (state === "anon") return <div className="cadwrap"><p>Faça login.</p><a className="hint" href="/">← início</a></div>;
  if (state === "forbidden")
    return (
      <div className="cadwrap caddenied">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <h1 className="cadlogo">Resumos <em>Inteligentes</em></h1>
        <p>Conteúdo do plano <strong>Premium</strong> (R$ 29,90/mês): o que aconteceu em cada setor, resumido por janela do dia a partir de dezenas de fontes.</p>
        <a className="abtn" href="/">← Voltar ao feed</a>
      </div>
    );

  const shown = items.filter(
    (r) => (!tema || r.tema === tema) && (!janela || r.janela === janela),
  );

  return (
    <div className="cadwrap">
      <header className="cadhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← feed</a>
      </header>
      <h1 className="cadlogo">Resumos <em>Inteligentes</em></h1>
      <p className="cadsub">O que aconteceu em cada tema, resumido por janela do dia a partir de várias fontes.</p>

      <div className="cadtemas">
        <button className={`tchip ${!tema ? "on" : ""}`} onClick={() => setTema(null)}>Todos os temas</button>
        {TEMAS.map((t) => (
          <button key={t.id} className={`tchip ${tema === t.id ? "on" : ""}`} onClick={() => setTema(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="cadtemas">
        <button className={`tchip ${!janela ? "on" : ""}`} onClick={() => setJanela(null)}>Dia inteiro</button>
        {JANELAS.map((j) => (
          <button key={j.id} className={`tchip ${janela === j.id ? "on" : ""}`} onClick={() => setJanela(j.id)}>
            {j.label} <span className="jhora">{j.faixa}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="hint" style={{ marginTop: 28 }}>Nenhum resumo publicado ainda.</p>
      ) : (
        <ul className="reslist">
          {shown.map((r) => {
            const tm = getTema(r.tema);
            const jn = getJanela(r.janela);
            return (
              <li key={r.id} className="rescard">
                <div className="resmeta">
                  <span className="restema">{tm?.label ?? r.tema}</span>
                  <span className="dot">•</span>
                  <span className="resjanela">{jn?.label ?? r.janela} <em>{jn?.faixa}</em></span>
                  <span className="dot">•</span>
                  <span>{dataLabel(r.data_ref)}</span>
                  <span className="resfontes">{r.n_fontes} fontes</span>
                </div>
                <h3 className="restitulo">{r.titulo}</h3>
                {r.resumo && (
                  <div className="resbody">
                    {r.resumo.split(/\n{2,}/).map((p, i) => (
                      <p key={i}>{p.replace(/^#+\s*/, "")}</p>
                    ))}
                  </div>
                )}
                {Array.isArray(r.destaques) && r.destaques.length > 0 && (
                  <ul className="resdestaques">
                    {r.destaques.map((d, i) => (
                      <li key={i}>
                        <span>{d.fato}</span>
                        {d.url && d.fonte && (
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="resfonte">{d.fonte}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
