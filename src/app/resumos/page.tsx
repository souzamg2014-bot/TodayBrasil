"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEMAS, getTema } from "@/lib/resumos";
import { CONTACT, whatsappLink, emailLink } from "@/lib/contact";

type Destaque = { fato: string; fonte?: string; url?: string };
type Fonte = { titulo?: string; url?: string };
type Resumo = {
  id: string; tema: string; janela: string; data_ref: string;
  titulo: string; resumo: string | null;
  destaques: Destaque[] | null; fontes: Fonte[] | null; n_fontes: number;
};

function dataLabel(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Resumos() {
  const [state, setState] = useState<"loading" | "ok" | "anon">("loading");
  const [items, setItems] = useState<Resumo[]>([]);
  const [tema, setTema] = useState<string | null>(null);
  const [openFontes, setOpenFontes] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("anon"); return; }
      const res = await fetch("/api/resumos", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      setItems(data.resumos ?? []);
      setState("ok");
    })();
  }, []);

  const toggleFontes = (id: string) =>
    setOpenFontes((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(id)) nxt.delete(id); else nxt.add(id);
      return nxt;
    });

  const shown = items.filter((r) => !tema || r.tema === tema);

  return (
    <div className="cadwrap">
      <header className="cadhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← feed</a>
      </header>

      {/* ===== PITCH: produto de inteligência (clipping "sob consulta") ===== */}
      <section className="respitch">
        <span className="resbadge">Inteligência sob consulta</span>
        <h1 className="cadlogo">Resumos <em>Inteligentes</em></h1>
        <p className="respitchsub">
          Um serviço de <strong>clipping inteligente</strong>: mapeamos todos os setores da economia,
          cruzamos dezenas de fontes e reescrevemos com o nosso tom o que realmente importou, num
          panorama por setor. Cada resumo traz a lista completa das fontes pesquisadas.
        </p>

        <ul className="ressetores">
          {TEMAS.map((t) => <li key={t.id}>{t.label}</li>)}
        </ul>

        <div className="rescta">
          <div className="resprice">
            <span className="resprice-k">Valores</span>
            <strong>sob consulta</strong>
          </div>
          <a className="resbtn wa" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
            WhatsApp {CONTACT.whatsappLabel}
          </a>
          <a className="resbtn mail" href={emailLink()}>
            {CONTACT.email}
          </a>
        </div>
      </section>

      {/* ===== AMOSTRAS: resumos publicados como demonstração ===== */}
      <section className="ressamples">
        <h2 className="resh2">Amostras recentes</h2>
        <p className="cadsub">Veja o padrão do produto: um panorama por setor, com as fontes cruzadas.</p>

        {state === "anon" ? (
          <p className="hint" style={{ marginTop: 16 }}>
            <a href="/">Faça login</a> para ver as amostras.
          </p>
        ) : state === "loading" ? (
          <p className="hint" style={{ marginTop: 16 }}>Carregando amostras...</p>
        ) : (
          <>
            <div className="cadtemas">
              <button className={`tchip ${!tema ? "on" : ""}`} onClick={() => setTema(null)}>Todos os setores</button>
              {TEMAS.map((t) => (
                <button key={t.id} className={`tchip ${tema === t.id ? "on" : ""}`} onClick={() => setTema(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="hint" style={{ marginTop: 28 }}>Nenhuma amostra publicada ainda.</p>
            ) : (
              <ul className="reslist">
                {shown.map((r) => {
                  const tm = getTema(r.tema);
                  const fontes = Array.isArray(r.fontes) ? r.fontes : [];
                  const isOpen = openFontes.has(r.id);
                  return (
                    <li key={r.id} className="rescard">
                      <div className="resmeta">
                        <span className="restema">{tm?.label ?? r.tema}</span>
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
                      {fontes.length > 0 && (
                        <div className="resfontesbox">
                          <button
                            className={`resfontestoggle ${isOpen ? "on" : ""}`}
                            onClick={() => toggleFontes(r.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? "▾" : "▸"} Fontes ({fontes.length})
                          </button>
                          {isOpen && (
                            <ul className="resfonteslista">
                              {fontes.map((f, i) => (
                                <li key={i}>
                                  {f.url ? (
                                    <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo || f.url}</a>
                                  ) : (
                                    <span>{f.titulo}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
