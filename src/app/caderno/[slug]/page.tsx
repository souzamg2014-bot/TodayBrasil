"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTema } from "@/lib/caderno-temas";

type Fonte = { titulo?: string; url?: string };
type Art = {
  id: string; slug: string; tema: string; titulo: string;
  highlight: string | null; resumo: string | null; conteudo: string | null;
  fontes: Fonte[] | null; autor: string | null; published_at: string;
};

export default function CadernoArticle() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "anon" | "notfound">("loading");
  const [a, setA] = useState<Art | null>(null);
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("anon"); return; }
      const res = await fetch(`/api/caderno?slug=${encodeURIComponent(slug)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403) { setState("forbidden"); return; }
      if (res.status === 404) { setState("notfound"); return; }
      const data = await res.json();
      setA(data.article);
      setState("ok");
      const { data: f } = await supabase
        .from("caderno_favorites").select("article_id").eq("article_id", data.article.id).maybeSingle();
      setFav(!!f);
    })();
  }, [slug]);

  async function toggleFav() {
    if (!a) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (fav) {
      await supabase.from("caderno_favorites").delete().eq("article_id", a.id).eq("user_id", user.id);
      setFav(false);
    } else {
      await supabase.from("caderno_favorites").insert({ article_id: a.id, user_id: user.id });
      setFav(true);
    }
  }
  async function copiar() {
    if (!a) return;
    await navigator.clipboard.writeText(`${a.titulo}\n\n${a.resumo ?? ""}\n\n${a.conteudo ?? ""}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  const pdf = () => window.print();
  function whats() {
    if (!a) return;
    const t = `${a.titulo} — ${a.highlight ?? ""} ${location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank");
  }
  function email() {
    if (!a) return;
    window.location.href = `mailto:?subject=${encodeURIComponent(a.titulo)}&body=${encodeURIComponent((a.resumo ?? "") + "\n\n" + location.href)}`;
  }

  if (state === "loading") return <div className="artwrap"><p className="hint">Carregando...</p></div>;
  if (state === "anon") return <div className="artwrap"><p>Faça login.</p><a className="hint" href="/">← início</a></div>;
  if (state === "forbidden") return <div className="artwrap caddenied"><p>Conteúdo do plano <strong>Exclusivo</strong>.</p><a className="abtn" href="/">← feed</a></div>;
  if (state === "notfound" || !a) return <div className="artwrap"><p>Matéria não encontrada.</p><a className="hint" href="/caderno">← Caderno</a></div>;

  const data = new Date(a.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const paras = (a.conteudo ?? "").split(/\n{2,}/).filter(Boolean);

  return (
    <div className="artwrap">
      <div className="artbar no-print">
        <div className="artbarleft">
          <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
          <a className="hint" href="/caderno">← Caderno</a>
        </div>
        <div className="arttools">
          <button className={`tool ${fav ? "on" : ""}`} onClick={toggleFav} title="Favoritar">{fav ? "★" : "☆"} Favoritar</button>
          <button className="tool" onClick={copiar} title="Copiar">{copied ? "✓ Copiado" : "⧉ Copiar"}</button>
          <button className="tool" onClick={pdf} title="Gerar PDF">⤓ PDF</button>
          <button className="tool" onClick={whats} title="WhatsApp">WhatsApp</button>
          <button className="tool" onClick={email} title="E-mail">E-mail</button>
        </div>
      </div>

      <article className="article">
        <span className="cadtema">{getTema(a.tema)?.label ?? a.tema}</span>
        <h1>{a.titulo}</h1>
        {a.highlight && <p className="arthi">{a.highlight}</p>}
        <p className="artmeta">{a.autor} · {data}</p>
        <div className="artbody">
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        {a.fontes && a.fontes.length > 0 && (
          <div className="artfontes">
            <span className="fonteslabel">Fontes</span>
            {a.fontes.map((f, i) => (
              <a key={i} className="fonte" href={f.url || "#"} target="_blank" rel="noopener noreferrer">
                {f.titulo || f.url}
              </a>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
