// ============================================================
// Fontes INTERNACIONAIS (filtro "Mundo").
// Cada fonte: { url, sector, lang, country }.
//   - country: codigo do pais/regiao (bate com src/lib/countries.ts) -> barra
//     lateral de paises no Mundo.
//   - sector : HINT (o classificador por palavra-chave e PT-BR; nao roda em
//     texto EN/ES). Sem lentes/temas no Mundo por enquanto.
//   - lang   : idioma do conteudo. O escopo "Mundo" mostra tudo != pt.
// O resolver acha o RSS a partir da home; o que nao tiver feed cai no fallback
// Google News (no idioma da fonte).
// ============================================================

const SOURCES_INTL_ALL = [
  // ===================== ESTADOS UNIDOS (US) =====================
  { url: "https://www.reuters.com/business/", sector: "geral", lang: "en", country: "US" },
  { url: "https://apnews.com/hub/business", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.bloomberg.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.wsj.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.nytimes.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://edition.cnn.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.cnbc.com/world/?region=world", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.foxnews.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.washingtonpost.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.politico.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.usatoday.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.nbcnews.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://abcnews.go.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.cbsnews.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.npr.org/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.axios.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://thehill.com/", sector: "geral", lang: "en", country: "US" },
  { url: "https://www.marketwatch.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.barrons.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://fortune.com/feed/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.forbes.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.businessinsider.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  // Tecnologia (US)
  { url: "https://techcrunch.com/feed/", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://www.theverge.com/rss/index.xml", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://www.wired.com/feed/rss", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://arstechnica.com/feed/", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://www.engadget.com/", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://www.technologyreview.com/", sector: "tecnologia-software", lang: "en", country: "US" },
  { url: "https://venturebeat.com/feed/", sector: "tecnologia-software", lang: "en", country: "US" },

  // ===================== CANADÁ (CA) =====================
  { url: "https://www.cbc.ca/news", sector: "geral", lang: "en", country: "CA" },
  { url: "https://www.theglobeandmail.com/", sector: "geral", lang: "en", country: "CA" },
  { url: "https://nationalpost.com/", sector: "geral", lang: "en", country: "CA" },
  { url: "https://www.thestar.com/", sector: "geral", lang: "en", country: "CA" },
  { url: "https://www.bnnbloomberg.ca/", sector: "servicos-financeiros", lang: "en", country: "CA" },

  // ===================== MÉXICO (MX) =====================
  { url: "https://www.eluniversal.com.mx/", sector: "geral", lang: "es", country: "MX" },
  { url: "https://www.milenio.com/", sector: "geral", lang: "es", country: "MX" },
  { url: "https://www.reforma.com/", sector: "geral", lang: "es", country: "MX" },
  { url: "https://expansion.mx/", sector: "servicos-financeiros", lang: "es", country: "MX" },
  { url: "https://www.forbes.com.mx/", sector: "servicos-financeiros", lang: "es", country: "MX" },
  { url: "https://www.animalpolitico.com/", sector: "geral", lang: "es", country: "MX" },

  // ===================== REINO UNIDO (GB) =====================
  { url: "https://www.bbc.com/news", sector: "geral", lang: "en", country: "GB" },
  { url: "https://www.theguardian.com/uk/business/rss", sector: "geral", lang: "en", country: "GB" },
  { url: "https://www.ft.com/", sector: "servicos-financeiros", lang: "en", country: "GB" },
  { url: "https://www.economist.com/finance-and-economics/rss.xml", sector: "servicos-financeiros", lang: "en", country: "GB" },
  { url: "https://news.sky.com/", sector: "geral", lang: "en", country: "GB" },
  { url: "https://www.telegraph.co.uk/", sector: "geral", lang: "en", country: "GB" },
  { url: "https://www.dailymail.co.uk/", sector: "geral", lang: "en", country: "GB" },
  { url: "https://www.independent.co.uk/", sector: "geral", lang: "en", country: "GB" },

  // ===================== ALEMANHA (DE) =====================
  { url: "https://www.dw.com/", sector: "geral", lang: "en", country: "DE" },
  { url: "https://www.spiegel.de/", sector: "geral", lang: "de", country: "DE" },
  { url: "https://www.faz.net/", sector: "servicos-financeiros", lang: "de", country: "DE" },
  { url: "https://www.handelsblatt.com/", sector: "servicos-financeiros", lang: "de", country: "DE" },
  { url: "https://www.sueddeutsche.de/", sector: "geral", lang: "de", country: "DE" },

  // ===================== FRANÇA (FR) =====================
  { url: "https://www.france24.com/", sector: "geral", lang: "fr", country: "FR" },
  { url: "https://www.lemonde.fr/", sector: "geral", lang: "fr", country: "FR" },
  { url: "https://www.lesechos.fr/", sector: "servicos-financeiros", lang: "fr", country: "FR" },
  { url: "https://www.lefigaro.fr/", sector: "geral", lang: "fr", country: "FR" },
  { url: "https://www.liberation.fr/", sector: "geral", lang: "fr", country: "FR" },

  // ===================== ESPANHA (ES) =====================
  { url: "https://elpais.com/", sector: "geral", lang: "es", country: "ES" },
  { url: "https://www.abc.es/", sector: "geral", lang: "es", country: "ES" },
  { url: "https://www.lavanguardia.com/", sector: "geral", lang: "es", country: "ES" },
  { url: "https://www.expansion.com/rss/portada.xml", sector: "servicos-financeiros", lang: "es", country: "ES" },
  { url: "https://www.eleconomista.es/rss/rss-empresas.php", sector: "servicos-financeiros", lang: "es", country: "ES" },
  { url: "https://cincodias.elpais.com/rss/", sector: "servicos-financeiros", lang: "es", country: "ES" },

  // ===================== ITÁLIA (IT) =====================
  { url: "https://www.repubblica.it/", sector: "geral", lang: "it", country: "IT" },
  { url: "https://www.corriere.it/", sector: "geral", lang: "it", country: "IT" },
  { url: "https://www.ilsole24ore.com/", sector: "servicos-financeiros", lang: "it", country: "IT" },

  // ===================== HOLANDA (NL) =====================
  { url: "https://nltimes.nl/", sector: "geral", lang: "en", country: "NL" },
  { url: "https://www.telegraaf.nl/", sector: "geral", lang: "nl", country: "NL" },
  { url: "https://www.nrc.nl/", sector: "geral", lang: "nl", country: "NL" },

  // ===================== SUÍÇA (CH) =====================
  { url: "https://www.swissinfo.ch/", sector: "geral", lang: "en", country: "CH" },
  { url: "https://www.nzz.ch/", sector: "geral", lang: "de", country: "CH" },

  // ===================== CHINA (CN) =====================
  { url: "https://english.news.cn/", sector: "geral", lang: "en", country: "CN" },
  { url: "https://www.chinadaily.com.cn/", sector: "geral", lang: "en", country: "CN" },
  { url: "https://www.scmp.com/", sector: "geral", lang: "en", country: "CN" },
  { url: "https://www.caixinglobal.com/", sector: "servicos-financeiros", lang: "en", country: "CN" },
  { url: "https://www.globaltimes.cn/", sector: "geral", lang: "en", country: "CN" },
  { url: "https://en.people.cn/", sector: "geral", lang: "en", country: "CN" },

  // ===================== HONG KONG (HK) =====================
  { url: "https://www.thestandard.com.hk/", sector: "geral", lang: "en", country: "HK" },
  { url: "https://hongkongfp.com/", sector: "geral", lang: "en", country: "HK" },

  // ===================== SINGAPURA (SG) =====================
  { url: "https://www.channelnewsasia.com/", sector: "geral", lang: "en", country: "SG" },
  { url: "https://www.straitstimes.com/", sector: "geral", lang: "en", country: "SG" },
  { url: "https://www.businesstimes.com.sg/", sector: "servicos-financeiros", lang: "en", country: "SG" },

  // ===================== JAPÃO (JP) =====================
  { url: "https://www3.nhk.or.jp/nhkworld", sector: "geral", lang: "en", country: "JP" },
  { url: "https://asia.nikkei.com/", sector: "servicos-financeiros", lang: "en", country: "JP" },
  { url: "https://www.japantimes.co.jp/", sector: "geral", lang: "en", country: "JP" },
  { url: "https://english.kyodonews.net/", sector: "geral", lang: "en", country: "JP" },

  // ===================== COREIA DO SUL (KR) =====================
  { url: "https://en.yna.co.kr/", sector: "geral", lang: "en", country: "KR" },
  { url: "https://www.koreaherald.com/", sector: "geral", lang: "en", country: "KR" },
  { url: "https://www.kedglobal.com/", sector: "servicos-financeiros", lang: "en", country: "KR" },

  // ===================== ÍNDIA (IN) =====================
  { url: "https://timesofindia.indiatimes.com/", sector: "geral", lang: "en", country: "IN" },
  { url: "https://www.thehindu.com/", sector: "geral", lang: "en", country: "IN" },
  { url: "https://economictimes.indiatimes.com/", sector: "servicos-financeiros", lang: "en", country: "IN" },
  { url: "https://www.business-standard.com/", sector: "servicos-financeiros", lang: "en", country: "IN" },
  { url: "https://www.ndtv.com/", sector: "geral", lang: "en", country: "IN" },
  { url: "https://www.hindustantimes.com/", sector: "geral", lang: "en", country: "IN" },

  // ===================== AUSTRÁLIA (AU) =====================
  { url: "https://www.abc.net.au/news", sector: "geral", lang: "en", country: "AU" },
  { url: "https://www.smh.com.au/", sector: "geral", lang: "en", country: "AU" },
  { url: "https://www.afr.com/", sector: "servicos-financeiros", lang: "en", country: "AU" },
  { url: "https://www.news.com.au/", sector: "geral", lang: "en", country: "AU" },

  // ===================== RÚSSIA (RU) =====================
  { url: "https://tass.com/", sector: "geral", lang: "en", country: "RU" },
  { url: "https://www.rt.com/", sector: "geral", lang: "en", country: "RU" },
  { url: "https://www.themoscowtimes.com/", sector: "geral", lang: "en", country: "RU" },
  { url: "https://interfax.com/", sector: "geral", lang: "en", country: "RU" },

  // ===================== ORIENTE MÉDIO =====================
  { url: "https://www.aljazeera.com/", sector: "geral", lang: "en", country: "QA" },
  { url: "https://www.arabnews.com/", sector: "geral", lang: "en", country: "SA" },
  { url: "https://www.thenationalnews.com/", sector: "geral", lang: "en", country: "AE" },
  { url: "https://www.middleeasteye.net/", sector: "geral", lang: "en", country: "MEA" },

  // ===================== ÁFRICA =====================
  { url: "https://www.africanews.com/", sector: "geral", lang: "en", country: "AFR" },
  { url: "https://www.theafricareport.com/", sector: "geral", lang: "en", country: "AFR" },
  { url: "https://www.africa-confidential.com/", sector: "geral", lang: "en", country: "AFR" },
  { url: "https://www.news24.com/", sector: "geral", lang: "en", country: "ZA" },
  { url: "https://www.dailymaverick.co.za/", sector: "geral", lang: "en", country: "ZA" },
  { url: "https://www.businesslive.co.za/bd", sector: "servicos-financeiros", lang: "en", country: "ZA" },

  // ============================================================
  // Fontes SETORIAIS globais (mantidas da fase anterior). Pais aproximado.
  // ============================================================
  // Agronegocio
  { url: "https://www.agriculture.com/", sector: "agronegocio", lang: "en", country: "US" },
  { url: "https://www.agweb.com/", sector: "agronegocio", lang: "en", country: "US" },
  { url: "https://www.thepoultrysite.com/", sector: "agronegocio", lang: "en", country: "GB" },
  { url: "https://www.dairyherd.com/", sector: "agronegocio", lang: "en", country: "US" },
  // Alimentos e bebidas
  { url: "https://www.foodnavigator.com/", sector: "alimentos-bebidas", lang: "en", country: "GB" },
  { url: "https://www.fooddive.com/feeds/news/", sector: "alimentos-bebidas", lang: "en", country: "US" },
  { url: "https://www.thegrocer.co.uk/", sector: "alimentos-bebidas", lang: "en", country: "GB" },
  // Varejo / e-commerce
  { url: "https://www.retaildive.com/feeds/news/", sector: "comercio-varejista", lang: "en", country: "US" },
  { url: "https://chainstoreage.com/", sector: "comercio-varejista", lang: "en", country: "US" },
  // Industria / manufatura / automotivo
  { url: "https://www.industryweek.com/", sector: "industria", lang: "en", country: "US" },
  { url: "https://www.manufacturingdive.com/feeds/news/", sector: "industria", lang: "en", country: "US" },
  { url: "https://www.autonews.com/", sector: "industria", lang: "en", country: "US" },
  // Construcao e imobiliario
  { url: "https://www.constructiondive.com/feeds/news/", sector: "construcao-imobiliario", lang: "en", country: "US" },
  { url: "https://www.archdaily.com/", sector: "construcao-imobiliario", lang: "en", country: "US" },
  { url: "https://www.dezeen.com/feed/", sector: "construcao-imobiliario", lang: "en", country: "GB" },
  // Telecomunicacoes
  { url: "https://www.lightreading.com/", sector: "telecomunicacoes", lang: "en", country: "US" },
  { url: "https://www.fiercetelecom.com/", sector: "telecomunicacoes", lang: "en", country: "US" },
  // Servicos financeiros
  { url: "https://seekingalpha.com/feed.xml", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.morningstar.com/", sector: "servicos-financeiros", lang: "en", country: "US" },
  { url: "https://www.investing.com/rss/news.rss", sector: "servicos-financeiros", lang: "en", country: "US" },
  // Servicos empresariais
  { url: "https://hbr.org/", sector: "servicos-empresariais", lang: "en", country: "US" },
  { url: "https://www.mckinsey.com/insights/rss", sector: "servicos-empresariais", lang: "en", country: "US" },
  { url: "https://adage.com/", sector: "servicos-empresariais", lang: "en", country: "US" },
  // Saude e bem-estar
  { url: "https://www.statnews.com/feed/", sector: "saude-bem-estar", lang: "en", country: "US" },
  { url: "https://www.fiercehealthcare.com/", sector: "saude-bem-estar", lang: "en", country: "US" },
  // Transporte e logistica
  { url: "https://www.freightwaves.com/feed", sector: "transporte-logistica", lang: "en", country: "US" },
  { url: "https://theloadstar.com/feed/", sector: "transporte-logistica", lang: "en", country: "GB" },
  // Energia e recursos
  { url: "https://oilprice.com/rss/main", sector: "energia-recursos", lang: "en", country: "US" },
  { url: "https://www.renewableenergyworld.com/feed/", sector: "energia-recursos", lang: "en", country: "US" },
  // Turismo e hotelaria
  { url: "https://skift.com/feed/", sector: "turismo-hotelaria", lang: "en", country: "US" },
  // Economia criativa
  { url: "https://variety.com/feed/", sector: "economia-criativa", lang: "en", country: "US" },
  { url: "https://www.hollywoodreporter.com/feed/", sector: "economia-criativa", lang: "en", country: "US" },
  // Educacao
  { url: "https://www.edsurge.com/articles_rss", sector: "educacao", lang: "en", country: "US" },
];

// O "Mundo" foi reduzido a 3 regioes economicas (EUA, Asia, Zona do Euro).
// Mantemos so as fontes desses paises; os demais (CA, MX, IN, AU, RU, SG, QA,
// SA, AE, MEA, ZA, AFR, HK, CH...) saem da ingestao. Bate com REGIONS em
// src/lib/countries.ts.
const KEEP_COUNTRIES = new Set(["US", "CN", "JP", "KR", "DE", "FR", "ES", "IT", "NL", "GB"]);
export const SOURCES_INTL = SOURCES_INTL_ALL.filter((s) => KEEP_COUNTRIES.has(s.country));
