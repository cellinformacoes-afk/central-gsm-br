"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlanosPage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; label: string; cost: number } | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchExistingRequest(session.user.id);
      } else {
        setLoadingRequest(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchExistingRequest(session.user.id);
      } else {
        setProfile(null);
        setExistingRequest(null);
        setLoadingRequest(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  }

  async function fetchExistingRequest(userId: string) {
    setLoadingRequest(true);
    try {
      // Fetch the most recent approved or pending plan request for this user
      const { data, error } = await supabase
        .from("plan_purchase_requests")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["approved", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingRequest(data);
      } else {
        setExistingRequest(null);
      }
    } catch (err) {
      console.error("Error fetching existing plan request:", err);
      setExistingRequest(null);
    }
    setLoadingRequest(false);
  }

  const handleOpenPurchase = (plan: { name: string; label: string; cost: number }) => {
    if (!session) {
      alert("Você precisa estar logado para adquirir um plano. Redirecionando para a página de login...");
      router.push("/login?redirect=/planos");
      return;
    }

    // Check if user already has an active (approved) plan
    if (existingRequest?.status === "approved") {
      router.push("/");
      return;
    }

    // Check if user already has a pending request
    if (existingRequest?.status === "pending") {
      alert("Você já possui uma solicitação de plano pendente! Aguarde a aprovação do administrador.\n\nCaso precise de ajuda, entre em contato com o suporte.");
      return;
    }

    setSelectedPlan(plan);
    setAcceptedTerms(false);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan || !session) return;
    if (!acceptedTerms) {
      alert("Você deve aceitar os Termos de Uso e Responsabilidade para prosseguir.");
      return;
    }

    setPurchaseLoading(true);

    try {
      // 1. Fetch user IP address client-side
      let userIp = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        if (ipData && ipData.ip) {
          userIp = ipData.ip;
        }
      } catch (ipErr) {
        console.warn("Could not fetch user IP for terms log:", ipErr);
      }

      const termsAcceptedAt = new Date().toISOString();
      const termsAcceptedVersion = "v1.0";

      // 2. Call RPC to create the plan purchase request
      const { data: result, error: rpcError } = await supabase.rpc("create_plan_purchase_request", {
        p_plan_name: selectedPlan.name,
        p_cost: selectedPlan.cost,
      });

      if (rpcError) throw rpcError;

      // 3. Save terms acceptance in profiles (fails gracefully if migration not applied)
      const { error: termsError } = await supabase.from("profiles").update({
        terms_accepted_at: termsAcceptedAt,
        terms_accepted_ip: userIp,
        terms_accepted_version: termsAcceptedVersion
      }).eq("id", session.user.id);

      if (termsError) {
        console.warn("Could not update profiles terms cols:", termsError);
      }

      // 4. Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          terms_accepted_at: termsAcceptedAt,
          terms_accepted_ip: userIp,
          terms_accepted_version: termsAcceptedVersion,
        }
      });

      alert(`Solicitação de plano ${selectedPlan.label} criada com sucesso! Aguarde a aprovação do administrador.`);
      setSelectedPlan(null);
      router.push("/pedidos");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao solicitar plano: " + (err.message || "Erro desconhecido"));
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Title */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#00D2AD]/10 blur-[100px] rounded-full"></div>
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tight mb-4">
          Nossos <span className="text-[#00D2AD] drop-shadow-[0_0_15px_rgba(0,210,173,0.4)]">Planos</span>
        </h1>
        <p className="text-gray-400 font-medium text-lg max-w-xl mx-auto">
          Tenha acesso aos melhores métodos de desbloqueio FRP e MDM do mercado.
        </p>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Basic Plan */}
        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-2xl border border-[#334155] flex flex-col justify-between hover:shadow-[0_0_40px_rgba(0,210,173,0.05)] hover:-translate-y-2 hover:border-[#334155]/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/2 blur-[50px] rounded-full"></div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Básico</h3>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-4xl font-black text-[#00D2AD]">R$ 129,99</span>
              <span className="text-gray-500 font-bold text-sm">/mês</span>
            </div>

            <ul className="space-y-4 mb-8 text-sm font-semibold">
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Acesso aos métodos disponíveis.
              </li>
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Atualizações durante a vigência da assinatura.
              </li>
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Novos métodos adicionados durante a assinatura.
              </li>
              <li className="flex items-start gap-2 text-red-400 opacity-60">
                <span className="shrink-0">❌</span> Arquivos especiais não inclusos.
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleOpenPurchase({ name: "basico", label: "Básico", cost: 129.99 })}
            className={`w-full font-black py-4 rounded-xl transition-all uppercase tracking-wider text-xs ${
              existingRequest?.status === 'approved' && existingRequest?.plan_name === 'basico'
                ? 'bg-green-500/20 text-green-500 border border-green-500 cursor-default'
                : existingRequest?.status === 'pending' && existingRequest?.plan_name === 'basico'
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500 cursor-default animate-pulse'
                : 'bg-[#1e293b] hover:bg-[#00D2AD] hover:text-[#0f172a] hover:shadow-[0_4px_20px_rgba(0,210,173,0.3)] text-[#00D2AD] border border-[#00D2AD]'
            }`}
          >
            {existingRequest?.status === 'approved' && existingRequest?.plan_name === 'basico' ? 'PLANO ATIVO' : 
             existingRequest?.status === 'pending' && existingRequest?.plan_name === 'basico' ? 'AGUARDANDO APROVAÇÃO' : 
             'ACESSAR MEU PLANO'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-2xl border-2 border-[#00D2AD] flex flex-col justify-between hover:shadow-[0_0_40px_rgba(0,210,173,0.15)] hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/10 blur-[50px] rounded-full"></div>
          <div className="absolute top-4 right-4 bg-[#00D2AD] text-[#0f172a] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Mais Vantajoso
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter flex items-center gap-2">
              ⭐ Premium
            </h3>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-4xl font-black text-[#00D2AD]">R$ 199,99</span>
              <span className="text-gray-500 font-bold text-sm">/mês</span>
            </div>

            <ul className="space-y-4 mb-8 text-sm font-semibold">
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Acesso aos métodos disponíveis.
              </li>
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Atualizações durante a vigência da assinatura.
              </li>
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Novos métodos adicionados durante a assinatura.
              </li>
              <li className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 shrink-0">✔</span> Arquivos compatíveis incluídos.
              </li>
              <li className="flex items-start gap-2 text-[#00D2AD]">
                <span className="shrink-0">✔</span> Download dos arquivos disponibilizados na plataforma.
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleOpenPurchase({ name: "premium", label: "Premium", cost: 199.99 })}
            className={`w-full font-black py-4 rounded-xl transition-all uppercase tracking-wider text-xs ${
              existingRequest?.status === 'approved' && existingRequest?.plan_name === 'premium'
                ? 'bg-green-500/20 text-green-500 border border-green-500 cursor-default'
                : existingRequest?.status === 'pending' && existingRequest?.plan_name === 'premium'
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500 cursor-default animate-pulse'
                : 'bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] shadow-[0_4px_25px_rgba(0,210,173,0.3)] hover:shadow-[0_4px_35px_rgba(0,210,173,0.5)]'
            }`}
          >
            {existingRequest?.status === 'approved' && existingRequest?.plan_name === 'premium' ? 'PLANO ATIVO' : 
             existingRequest?.status === 'pending' && existingRequest?.plan_name === 'premium' ? 'AGUARDANDO APROVAÇÃO' : 
             'ACESSAR MEU PLANO'}
          </button>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Info Planos */}
        <div className="bg-[#1e293b]/50 border border-[#334155]/60 rounded-3xl p-6 md:p-8">
          <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-4 flex items-center gap-2">
            📋 Informações dos Planos
          </h4>
          <div className="space-y-4 text-sm text-gray-300 font-medium">
            <p>
              <strong className="text-white">Assinatura Mensal:</strong> Todos os planos funcionam através de assinatura mensal. Ao término do período contratado, o acesso poderá ser suspenso caso a renovação não seja realizada.
            </p>
            <div className="border-t border-[#334155]/50 pt-4">
              <h5 className="text-white font-bold mb-2">Benefícios para assinantes ativos:</h5>
              <ul className="space-y-1.5 list-none pl-1">
                <li><span className="text-[#00D2AD] mr-1">✔</span> Atualizações constantes dos métodos.</li>
                <li><span className="text-[#00D2AD] mr-1">✔</span> Inclusão de novos modelos e procedimentos.</li>
                <li><span className="text-[#00D2AD] mr-1">✔</span> Correções e melhorias nos conteúdos existentes.</li>
                <li><span className="text-[#00D2AD] mr-1">✔</span> Acesso às novidades adicionadas na plataforma.</li>
              </ul>
              <p className="mt-2 text-xs text-gray-400 italic">
                Caso a assinatura não seja renovada, o usuário perderá acesso às atualizações e novos conteúdos disponibilizados após o vencimento.
              </p>
            </div>
            <div className="border-t border-[#334155]/50 pt-4">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300 uppercase text-[10px] block mb-1">Nota sobre arquivos:</strong> Caso determinado procedimento exija arquivos adicionais fora do escopo padrão, no Plano Básico estes deverão ser adquiridos separadamente.
              </p>
            </div>
          </div>
        </div>

        {/* Conteudo e Suporte */}
        <div className="bg-[#1e293b]/50 border border-[#334155]/60 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-4 flex items-center gap-2">
              📚 Conteúdo da Plataforma
            </h4>
            <p className="text-sm text-gray-300 font-medium mb-6 leading-relaxed">
              A plataforma foi desenvolvida para técnicos e usuários que já possuem conhecimento básico em desbloqueios FRP, MDM e procedimentos relacionados. <strong className="text-white">Não oferecemos treinamento individual ou acompanhamento personalizado para iniciantes.</strong> Todos os métodos são disponibilizados em formato de passo a passo detalhado.
            </p>
          </div>

          <div className="border-t border-[#334155]/50 pt-4">
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-3 flex items-center gap-2">
              📞 Suporte via WhatsApp
            </h4>
            <p className="text-sm text-gray-300 font-medium leading-relaxed mb-3">
              Suporte limitado exclusivamente para dúvidas relacionadas aos conteúdos da plataforma. Atendimento realizado por ordem de chegada.
            </p>
            <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-4 flex justify-around text-center">
              <div>
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Horário Tarde</span>
                <span className="text-[#00D2AD] font-bold text-sm">🕐 13:00 às 14:30</span>
              </div>
              <div className="w-px bg-[#334155]"></div>
              <div>
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Horário Noite</span>
                <span className="text-[#00D2AD] font-bold text-sm">🕗 20:00 às 21:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Termos e Responsabilidades Completo */}
      <div className="bg-[#1e293b]/50 border border-[#334155]/60 rounded-3xl p-6 md:p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Responsabilidade */}
          <div>
            <h4 className="text-lg font-black text-[#FFC107] uppercase italic tracking-tight mb-4 flex items-center gap-2">
              ⚠️ Termo de Responsabilidade
            </h4>
            <p className="text-xs text-gray-400 mb-4 uppercase font-bold tracking-wider">
              Ao contratar qualquer plano, o usuário declara estar ciente de que:
            </p>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium list-disc pl-4">
              <li>Possui conhecimento básico sobre desbloqueios e procedimentos técnicos.</li>
              <li>É responsável pela execução dos métodos disponibilizados.</li>
              <li>Nem todos os aparelhos possuem o mesmo comportamento durante os procedimentos.</li>
              <li>O resultado pode variar conforme versão de software, atualização do fabricante, estado do aparelho ou fatores externos.</li>
              <li>O suporte fornecido possui horários limitados.</li>
              <li>O pagamento refere-se ao acesso ao conteúdo disponibilizado na plataforma e não à garantia de sucesso em todos os procedimentos.</li>
              <li>Não são realizados acessos remotos obrigatórios ou suporte individual ilimitado.</li>
            </ul>
          </div>

          {/* Propriedade Intelectual */}
          <div>
            <h4 className="text-lg font-black text-red-400 uppercase italic tracking-tight mb-4 flex items-center gap-2">
              🚫 Propriedade Intelectual
            </h4>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-4">
              <span className="text-[10px] text-red-400 font-black uppercase tracking-wider block mb-2">É expressamente proibido:</span>
              <ul className="space-y-1.5 text-xs text-gray-300 font-medium">
                <li>❌ Gravar a tela da plataforma para fins comerciais.</li>
                <li>❌ Revender métodos, arquivos ou conteúdos.</li>
                <li>❌ Compartilhar login e senha de acesso.</li>
                <li>❌ Reproduzir ou distribuir o conteúdo sem autorização.</li>
              </ul>
            </div>
            <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-4">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">O descumprimento poderá resultar em:</span>
              <ul className="space-y-1 text-xs text-red-400 font-bold uppercase">
                <li>• Banimento permanente da plataforma.</li>
                <li>• Remoção dos grupos de suporte.</li>
                <li>• Cancelamento da assinatura sem reembolso.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] max-w-xl w-full rounded-[40px] border border-[#00D2AD]/50 shadow-[0_0_50px_rgba(0,210,173,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-[#00D2AD] font-black uppercase tracking-[0.2em]">Solicitação de Assinatura</span>
                  <h3 className="text-3xl font-black text-white uppercase italic mt-1">Plano {selectedPlan.label}</h3>
                </div>
                <button onClick={() => setSelectedPlan(null)} className="text-gray-500 hover:text-white text-3xl font-bold leading-none">
                  ×
                </button>
              </div>

              <div className="bg-[#0f172a] p-5 rounded-2xl border border-[#334155] flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase text-xs">Valor da Assinatura:</span>
                <span className="text-[#00D2AD] text-2xl font-black">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedPlan.cost)}
                  <span className="text-xs text-gray-500 font-bold"> /mês</span>
                </span>
              </div>

              {/* Quick Terms Summary */}
              <div className="space-y-3">
                <h5 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Declaração de Aceite de Termos</h5>
                <div className="bg-[#112328] border border-[#00D2AD]/20 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar space-y-3">
                  <p>
                    <strong>Responsabilidade Técnica:</strong> O usuário declara possuir conhecimento básico para execução dos procedimentos técnicos disponibilizados e assume total responsabilidade por sua execução.
                  </p>
                  <p>
                    <strong>Suporte & Resultados:</strong> Nem todos os aparelhos possuem o mesmo comportamento. O suporte é limitado aos horários definidos (13h-14h30 e 20h-21h30) e não há garantia de sucesso absoluto em todos os aparelhos ou reembolso de pagamentos por insucesso técnico individual.
                  </p>
                  <p>
                    <strong>Propriedade Intelectual:</strong> É expressamente proibida a gravação de tela, revenda de métodos ou compartilhamento de conta, passível de banimento permanente sem reembolso.
                  </p>
                </div>
              </div>

              {/* Mandatory Checkbox */}
              <div className="border-2 border-dashed border-[#00D2AD]/40 bg-[#00D2AD]/5 rounded-2xl p-5">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-600 text-[#00D2AD] focus:ring-[#00D2AD] bg-[#0f172a] mt-0.5 transition-all shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-200 font-bold group-hover:text-white transition-colors leading-relaxed select-none">
                    Declaro que <strong className="text-[#00D2AD] underline decoration-[#00D2AD]">Li e concordo</strong> integralmente com os Termos de Uso, Responsabilidade e Propriedade Intelectual da plataforma.
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-[#151e2e] p-6 border-t border-[#334155] flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-white py-4 rounded-xl font-bold uppercase text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={purchaseLoading || !acceptedTerms}
                className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-all flex justify-center items-center gap-2 ${
                  acceptedTerms
                    ? "bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] shadow-[0_4px_20px_rgba(0,210,173,0.3)]"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                {purchaseLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#0f172a]/30 border-t-[#0f172a] rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  "Confirmar Assinatura"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
