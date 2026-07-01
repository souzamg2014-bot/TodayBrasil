// ============================================================
// Fontes PT-BR (fase 1). Cada fonte tem um setor "hint": se o robo nao
// conseguir classificar pelo texto (cai em 'geral'), usa o setor da fonte.
// O resolver tenta achar o RSS a partir da URL; o que nao tiver feed e ignorado.
// Internacional (EN/ES) fica no docs/sources-master.md para a fase 2.
// ============================================================

export const SOURCES = [
  // 1. Economia / mercado (transversal) -> deixa o classify decidir
  { url: "https://valor.globo.com", sector: "geral" },
  { url: "https://exame.com/feed/", sector: "geral" },
  { url: "https://www.infomoney.com.br/feed/", sector: "geral" },
  { url: "https://braziljournal.com/feed/", sector: "geral" },
  { url: "https://neofeed.com.br/feed/", sector: "geral" },
  { url: "https://economia.estadao.com.br", sector: "geral" },
  { url: "https://feeds.folha.uol.com.br/mercado/rss091.xml", sector: "geral" },
  { url: "https://www.cnnbrasil.com.br/economia/feed/", sector: "geral" },
  { url: "https://www.moneytimes.com.br/feed/", sector: "geral" },
  { url: "https://www.seudinheiro.com/feed/", sector: "geral" },
  { url: "https://istoedinheiro.com.br/feed/", sector: "geral" },
  { url: "https://www.bloomberglinea.com.br/feed/", sector: "geral" },
  { url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml", sector: "geral" },
  { url: "https://www.poder360.com.br/feed/", sector: "geral" },
  { url: "https://g1.globo.com/", sector: "geral" },
  { url: "https://www.estadao.com.br", sector: "geral" },
  { url: "https://economicnewsbrasil.com.br", sector: "geral" },
  { url: "https://investnews.com.br/", sector: "geral" },

  // 2. Agronegocio
  { url: "https://www.canalrural.com.br/feed/", sector: "agronegocio" },
  { url: "https://www.noticiasagricolas.com.br", sector: "agronegocio" },
  { url: "https://www.agrolink.com.br", sector: "agronegocio" },
  { url: "https://globorural.globo.com", sector: "agronegocio" },
  { url: "https://www.scotconsultoria.com.br", sector: "agronegocio" },
  { url: "https://www.agrofy.com.br", sector: "agronegocio" },
  { url: "https://revistacultivar.com.br/feed", sector: "agronegocio" },
  { url: "https://www.comprerural.com/feed/", sector: "agronegocio" },
  { url: "https://www.beefpoint.com.br/feed/", sector: "agronegocio" },
  { url: "https://www.milkpoint.com.br/feed/", sector: "agronegocio" },
  { url: "https://www.aviculturaindustrial.com.br/feed", sector: "agronegocio" },
  { url: "https://www.suinoculturaindustrial.com.br", sector: "agronegocio" },
  { url: "https://www.universoagro.com", sector: "agronegocio" },
  { url: "https://www.agroacontece.com.br", sector: "agronegocio" },
  { url: "https://gestagro360.com.br", sector: "agronegocio" },
  { url: "https://sba1.com", sector: "agronegocio" },
  { url: "https://rnews.agr.br", sector: "agronegocio" },

  // 3. Alimentos e bebidas
  { url: "https://foodconnection.com.br/feed/", sector: "alimentos-bebidas" },
  { url: "https://www.abia.org.br", sector: "alimentos-bebidas" },
  { url: "https://www.superhiper.com.br", sector: "alimentos-bebidas" },
  { url: "https://www.dcomercio.com.br", sector: "comercio-varejista" },
  { url: "https://www.embalagemmarca.com.br", sector: "alimentos-bebidas" },

  // 4. Varejo / e-commerce
  { url: "https://www.ecommercebrasil.com.br/feed", sector: "comercio-varejista" },
  { url: "https://mercadoeconsumo.com.br/feed/", sector: "comercio-varejista" },
  { url: "https://www.consumidormoderno.com.br/feed/", sector: "comercio-varejista" },
  { url: "https://novarejo.com.br/feed/", sector: "comercio-varejista" },
  { url: "https://abcomm.org", sector: "comercio-varejista" },
  { url: "https://gironews.com", sector: "comercio-varejista" },

  // 5. Industria, manufatura e automotivo
  { url: "https://noticias.portaldaindustria.com.br", sector: "industria" },
  { url: "https://automotivebusiness.com.br", sector: "industria" },
  { url: "https://autodata.com.br", sector: "industria" },
  { url: "https://www.revistamanufatura.com.br", sector: "industria" },
  { url: "https://www.usinagem-brasil.com.br", sector: "industria" },
  { url: "https://abimaq.org.br", sector: "industria" },
  { url: "https://estradao.estadao.com.br", sector: "industria" },
  { url: "https://www.portaldaindustria.com.br/agenciacni", sector: "industria" },
  { url: "https://insideevs.uol.com.br", sector: "industria" },

  // 6. Construcao e imobiliario
  { url: "https://sindusconsp.com.br", sector: "construcao-imobiliario" },
  { url: "https://cbic.org.br", sector: "construcao-imobiliario" },
  { url: "https://buildin.com.br", sector: "construcao-imobiliario" },
  { url: "https://www.engenharia360.com", sector: "construcao-imobiliario" },
  { url: "https://www.sienge.com.br/blog", sector: "construcao-imobiliario" },
  { url: "https://www.aecweb.com.br", sector: "construcao-imobiliario" },
  { url: "https://www.secovi.com.br", sector: "construcao-imobiliario" },
  { url: "https://mundoconstrutor.com.br", sector: "construcao-imobiliario" },

  // 7. Tecnologia, software, IA e startups
  { url: "https://www.startse.com/feed", sector: "tecnologia-software" },
  { url: "https://canaltech.com.br/rss/", sector: "tecnologia-software" },
  { url: "https://tecnoblog.net", sector: "tecnologia-software" },
  { url: "https://www.mobiletime.com.br", sector: "tecnologia-software" },
  { url: "https://itforum.com.br/feed/", sector: "tecnologia-software" },
  { url: "https://www.baguete.com.br", sector: "tecnologia-software" },
  { url: "https://startups.com.br/feed/", sector: "tecnologia-software" },
  { url: "https://distrito.me", sector: "tecnologia-software" },
  { url: "https://fintechlab.com.br", sector: "tecnologia-software" },
  { url: "https://startupi.com.br", sector: "tecnologia-software" },
  { url: "https://olhardigital.com.br/feed/", sector: "tecnologia-software" },
  { url: "https://www.tecmundo.com.br/rss", sector: "tecnologia-software" },

  // 8. Telecomunicacoes
  { url: "https://www.telesintese.com.br/feed/", sector: "telecomunicacoes" },
  { url: "https://teletime.com.br/feed/", sector: "telecomunicacoes" },
  { url: "https://convergenciadigital.com.br", sector: "telecomunicacoes" },
  { url: "https://tiinside.com.br", sector: "telecomunicacoes" },

  // 9. Servicos financeiros
  { url: "https://www.anbima.com.br", sector: "servicos-financeiros" },
  { url: "https://www.b3.com.br", sector: "servicos-financeiros" },
  { url: "https://www.fundsexplorer.com.br/feed", sector: "servicos-financeiros" },
  { url: "https://portal.febraban.org.br", sector: "servicos-financeiros" },
  { url: "https://finsidersbrasil.com.br", sector: "servicos-financeiros" },

  // 10. Servicos empresariais (consultoria, RH, marketing, juridico)
  { url: "https://www.meioemensagem.com.br", sector: "servicos-empresariais" },
  { url: "https://www.mundodomarketing.com.br", sector: "servicos-empresariais" },
  { url: "https://administradores.com.br", sector: "servicos-empresariais" },
  { url: "https://www.contabeis.com.br/rss/noticias/", sector: "servicos-empresariais" },
  { url: "https://www.migalhas.com.br/rss", sector: "servicos-empresariais" },
  { url: "https://www.jota.info/feed", sector: "servicos-empresariais" },

  // 11. Saude e bem-estar
  { url: "https://saudebusiness.com", sector: "saude-bem-estar" },
  { url: "https://medicinasa.com.br", sector: "saude-bem-estar" },
  { url: "https://panoramafarmaceutico.com.br", sector: "saude-bem-estar" },
  { url: "https://guiadafarmacia.com.br/feed", sector: "saude-bem-estar" },
  { url: "https://ictq.com.br", sector: "saude-bem-estar" },

  // 12. Educacao
  { url: "https://porvir.org/feed/", sector: "educacao" },
  { url: "https://desafiosdaeducacao.com.br/feed/", sector: "educacao" },
  { url: "https://revistaeducacao.com.br/feed/", sector: "educacao" },

  // 13. Transporte e logistica
  { url: "https://www.tecnologistica.com.br", sector: "transporte-logistica" },
  { url: "https://www.mundologistica.com.br", sector: "transporte-logistica" },
  { url: "https://logweb.com.br", sector: "transporte-logistica" },
  { url: "https://cargonews.com.br", sector: "transporte-logistica" },
  { url: "https://www.guiadotrc.com.br", sector: "transporte-logistica" },
  { url: "https://www.cnt.org.br", sector: "transporte-logistica" },
  { url: "https://setcesp.org.br", sector: "transporte-logistica" },

  // 14. Energia e recursos naturais
  { url: "https://canalenergia.com.br", sector: "energia-recursos" },
  { url: "https://epbr.com.br", sector: "energia-recursos" },
  { url: "https://brasilenergia.com.br", sector: "energia-recursos" },
  { url: "https://petronoticias.com.br", sector: "energia-recursos" },
  { url: "https://www.noticiasdemineracao.com", sector: "energia-recursos" },
  { url: "https://mineralbr.com.br", sector: "energia-recursos" },

  // 15. Turismo, hotelaria e entretenimento
  { url: "https://www.panrotas.com.br", sector: "turismo-hotelaria" },
  { url: "https://www.mercadoeeventos.com.br", sector: "turismo-hotelaria" },
  { url: "https://www.hoteliernews.com.br", sector: "turismo-hotelaria" },
  { url: "https://www.revistahoteis.com.br", sector: "turismo-hotelaria" },

  // 16. Servicos domesticos e pequenos negocios
  { url: "https://sebrae.com.br", sector: "servicos-domesticos" },
  { url: "https://revistapegn.globo.com", sector: "servicos-domesticos" },
  { url: "https://endeavor.org.br", sector: "servicos-domesticos" },

  // 17. Economia criativa (moda, musica, audiovisual, games, design)
  { url: "https://ffw.com.br", sector: "economia-criativa" },
  { url: "https://br.fashionnetwork.com", sector: "economia-criativa" },
  { url: "https://propmark.com.br", sector: "economia-criativa" },
  { url: "https://telaviva.com.br/feed/", sector: "economia-criativa" },
  { url: "https://adnews.com.br/feed/", sector: "economia-criativa" },

  // 18. Setor publico e terceiro setor
  { url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", sector: "setor-publico-terceiro" },
  { url: "https://www12.senado.leg.br/noticias", sector: "setor-publico-terceiro" },
  { url: "https://www.camara.leg.br/noticias/rss", sector: "setor-publico-terceiro" },
  { url: "https://www.ipea.gov.br", sector: "setor-publico-terceiro" },
  { url: "https://agenciadenoticias.ibge.gov.br/agencia-noticias", sector: "setor-publico-terceiro" },

  // 19. Grandes portais e negocios (ampliacao) -> deixa o classify decidir o setor
  { url: "https://forbes.com.br/feed/", sector: "geral" },
  { url: "https://economia.uol.com.br/", sector: "geral" },
  { url: "https://oglobo.globo.com/economia/", sector: "geral" },
  { url: "https://epocanegocios.globo.com/", sector: "geral" },
  { url: "https://valorinveste.globo.com/", sector: "servicos-financeiros" },
  { url: "https://einvestidor.estadao.com.br/", sector: "servicos-financeiros" },
  { url: "https://www.suno.com.br/noticias/", sector: "servicos-financeiros" },
  { url: "https://moneyreport.com.br/", sector: "geral" },
  { url: "https://www.cartacapital.com.br/economia/", sector: "geral" },
  { url: "https://www.metropoles.com/brasil/economia", sector: "geral" },
  { url: "https://www.bbc.com/portuguese", sector: "geral" },
  { url: "https://www.correiobraziliense.com.br/economia/", sector: "geral" },
  { url: "https://www.gazetadopovo.com.br/economia/", sector: "geral" },
  { url: "https://www.terra.com.br/economia/", sector: "geral" },
  { url: "https://noticias.r7.com/economia/", sector: "geral" },
  { url: "https://monitormercantil.com.br/", sector: "geral" },
  { url: "https://diariodocomercio.com.br/", sector: "geral" },
  { url: "https://veja.abril.com.br/economia/", sector: "geral" },
];
