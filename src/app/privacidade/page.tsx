import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — TodayBrasil",
  description: "Política de Privacidade do TodayBrasil.",
};

// Politica de Privacidade (modelo padrao, alinhado a LGPD). Conteudo de partida.
export default function Privacidade() {
  return (
    <div className="legal">
      <div className="legalhead">
        <a href="/"><span className="cadminilogo">Today<em>Brasil</em></span></a>
        <a className="hint" href="/">← início</a>
      </div>

      <h1>Política de Privacidade</h1>
      <p className="legaldate">Última atualização: 28 de junho de 2026</p>

      <p>
        Esta Política descreve como o TodayBrasil coleta, usa e protege dados pessoais, em
        conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados, &quot;LGPD&quot;).
        Ao usar a Plataforma, você concorda com as práticas aqui descritas.
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> e-mail e senha (armazenada de forma criptografada pelo provedor de autenticação).</li>
        <li><strong>Assinatura:</strong> dados de plano e validade; o processamento de pagamento é feito pelo PagBank, que trata os dados financeiros.</li>
        <li><strong>Uso:</strong> registros técnicos básicos (como buscas feitas e preferências de tema) para operar e melhorar o serviço.</li>
      </ul>

      <h2>2. Como usamos os dados</h2>
      <ul>
        <li>Autenticar o acesso e gerenciar a sua conta e o seu plano.</li>
        <li>Operar funcionalidades como feed, lentes e Resumos Inteligentes.</li>
        <li>Melhorar a Plataforma, prevenir fraudes e cumprir obrigações legais.</li>
      </ul>

      <h2>3. Base legal</h2>
      <p>
        Tratamos dados com fundamento na execução do contrato (prestação do serviço), no
        cumprimento de obrigação legal, no legítimo interesse para segurança e melhoria, e no
        consentimento, quando aplicável.
      </p>

      <h2>4. Compartilhamento</h2>
      <p>
        Não vendemos dados pessoais. Compartilhamos dados apenas com provedores necessários à
        operação, como hospedagem e banco de dados (Supabase/Vercel) e processamento de pagamentos
        (PagBank), ou quando exigido por lei.
      </p>

      <h2>5. Armazenamento e segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados, incluindo
        controle de acesso e políticas de segurança em nível de banco. Nenhum sistema é
        completamente imune a riscos; em caso de incidente relevante, agiremos conforme a LGPD.
      </p>

      <h2>6. Seus direitos</h2>
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul>
        <li>Confirmação da existência de tratamento e acesso aos seus dados.</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
        <li>Portabilidade e informação sobre compartilhamentos.</li>
        <li>Revogação do consentimento e exclusão da conta.</li>
      </ul>

      <h2>7. Retenção</h2>
      <p>
        Mantemos os dados pelo tempo necessário às finalidades descritas e às obrigações legais.
        Encerrada a conta, os dados são eliminados ou anonimizados, salvo retenção exigida por lei.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Utilizamos armazenamento local e cookies essenciais para autenticação e preferências (como o
        tema claro/escuro). Você pode gerenciar cookies nas configurações do seu navegador.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Esta Política pode ser atualizada. Mudanças relevantes serão comunicadas na Plataforma, com
        indicação da data de atualização.
      </p>

      <h2>10. Contato e encarregado</h2>
      <p>
        Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, utilize os canais
        oficiais informados na Plataforma. Veja também os nossos <a href="/termos">Termos de Uso</a>.
      </p>
    </div>
  );
}
