// ============================================================
// Casos-verdade (golden) da auditoria de filtros.
//
// Cada caso e uma manchete (titulo [+ resumo]) com o SETOR e as LENTES
// que o classificador DEVE produzir. Sao o contrato dos filtros: se alguem
// mexer nas palavras-chave (classify.mjs) ou nas lentes (themes.mjs) e quebrar
// um destes, a auditoria falha. Adicione um caso sempre que corrigir um falso
// positivo/negativo no feed, pra ele nunca mais voltar.
//
// sector: id esperado (de src/lib/sectors.ts). "geral" = nenhuma palavra bateu
//         ou empate (o robo entao usa o setor da fonte).
// themes: conjunto exato de lentes esperadas (de themes.mjs). [] = nenhuma.
// ============================================================

export const SECTOR_CASES = [
  // --- positivos diretos (uma palavra-chave clara por setor) ---
  { text: "Safra de soja bate recorde no Mato Grosso", sector: "agronegocio" },
  { text: "Cervejaria lança nova linha de bebida sem álcool", sector: "alimentos-bebidas" },
  { text: "Magazine Luiza amplia e-commerce e vendas no varejo", sector: "comercio-varejista" },
  { text: "Atacadista expande distribuição para o Nordeste", sector: "comercio-atacadista" },
  { text: "Montadora retoma produção industrial na fábrica de SP", sector: "industria" },
  { text: "Incorporadora lança empreendimento imobiliário em Curitiba", sector: "construcao-imobiliario" },
  { text: "Startup de software fecha contrato de nuvem", sector: "tecnologia-software" },
  { text: "Operadora de telecom amplia banda larga 5G", sector: "telecomunicacoes" },
  { text: "Banco Central mantém a taxa Selic e juros elevados", sector: "servicos-financeiros" },
  { text: "Consultoria de auditoria reforça time de recrutamento", sector: "servicos-empresariais" },
  { text: "Hospital inaugura clínica e novo plano de saúde", sector: "saude-bem-estar" },
  { text: "Universidade abre vestibular e amplia ensino a distância", sector: "educacao" },
  { text: "Transportadora investe em frete e logística de entrega", sector: "transporte-logistica" },
  { text: "Petrobras aumenta produção de petróleo e gás natural", sector: "energia-recursos" },
  { text: "Rede de hotel aposta em turismo e novos pacotes de viagem", sector: "turismo-hotelaria" },
  { text: "Governo sanciona nova lei e abre licitação no ministério", sector: "setor-publico-terceiro" },

  // --- exclusoes: a palavra existe, mas no OUTRO sentido (deve dar 'geral') ---
  { text: "Empresa cria banco de talentos para novas vagas", sector: "geral" },
  { text: "Pesquisadores montam banco de dados aberto sobre o clima", sector: "geral" },
  { text: "Obra de arte é leiloada por valor recorde em Nova York", sector: "geral" },

  // --- exclusoes que NAO devem zerar o setor legitimo ---
  { text: "Operadora de turismo amplia pacotes de viagem para o verão", sector: "turismo-hotelaria" },

  // --- fronteira de palavra: nao casar substring solto ---
  { text: "Advogado fecha acordo em audiência trabalhista", sector: "geral" }, // 'gado' nao casa advogado
  { text: "Among Us ganha nova atualização nesta semana", sector: "geral" },   // 'ong' nao casa among
];

export const THEME_CASES = [
  // M&A
  { text: "Empresa adquire rival em fusão bilionária", themes: ["ma"] },
  { text: "Banco assume o controle de fintech após oferta", themes: ["ma"] },
  // M&A reais que NAO podem quebrar com as exclusoes (positivos a blindar)
  { text: "DM adquire FortBrasil e expande atuação em private label", themes: ["ma"] },
  { text: "Cencosud anuncia acordo para adquirir 100% dos supermercados St. Marche", themes: ["ma"] },
  { text: "Startup paranaense é adquirida pelo Grupo Santa Cruz", themes: ["empreendedorismo", "ma"] },
  // exclusao M&A: 'adquirir' de consumo, nao fusao
  { text: "Veja como adquirir um imóvel financiado pela Caixa", themes: [] },
  // exclusao M&A: consumo/varejo/listicle ("promoção", "como comprar", ranking)
  { text: "Hora de renovar o setup: notebooks em promoção para adquirir um novo computador", themes: [] },
  { text: "Como comprar GTA 6 parcelado? Veja opções para adquirir o game", themes: [] },
  { text: "13 melhores estúdios do Xbox: a ofensiva da Microsoft em aquisições de estúdios", themes: [] },
  // exclusao M&A: direito adquirido (juridico), nao fusao
  { text: "STF tem maioria para liberar penduricalhos adquiridos antes de restrição", themes: ["politica"] },
  // exclusao M&A: conhecimento que se adquire
  { text: "Esse tipo de conhecimento sobre o mercado só se adquire com experiência", themes: [] },
  // exclusao M&A: aquisicao de usuarios/engajamento (marketing de app)
  { text: "Copa do Mundo impulsiona aquisição e engajamento em aplicativos de streaming", themes: [] },
  // exclusao M&A: compras/procurement, nao fusao
  { text: "Planejamento de compras na construção: evite aquisições emergenciais", themes: [] },
  // exclusao M&A: consumo (necessidade de adquirir outro aparelho)
  { text: "Como deixar a TV antiga rápida sem a necessidade de adquirir outro aparelho", themes: [] },
  // exclusao M&A: crime, nao fusao (receptação)
  { text: "Jovem compra celular adquirido por R$ 1.800 e é autuado por receptação", themes: [] },
  // exclusao M&A: retrospectiva de carreira, nao um negócio em curso
  { text: "Após US$ 90 bilhões em aquisições, Bob Iger diz adeus à Disney", themes: [] },
  // M&A reais (precisao > recall): variacoes que precisam continuar casando
  { text: "Sabesp anuncia incorporação total da EMAE", themes: ["ma"] },
  { text: "Nubank avança em disputa para comprar unidade de banco português no Brasil", themes: ["ma"] },
  { text: "Grupo Zanchetta anuncia aquisição da Ceratti, marca de frios", themes: ["ma"] },
  { text: "Rocket Lab adquire Iridium por US$ 8 bilhões", themes: ["ma"] },
  { text: "Time For Fun lança edital de OPA para fechar o capital", themes: ["ma"] },
  // exclusao M&A: procurement/compra publica de bens (nao e deal societario)
  { text: "ONU adquire 10 mil sacos para cadáveres após terremotos na Venezuela", themes: [] },
  { text: "Governo vai adquirir vacinas contra a nova variante", themes: ["politica"] },
  { text: "Reino Unido adquirirá navios híbridos para a Marinha Real", themes: [] },
  // Empreendedorismo
  { text: "Fundador conta como abriu a empresa do zero", themes: ["empreendedorismo"] },
  // Politica & Regulacao
  { text: "Congresso aprova projeto de lei sobre marco regulatório", themes: ["politica"] },
  // Inovacao & IA
  { text: "Startup lança modelo de inteligência artificial generativa", themes: ["empreendedorismo", "inovacao"] },
  // exclusao inovacao: 'patente' militar, nao P&D
  { text: "Coronel perde a patente militar após decisão do STM", themes: [] },
  // Investimentos
  { text: "Companhia capta R$ 50 milhões em rodada série A", themes: ["investimentos"] },
  // multi-lente: startup + IA + aporte
  { text: "Startup de inteligência artificial recebe aporte de fundo", themes: ["empreendedorismo", "inovacao", "investimentos"] },
  // exclusao investimentos: 'ações' = iniciativas, nao bolsa
  { text: "Prefeitura anuncia ações de combate à dengue", themes: [] },
  // exclusao empreendedorismo: 'empreendimento' imobiliario/obra, nao empreendedor
  { text: "Cataguá Resort Esmeralda, empreendimento imobiliário, é lançado em MG", themes: [] },
  { text: "Galpões logísticos ganham espaço nos FIIs e a PZ Empreendimentos desenvolve novos projetos", themes: [] },
  { text: "Bill Gates, fundador da Microsoft, dá conselho de produtividade", themes: [] },
  // empreendedorismo real (blindar)
  { text: "Empreendedora abre negócio próprio e vira referência no setor", themes: ["empreendedorismo"] },
  // exclusao investimentos: 'B3' como empresa/local (vaga, leilao) e 'Serie B' futebol
  { text: "Analista de Engenharia de Software Júnior - Java - Vagas B3", themes: [] },
  { text: "Sky e HBO Max renomeiam estádio de time da Série B do Brasileirão", themes: [] },
  { text: "Leilão de saneamento na B3: consórcio arremata bloco de esgoto", themes: [] },
  // investimentos real (blindar)
  { text: "Fintech levantou R$ 100 milhões em nova rodada de investimento", themes: ["investimentos"] },
];
