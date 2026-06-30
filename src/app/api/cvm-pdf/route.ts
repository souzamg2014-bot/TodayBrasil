import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxy do PDF da CVM. A url de download da CVM vem com
// "Content-Disposition: attachment", o que forca o navegador a baixar mesmo
// dentro de um iframe. Aqui buscamos o PDF no servidor e re-servimos com
// "inline" (para o leitor nativo renderizar) ou "attachment" (?dl=1, baixar).
//
// Seguranca: so aceita hosts da CVM (evita usar o endpoint como proxy aberto).
function hostPermitido(h: string) {
  return h === "cvm.gov.br" || h.endsWith(".cvm.gov.br");
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const raw = sp.get("url");
  const download = sp.get("dl") === "1";
  if (!raw) return NextResponse.json({ error: "url ausente" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url invalida" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !hostPermitido(target.hostname)) {
    return NextResponse.json({ error: "host nao permitido" }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (newsfeed)" },
      redirect: "follow",
    });
  } catch {
    return NextResponse.json({ error: "falha ao buscar o documento" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: `documento indisponivel (${upstream.status})` }, { status: 502 });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  // valida que e mesmo um PDF (assinatura %PDF)
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json({ error: "o documento nao e um PDF" }, { status: 415 });
  }

  // nome do arquivo: tenta o do upstream, senao um generico
  let filename = "fato-relevante-cvm.pdf";
  const cd = upstream.headers.get("content-disposition") || "";
  const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (m) filename = decodeURIComponent(m[1].replace(/"/g, "")).slice(0, 120);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
