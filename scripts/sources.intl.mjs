// ============================================================
// Fontes INTERNACIONAIS (filtro "Mundo"). EN + algumas ES.
// Cada fonte: { url, sector, lang }. O setor vem do HINT (o classificador
// por palavra-chave e PT-BR; nao roda em texto EN/ES). Sem lentes no v1.
// O resolver acha o RSS a partir da home; o que nao tiver feed cai no
// fallback Google News (no idioma da fonte).
// ============================================================

export const SOURCES_INTL = [
  // 1. Economia / mercado (transversal)
  { url: "https://www.reuters.com/business/", sector: "geral", lang: "en" },
  { url: "https://www.cnbc.com/world/?region=world", sector: "geral", lang: "en" },
  { url: "https://www.marketwatch.com/", sector: "geral", lang: "en" },
  { url: "https://www.businessinsider.com/", sector: "geral", lang: "en" },
  { url: "https://fortune.com/feed/", sector: "geral", lang: "en" },
  { url: "https://www.economist.com/finance-and-economics/rss.xml", sector: "geral", lang: "en" },
  { url: "https://apnews.com/hub/business", sector: "geral", lang: "en" },
  { url: "https://www.theguardian.com/uk/business/rss", sector: "geral", lang: "en" },

  // 2. Agronegocio
  { url: "https://www.agriculture.com/", sector: "agronegocio", lang: "en" },
  { url: "https://www.agweb.com/", sector: "agronegocio", lang: "en" },
  { url: "https://www.thepoultrysite.com/", sector: "agronegocio", lang: "en" },
  { url: "https://www.dairyherd.com/", sector: "agronegocio", lang: "en" },

  // 3. Alimentos e bebidas
  { url: "https://www.foodnavigator.com/", sector: "alimentos-bebidas", lang: "en" },
  { url: "https://www.fooddive.com/feeds/news/", sector: "alimentos-bebidas", lang: "en" },
  { url: "https://www.thegrocer.co.uk/", sector: "alimentos-bebidas", lang: "en" },

  // 4. Varejo / e-commerce
  { url: "https://www.retaildive.com/feeds/news/", sector: "comercio-varejista", lang: "en" },
  { url: "https://chainstoreage.com/", sector: "comercio-varejista", lang: "en" },

  // 5. Industria / manufatura / automotivo
  { url: "https://www.industryweek.com/", sector: "industria", lang: "en" },
  { url: "https://www.manufacturingdive.com/feeds/news/", sector: "industria", lang: "en" },
  { url: "https://www.autonews.com/", sector: "industria", lang: "en" },

  // 6. Construcao e imobiliario
  { url: "https://www.constructiondive.com/feeds/news/", sector: "construcao-imobiliario", lang: "en" },
  { url: "https://www.archdaily.com/", sector: "construcao-imobiliario", lang: "en" },
  { url: "https://www.dezeen.com/feed/", sector: "construcao-imobiliario", lang: "en" },

  // 7. Tecnologia / software / IA
  { url: "https://techcrunch.com/feed/", sector: "tecnologia-software", lang: "en" },
  { url: "https://www.theverge.com/rss/index.xml", sector: "tecnologia-software", lang: "en" },
  { url: "https://www.wired.com/feed/rss", sector: "tecnologia-software", lang: "en" },
  { url: "https://venturebeat.com/feed/", sector: "tecnologia-software", lang: "en" },
  { url: "https://arstechnica.com/feed/", sector: "tecnologia-software", lang: "en" },

  // 8. Telecomunicacoes
  { url: "https://www.lightreading.com/", sector: "telecomunicacoes", lang: "en" },
  { url: "https://www.fiercetelecom.com/", sector: "telecomunicacoes", lang: "en" },

  // 9. Servicos financeiros
  { url: "https://seekingalpha.com/feed.xml", sector: "servicos-financeiros", lang: "en" },
  { url: "https://www.morningstar.com/", sector: "servicos-financeiros", lang: "en" },
  { url: "https://www.investing.com/rss/news.rss", sector: "servicos-financeiros", lang: "en" },

  // 10. Servicos empresariais (gestao, marketing, consultoria)
  { url: "https://hbr.org/", sector: "servicos-empresariais", lang: "en" },
  { url: "https://www.mckinsey.com/insights/rss", sector: "servicos-empresariais", lang: "en" },
  { url: "https://adage.com/", sector: "servicos-empresariais", lang: "en" },

  // 11. Saude e bem-estar
  { url: "https://www.statnews.com/feed/", sector: "saude-bem-estar", lang: "en" },
  { url: "https://www.fiercehealthcare.com/", sector: "saude-bem-estar", lang: "en" },

  // 12. Transporte e logistica
  { url: "https://www.freightwaves.com/feed", sector: "transporte-logistica", lang: "en" },
  { url: "https://theloadstar.com/feed/", sector: "transporte-logistica", lang: "en" },

  // 13. Energia e recursos
  { url: "https://oilprice.com/rss/main", sector: "energia-recursos", lang: "en" },
  { url: "https://www.renewableenergyworld.com/feed/", sector: "energia-recursos", lang: "en" },

  // 14. Turismo e hotelaria
  { url: "https://skift.com/feed/", sector: "turismo-hotelaria", lang: "en" },

  // 15. Economia criativa (midia, entretenimento, games)
  { url: "https://variety.com/feed/", sector: "economia-criativa", lang: "en" },
  { url: "https://www.hollywoodreporter.com/feed/", sector: "economia-criativa", lang: "en" },

  // 16. Educacao
  { url: "https://www.edsurge.com/articles_rss", sector: "educacao", lang: "en" },

  // --- Espanhol (ES) ---
  { url: "https://www.expansion.com/rss/portada.xml", sector: "geral", lang: "es" },
  { url: "https://www.eleconomista.es/rss/rss-empresas.php", sector: "geral", lang: "es" },
  { url: "https://cincodias.elpais.com/rss/", sector: "geral", lang: "es" },
];
