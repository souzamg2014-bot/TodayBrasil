// i18n leve: dicionario PT-BR / EN das strings de interface (menus, botoes,
// estados). Conteudo (titulos de noticia) e traduzido a parte, sob demanda.
// t(key) devolve a string no idioma atual; {n}/{v} sao placeholders opcionais.

export type Lang = "pt" | "en";

export const UI: Record<string, { pt: string; en: string }> = {
  // header / nav
  resumos: { pt: "Resumos Inteligentes", en: "Smart Briefings" },
  alertas: { pt: "Alertas", en: "Alerts" },
  brasil: { pt: "Brasil", en: "Brazil" },
  mundo: { pt: "Mundo", en: "World" },
  assinar: { pt: "Assinar", en: "Subscribe" },
  sair: { pt: "Sair", en: "Sign out" },
  free: { pt: "Grátis", en: "Free" },
  inicio: { pt: "Início", en: "Home" },
  // busca
  searchLocked: { pt: "Busca disponível no Pro", en: "Search available on Pro" },
  searchWorld: { pt: "Buscar nas notícias internacionais...", en: "Search international news..." },
  searchBr: { pt: "Buscar no título e no resumo das notícias...", en: "Search news titles and summaries..." },
  // temas / filtros
  temas: { pt: "Temas", en: "Topics" },
  availablePro: { pt: "disponível no Pro", en: "available on Pro" },
  filtering: { pt: "Filtrando:", en: "Filtering:" },
  clear: { pt: "limpar", en: "clear" },
  // feed / estados
  loading: { pt: "Carregando...", en: "Loading..." },
  loadingShort: { pt: "carregando...", en: "loading..." },
  empty: { pt: "Nenhuma notícia encontrada. Tente outro filtro.", en: "No news found. Try another filter." },
  loadMore: { pt: "Carregar mais", en: "Load more" },
  // paywall
  paywallSeen: { pt: "Você viu as {n} primeiras.", en: "You have seen the first {n}." },
  paywallCopy: {
    pt: "Assine o Pro por R$ 24,90/mês e libere o feed completo, a busca, os temas e as fontes primárias (CVM, falências, CAGED, IBAMA).",
    en: "Subscribe to Pro for R$ 24.90/month and unlock the full feed, search, topics and primary sources (CVM, bankruptcies, CAGED, IBAMA).",
  },
  seePlans: { pt: "Ver planos", en: "See plans" },
  // sidebar
  countries: { pt: "Regiões", en: "Regions" },
  clickCountry: { pt: "clique pra filtrar o Mundo", en: "click to filter the World" },
  allCountries: { pt: "Todas as regiões", en: "All regions" },
  allTopics: { pt: "Todos os temas", en: "All topics" },
  trendingSectors: { pt: "Setores em alta", en: "Trending sectors" },
  last7: { pt: "últimos 7 dias · clique pra filtrar", en: "last 7 days · click to filter" },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = UI[key];
  let s = entry ? entry[lang] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
