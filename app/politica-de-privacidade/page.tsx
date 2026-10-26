import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Central GSM',
  description: 'Conheça nossa Política de Privacidade e Proteção de Dados em conformidade com a LGPD (Lei nº 13.709/2018). Saiba como tratamos seus dados.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://centralgsm.com.br/politica-de-privacidade',
  },
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#0f172a]/80 border border-[#334155] rounded-3xl p-6 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="mb-10 pb-8 border-b border-[#334155]">
          <span className="text-[#00D2AD] text-xs font-black uppercase tracking-widest bg-[#00D2AD]/10 px-3 py-1.5 rounded-full border border-[#00D2AD]/20">
            Conformidade LGPD & Google Ads
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mt-4">
            POLÍTICA DE <span className="text-[#00D2AD]">PRIVACIDADE</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Última atualização: Outubro de 2026 • Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
          </p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">1.</span> Visão Geral e Compromisso
            </h2>
            <p>
              A <strong>CENTRAL GSM</strong> (denominada nesta política como &quot;nós&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) tem como compromisso prioritário a segurança, a privacidade e a transparência no tratamento dos dados pessoais de seus usuários, clientes e visitantes.
            </p>
            <p className="mt-2">
              Ao acessar o nosso site (<code className="text-[#00D2AD] font-mono">https://centralgsm.com.br</code>), utilizar nossos serviços de aluguel de licenças digitais temporárias, suporte ou criar uma conta de usuário, você declara estar ciente e de acordo com as disposições desta Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">2.</span> Dados Coletados
            </h2>
            <p>Coletamos apenas os dados estritamente necessários para viabilizar o fornecimento dos serviços contratados e garantir a segurança antifraude da plataforma:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-300">
              <li><strong>Dados de Identificação Cadastral:</strong> Nome de usuário, endereço de e-mail e CPF (Cadastro de Pessoas Físicas) para validação fiscal e prevenção a fraudes de pagamento.</li>
              <li><strong>Dados de Pagamento:</strong> Identificadores de transação Pix gerados por gateways bancários autorizados pelo Banco Central (Asaas / Efí Bank). <em>A Central GSM não armazena dados de cartão de crédito.</em></li>
              <li><strong>Dados de Conexão e Navegação:</strong> Endereço IP de acesso, data e hora da conexão, dados do navegador e dispositivo, e cookies essenciais de sessão.</li>
              <li><strong>Dados de Aluguel e Pedidos:</strong> Histórico de ferramentas solicitadas, horários de ativação e expiração de acessos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">3.</span> Finalidade do Tratamento de Dados
            </h2>
            <p>Os dados tratados possuem fundamentação jurídica nas bases legais da LGPD (Art. 7º, incisos II, V e IX):</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-300">
              <li><strong>Execução de Contrato:</strong> Liberação e autenticação das ferramentas digitais e pacotes alugados durante o período contratado.</li>
              <li><strong>Prevenção a Fraudes e Segurança:</strong> Detecção de transações suspeitas, contestações indevidas (chargeback fraudulento) e uso não autorizado de sistemas.</li>
              <li><strong>Atendimento e Suporte Técnico:</strong> Comunicação com o usuário via WhatsApp e e-mail para entrega de credenciais, avisos de expiração e resolução de dúvidas.</li>
              <li><strong>Cumprimento de Obrigação Legal:</strong> Guarda de registros de acesso a aplicações de internet em conformidade com o Art. 15 do Marco Civil da Internet (Lei nº 12.965/2014).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">4.</span> Cookies e Tecnologias de Rastreamento (Google Ads)
            </h2>
            <p>
              Utilizamos cookies essenciais para manter você autenticado em sua conta de forma segura. Também utilizamos tecnologias de medição analítica e conversão do <strong>Google Ads (Tag AW-18049987745)</strong> para mensurar o desempenho de anúncios publicitários.
            </p>
            <p className="mt-2">
              Nenhuma informação de identificação pessoal direta (como CPF ou senhas) é compartilhada com ferramentas de terceiros para publicidade. Você pode configurar seu navegador para desativar cookies a qualquer momento, ciente de que algumas funções da conta podem ser afetadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">5.</span> Compartilhamento de Dados
            </h2>
            <p>
              A Central GSM não vende, não comercializa e não aluga seus dados pessoais. O compartilhamento ocorre única e exclusivamente com:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-300">
              <li><strong>Instituições de Pagamento Credenciadas:</strong> Gateways de pagamento (Asaas Gestão Financeira / Efí S.A.) para liquidação e conciliação do Pix.</li>
              <li><strong>Provedores de Infraestrutura Segura:</strong> Servidores em nuvem de banco de dados (Supabase) e hospedagem (Vercel) com criptografia em trânsito e em repouso.</li>
              <li><strong>Autoridades Policiais ou Judiciais:</strong> Mediante requisição formal ou ordem judicial em casos de apuração de condutas ilícitas ou fraudes eletrônicas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">6.</span> Seus Direitos como Titular (LGPD - Art. 18)
            </h2>
            <p>Conforme previsto na Lei Geral de Proteção de Dados, você tem o direito de solicitar a qualquer momento:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-300">
              <li>Confirmação da existência de tratamento de seus dados pessoais;</li>
              <li>Acesso aos dados coletados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>Revogação do consentimento, ressalvadas as hipóteses legais de retenção obrigatória por prazos prescricionais ou regulatórios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">7.</span> Segurança da Informação
            </h2>
            <p>
              Adotamos protocolos rígidos de segurança, incluindo certificados SSL/TLS (HTTPS) de 256 bits, políticas de controle de acesso por linha no banco de dados (Row Level Security - RLS), rotação automática de credenciais e proteção contra injeções e ataques cibernéticos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">8.</span> Contato com o Encarregado de Dados (DPO)
            </h2>
            <p>
              Para dúvidas, solicitações ou exercer qualquer direito relativo à proteção de seus dados pessoais, entre em contato diretamente com nossa equipe de suporte oficial:
            </p>
            <div className="mt-4 p-4 bg-[#020617] rounded-2xl border border-[#334155] space-y-1 text-xs md:text-sm">
              <p><strong>Responsável:</strong> Equipe de Proteção de Dados Central GSM</p>
              <p><strong>WhatsApp Oficial:</strong> +55 11 96695-9666</p>
              <p><strong>Site:</strong> https://centralgsm.com.br</p>
              <p><strong>Atendimento:</strong> Segunda a Sábado, das 08h às 22h (Horário de Brasília)</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#334155] flex flex-wrap gap-4 items-center justify-between">
          <Link
            href="/"
            className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all"
          >
            ← Voltar para a Página Inicial
          </Link>
          <Link
            href="/termos"
            className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Ver Termos de Uso e Responsabilidade →
          </Link>
        </div>
      </div>
    </div>
  );
}
