import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso e Responsabilidade | Central GSM',
  description: 'Leia atentamente os Termos de Uso e Responsabilidade da plataforma Central GSM. Regras para o aluguel de licenças digitais e manutenção.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://centralgsm.com.br/termos',
  },
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#0f172a]/80 border border-[#334155] rounded-3xl p-6 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="mb-10 pb-8 border-b border-[#334155]">
          <span className="text-[#FFC107] text-xs font-black uppercase tracking-widest bg-[#FFC107]/10 px-3 py-1.5 rounded-full border border-[#FFC107]/20">
            Contrato de Adesão & Condições de Uso
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mt-4">
            TERMOS DE <span className="text-[#00D2AD]">USO E RESPONSABILIDADE</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Última atualização: Outubro de 2026 • Plataforma Central GSM (centralgsm.com.br)
          </p>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">1.</span> Objeto da Plataforma
            </h2>
            <p>
              A <strong>CENTRAL GSM</strong> disponibiliza uma plataforma online destinada a fornecer <strong>aluguel temporário de licenças digitais</strong>, créditos de servidor e suporte técnico para técnicos de manutenção e reparo de smartphones, tablets e dispositivos móveis multimarcas.
            </p>
            <p className="mt-2">
              O serviço consiste exclusivamente na cessão temporária de acesso aos softwares homologados (como UnlockTool, Chimera, Android Multi Tool, TSM Tool, etc.) pelo período determinado no plano ou pacote adquirido (ex: 6 horas, 12 horas, 24 horas ou mensal).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">2.</span> Responsabilidade sobre a Procedência dos Aparelhos
            </h2>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs md:text-sm mb-3">
              <strong>⚠️ AVISO MANDATÓRIO DE PROCEDÊNCIA LEGAL:</strong> É expressamente proibida a utilização de quaisquer ferramentas disponibilizadas pela Central GSM em aparelhos com registro de furto, roubo, perda ou qualquer restrição de ilicitude no banco de dados nacional do CEMI / Anatel.
            </div>
            <p>
              O cliente declara e garante sob as penas da lei que é o legítimo proprietário do dispositivo ou possui autorização expressa do titular (Ordem de Serviço com identificação completa) para a realização de serviços de manutenção, restauração de firmware, reparo de software ou remoção de bloqueios legítimos.
            </p>
            <p className="mt-2">
              A Central GSM <strong>não se responsabiliza</strong> por condutas de terceiros e colaborará irrestritamente com autoridades policiais e judiciais competentes mediante apresentação de dados e registros eletrônicos de acesso caso identificado qualquer uso indevido.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">3.</span> Regras de Utilização das Credenciais
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li><strong>Uso Individual e Intransferível:</strong> As credenciais (e-mail e senha) disponibilizadas para a ferramenta contratada devem ser utilizadas exclusivamente no computador do cliente durante a vigência do aluguel.</li>
              <li><strong>Proibição de Sublocação ou Revenda de Acesso:</strong> É terminantemente proibido compartilhar credenciais em grupos públicos, fóruns ou revendê-las a terceiros.</li>
              <li><strong>Proibição de Alteração de Dados da Conta Oficial:</strong> O usuário não tem permissão para alterar o e-mail cadastrado, método de recuperação ou dados cadastrais nos servidores das ferramentas originais. Qualquer tentativa implicará no bloqueio imediato sem reembolso.</li>
              <li><strong>Renovação Automática de Senha:</strong> Ao final do período contratado, o sistema executa a rotação e atualização de senha, encerrando automaticamente a sessão para o próximo usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">4.</span> Pagamentos, Saldo e Anti-Fraude
            </h2>
            <p>
              Os pagamentos são processados via Pix instantâneo com conciliação automática.
            </p>
            <p className="mt-2">
              <strong>Regra de Tolerância Zero contra Chargeback Fraudulento:</strong> Qualquer contestação indevida de pagamento bancário (alegação falsa de fraude bancária após o consumo do serviço digital ou recarga de saldo) resultará no banimento imediato da conta, cancelamento de acessos vigentes e inclusão do CPF do responsável nos cadastros de proteção e segurança da plataforma, além do acionamento jurídico cabível por estelionato eletrônico.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">5.</span> Garantia de Funcionamento e Suporte
            </h2>
            <p>
              Garantimos a entrega de credenciais válidas e ativas para login nas ferramentas contratadas. Em caso de instabilidade pontual do servidor oficial da ferramenta ou necessidade de intervenção, o suporte oficial prestará auxílio ou fornecerá tempo compensatório correspondente ao período de indisponibilidade comprovada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <span className="text-[#00D2AD]">6.</span> Canal de Suporte e Foro
            </h2>
            <p>
              Dúvidas ou solicitações técnicas podem ser encaminhadas diretamente ao nosso canal oficial no WhatsApp: <strong>+55 11 96695-9666</strong>.
            </p>
            <p className="mt-2">
              Fica eleito o Foro da Comarca de domicílio do consumidor ou, na forma da legislação aplicável, os mecanismos de mediação extrajudicial para a resolução de controvérsias decorrentes destes Termos.
            </p>
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
            href="/politica-de-privacidade"
            className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Ver Política de Privacidade (LGPD) →
          </Link>
        </div>
      </div>
    </div>
  );
}
