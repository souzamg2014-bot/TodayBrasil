# Mapa-mestre de fontes (newsfeed)

Curadoria de fontes por setor. **Fase 1 = Brasil (PT-BR)** já ligado no robô
(`scripts/sources.pt.mjs`). Internacional (EN/ES) = fase 2. Dados primários
(IBGE, BCB, CVM, agências reguladoras) = pipeline à parte (API/scraper), não RSS.

> Status por fonte é decidido em runtime: o robô tenta achar o RSS a partir da
> home; o que não tiver feed é ignorado. Rodar `npm run ingest` mostra o que entrou.

---

## 1. Economia, Negócios e Mercado (transversal)
**BR:** Valor Econômico, Exame, InfoMoney, Brazil Journal, NeoFeed, Estadão Economia,
Folha Mercado, CNN Brasil Economia, Money Times, Seu Dinheiro, IstoÉ Dinheiro,
Bloomberg Línea Brasil, Agência Brasil Economia, Poder360 Economia.
**Intl (fase 2):** Bloomberg, Reuters Business, Financial Times, WSJ, CNBC,
The Economist, MarketWatch, Forbes, Fortune, Business Insider, FinancialJuice
(newswire em tempo real, EN — https://www.financialjuice.com).

## 2. Agronegócio
**BR:** Canal Rural, Notícias Agrícolas, Agrofy News, Globo Rural, Agrolink,
Valor Agro, Money Times Agro, Revista Cultivar, Compre Rural, BeefPoint,
Scot Consultoria, MilkPoint, Avicultura Industrial, Suinocultura Industrial.
**Intl:** Agriculture.com, AgWeb, Successful Farming, Farm Journal, USDA News,
Bloomberg Agriculture, Reuters Agriculture, Agrimoney, The Poultry Site, Dairy Herd.

## 3. Alimentos e Bebidas
**BR:** Food Connection, ABIA, Revista Food Service, Mundo do Marketing,
Diário do Comércio, Food Innovation, EmbalagemMarca, SuperHiper.
**Intl:** FoodNavigator, Food Business News, Beverage Daily, Food Dive,
Food Engineering, The Grocer, Grocery Dive.

## 4. Varejo / E-commerce
**BR:** E-commerce Brasil, Mercado & Consumo, Consumidor Moderno, Varejo Brasil,
Novarejo, Ecommerce na Prática, ABCOMM.
**Intl:** Retail Dive, Retail TouchPoints, Internet Retailer, Modern Retail,
Shopify Blog, eMarketer, Digital Commerce 360.

## 5. Indústria, Manufatura e Automotivo
**BR:** Portal da Indústria, Agência CNI, Automotive Business, AutoData,
Revista Manufatura, Usinagem Brasil, Brasil Engenharia.
**Intl:** IndustryWeek, Manufacturing.net, Automation World, The Manufacturer,
Automotive News, Electrek, Supply Chain Dive.

## 6. Construção Civil e Imobiliário
**BR:** SindusCon, CBIC, Buildin, Engenharia 360, Sienge, Mundo Concreto,
Portal AECweb, Secovi.
**Intl:** Construction Dive, ENR, Building Design + Construction, ArchDaily,
Dezeen, World Property Journal.

## 7. Tecnologia, Software, IA e Startups
**BR:** StartSe, Canaltech, Tecnoblog, Mobile Time, IT Forum, Baguete,
Startups.com.br, Distrito, FintechLab.
**Intl:** TechCrunch, The Verge, Wired, VentureBeat, MIT Technology Review,
Ars Technica, Hacker News, Product Hunt, Crunchbase News, CB Insights.

## 8. Telecomunicações
**BR:** TeleSíntese, Mobile Time, Teletime, Convergência Digital.
**Intl:** Light Reading, Fierce Telecom, Telecoms.com, Mobile World Live.

## 9. Serviços Financeiros
**BR:** Banco Central, CVM, Febraban, Anbima, B3, Quantum Finance,
Funds Explorer, TradeMap, Investing Brasil.
**Intl:** Bloomberg Markets, Reuters Finance, Seeking Alpha, Morningstar,
Yahoo Finance, The Motley Fool, Barron's, FT Markets.

## 10. Serviços Empresariais (consultoria, RH, marketing, jurídico)
**BR:** Meio & Mensagem, Mundo do Marketing, Consumidor Moderno, Administradores,
Contábeis, Migalhas, Jota.
**Intl:** Harvard Business Review, McKinsey Insights, Deloitte Insights,
PwC Insights, Gartner, SHRM.

## 11. Saúde e Bem-estar
**BR:** Saúde Business, Medicina S/A, Panorama Farmacêutico, Guia da Farmácia,
Valor Saúde.
**Intl:** Fierce Healthcare, STAT News, MedCity News, Healthcare Dive,
PharmaTimes, BioPharma Dive.

## 12. Educação
**BR:** Porvir, Agência Brasil Educação, Desafios da Educação, Revista Educação,
Canal Educação.
**Intl:** EdSurge, EdTech Digest, Education Week, Times Higher Education.

## 13. Transporte e Logística
**BR:** Tecnologística, MundoLogística, Portal Transporta Brasil, Guia do TRC,
CNT Notícias.
**Intl:** Supply Chain Dive, FreightWaves, Logistics Management, Transport Topics,
The Loadstar.

## 14. Energia e Recursos Naturais
**BR:** Canal Energia, EPBR, Petróleo Hoje, Brasil Energia, Mining.com Brasil,
Notícias de Mineração.
**Intl:** OilPrice, Energy Intelligence, Utility Dive, Renewable Energy World,
Mining.com, S&P Global Energy.

## 15. Turismo, Hotelaria e Entretenimento
**BR:** Panrotas, Mercado & Eventos, Hotelier News, Revista Hotéis, Meio & Mensagem.
**Intl:** Skift, Travel Weekly, Hospitality Net, Hotel News Now, Variety, Deadline.

## 16. Serviços Domésticos e Pequenos Negócios
**BR:** Sebrae, PEGN, Diário do Comércio, Exame PME.
**Intl:** Entrepreneur, Small Business Trends, Forbes Small Business, Inc Magazine.

## 17. Economia Criativa (moda, música, audiovisual, games, design)
**BR:** FFW, Fashion Network Brasil, Meio & Mensagem, Propmark, Tela Viva, AdNews.
**Intl:** Vogue Business, Business of Fashion, Variety, The Hollywood Reporter,
GamesIndustry.biz, Polygon, IGN.

## 18. Setor Público e Terceiro Setor
**BR:** Agência Brasil, Senado Notícias, Câmara Notícias, IPEA, IBGE,
Tesouro Nacional, Portal da Transparência.
**Intl:** World Bank News, IMF News, OECD, UN News, Reuters Politics.

---

## Camada de dados primários (pipeline à parte, não RSS)
Crawler/API dedicado, fase 2+.
**BR:** IBGE, Banco Central, CVM, B3, Receita Federal, Tesouro Nacional,
Ministério do Trabalho, ANEEL, ANATEL, ANP, ANVISA, MAPA, SECEX.
**Intl:** SEC (EUA), Federal Reserve, ECB, World Bank, IMF, OECD, WTO, UN Data.
