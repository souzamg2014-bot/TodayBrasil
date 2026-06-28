import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — TodayBrasil",
  description: "Termos de Uso do TodayBrasil.",
};

// Termos de Uso (modelo padrao, PT-BR). Conteudo de partida; editar conforme necessario.
export default function Termos() {
  return (
    <div className="legal">
      <div className="legalhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← início</a>
      </div>

      <h1>Termos de Uso</h1>
      <p className="legaldate">Última atualização: 28 de junho de 2026</p>

      <p>
        Estes Termos de Uso (&quot;Termos&quot;) regem o acesso e a utilização do TodayBrasil
        (&quot;Plataforma&quot;, &quot;nós&quot;). Ao criar uma conta ou usar a Plataforma, você
        (&quot;usuário&quot;) declara que leu, entendeu e concorda com estes Termos. Se não
        concordar, não utilize a Plataforma.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O TodayBrasil é um agregador de notícias que coleta, organiza e classifica conteúdos
        públicos de fontes de terceiros, além de oferecer resumos editoriais por tema e janela de
        tempo. A Plataforma pode oferecer planos gratuitos e pagos, com funcionalidades distintas.
      </p>

      <h2>2. Conta e cadastro</h2>
      <ul>
        <li>Você é responsável pelas informações fornecidas e por manter a confidencialidade da sua senha.</li>
        <li>O cadastro é pessoal e intransferível; você responde pelas atividades realizadas na sua conta.</li>
        <li>É necessário ter capacidade civil para contratar. Menores devem ser representados por responsável legal.</li>
      </ul>

      <h2>3. Planos, pagamentos e cancelamento</h2>
      <ul>
        <li>Os planos pagos são cobrados pelo período contratado, por meio de provedor de pagamento (PagBank).</li>
        <li>O acesso premium vale enquanto a assinatura estiver ativa e dentro da validade.</li>
        <li>Você pode cancelar a qualquer momento, sem multa; o cancelamento encerra renovações futuras.</li>
        <li>Reembolsos seguem a legislação aplicável e a política informada no momento da contratação.</li>
      </ul>

      <h2>4. Uso permitido</h2>
      <p>
        Você concorda em não utilizar a Plataforma para fins ilícitos, não tentar burlar limites de
        acesso, não realizar engenharia reversa, raspagem automatizada em massa, nem redistribuir o
        conteúdo de forma que viole direitos de terceiros.
      </p>

      <h2>5. Conteúdo de terceiros</h2>
      <p>
        Os títulos, trechos e links exibidos pertencem aos respectivos veículos e são apresentados
        para fins informativos, com atribuição de fonte. O TodayBrasil não se responsabiliza pela
        exatidão, integralidade ou disponibilidade do conteúdo originado de terceiros. Resumos
        editoriais são produzidos com base nessas fontes e podem conter imprecisões.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        A marca, o layout, os textos editoriais próprios e o software da Plataforma são protegidos.
        O uso da Plataforma não transfere a você qualquer direito de propriedade intelectual.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        A Plataforma é fornecida &quot;no estado em que se encontra&quot;. Não garantimos
        disponibilidade ininterrupta e não respondemos por decisões tomadas com base nas
        informações exibidas. Em nenhuma hipótese a responsabilidade excederá os valores pagos
        pelo usuário nos 12 meses anteriores ao evento.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Podemos atualizar estes Termos a qualquer momento. Mudanças relevantes serão comunicadas na
        Plataforma. O uso continuado após a publicação implica concordância com a versão vigente.
      </p>

      <h2>9. Foro e legislação</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
        domicílio do usuário para dirimir eventuais controvérsias, quando aplicável.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas sobre estes Termos podem ser enviadas pelos canais oficiais informados na Plataforma.
        Veja também a nossa <a href="/privacidade">Política de Privacidade</a>.
      </p>
    </div>
  );
}
