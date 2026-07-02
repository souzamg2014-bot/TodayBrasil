// Planos e regras do paywall (fonte unica). Usado no front e na API.
// Um unico plano pago: Pro (R$ 24,90), que libera o feed completo, busca, temas,
// alertas e fontes primarias. Os Resumos Inteligentes NAO fazem parte do Pro:
// viraram um produto de inteligencia (clipping) a parte, "sob consulta".
// 'caderno' fica so como valor legado no banco (assinantes antigos) e conta como
// pago; nao e mais oferecido.

export type Plan = "free" | "pro" | "caderno";

export const PLANS = {
  free: { label: "Grátis", price: 0 },
  pro: {
    label: "Pro",
    price: 24.9,
    tagline: "Toda a inteligência de negócios, do Brasil e do mundo, por menos de R$ 0,83 por dia.",
    perks: [
      "Feed completo, sem o limite de 20 notícias",
      "Busca em tudo, por palavra e por setor",
      "Temas premium: M&A, Política, Investimentos, Inovação e mais",
      "Central de Alertas: monitore e receba no site e por push",
      "Fontes primárias: CVM, falências, CAGED e IBAMA",
      "Notícias do Mundo: EUA, Ásia e Zona do Euro, com filtro por região",
    ],
  },
  // legado: assinantes antigos com plano 'caderno' seguem valendo como pagos.
  caderno: {
    label: "Pro",
    price: 24.9,
    tagline: "Tudo do TodayBrasil por R$ 24,90/mês.",
    perks: [],
  },
} as const;

// quantas noticias o plano free ve antes do paywall
export const FREE_LIMIT = 20;

// assinatura ativa? (pro ou caderno, dentro da validade)
export function isPaid(plan?: Plan | null, expiresAt?: string | null): boolean {
  if (plan !== "pro" && plan !== "caderno") return false;
  if (!expiresAt) return true; // sem data = ativo
  return new Date(expiresAt).getTime() > Date.now();
}

// o que o plano libera
export function canSearch(plan?: Plan | null, exp?: string | null) { return isPaid(plan, exp); }
export function canLoadMore(plan?: Plan | null, exp?: string | null) { return isPaid(plan, exp); }
export function feedLimit(plan?: Plan | null, exp?: string | null) {
  return isPaid(plan, exp) ? null : FREE_LIMIT; // null = sem limite
}
