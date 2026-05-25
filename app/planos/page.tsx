"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function PlanosContent() {
  const [session, setSession] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpgrade = searchParams.get('upgrade') === 'true';

  useEffect(() => {
    async function checkPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // 1. Get current plan and balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, balance')
          .eq('id', session.user.id)
          .single();

        const userPlan = profile?.plan || 'free';
        setCurrentPlan(userPlan);
        setBalance(profile?.balance || 0);
        
        // 2. Check for pending requests
        const { data: requests } = await supabase
          .from('plan_purchase_requests')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', 'pending')
          .limit(1);

        if (requests && requests.length > 0) {
          setPendingPlan(true);
        }

        if (userPlan !== 'free' && !isUpgrade) {
          router.push('/planos/dashboard/frp');
        } else {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    }

    checkPlan();
  }, [router, isUpgrade]);

  const getPlanCost = (plan: string) => {
    if (plan === 'premium' && currentPlan === 'basico') {
      return 70.00;
    }
    return plan === 'premium' ? 199.99 : 129.99;
  };

  const handlePlanAction = (plan: string) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSubscribeAuto = async () => {
    if (!session || !selectedPlan) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('purchase_plan_with_balance', {
        p_user_id: session.user.id,
        p_plan_name: selectedPlan
      });

      if (error) throw error;
      if (data.success === false) {
        alert(data.error);
        return;
      }

      alert("Plano assinado e ativado com sucesso!");
      setIsModalOpen(false);
      // Recarregar a página ou empurrar para o painel
      router.push('/planos/dashboard/frp');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao processar ativação: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribeManual = async () => {
    if (!session || !selectedPlan) return;
    const cost = getPlanCost(selectedPlan);

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_plan_purchase_request', {
        p_plan_name: selectedPlan,
        p_cost: cost
      });

      if (error) throw error;
      if (data.success === false) {
        alert(data.error);
        return;
      }
      
      setPendingPlan(true);
      setIsModalOpen(false);
      alert(`Solicitação enviada com sucesso! O administrador irá revisar seu pedido em breve.`);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao processar solicitação: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="text-center mb-16 animate-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 capitalize">
          Nossos Planos
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Tenha acesso aos melhores métodos de desbloqueio FRP e MDM do mercado.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Plano Básico */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-[#00D2AD]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-2">Básico</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">R$ 129,99</span>
              <span className="text-gray-400 font-medium">/mês</span>
            </div>
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-gray-300 text-sm font-medium">Acesso a todos os métodos</span>
            </div>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-gray-300 text-sm font-medium">Desbloqueio FRP</span>
            </div>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-gray-300 text-sm font-medium">Desbloqueio MDM</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span className="text-gray-400 text-sm font-medium line-through">Sem acesso a arquivos (Download)</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (currentPlan === 'basico' || currentPlan === 'premium') {
                router.push('/planos/dashboard/frp');
              } else if (!pendingPlan) {
                handlePlanAction('basico');
              }
            }}
            disabled={pendingPlan && (currentPlan !== 'basico' && currentPlan !== 'premium')}
            className={`w-full py-4 rounded-xl font-bold border transition-all uppercase tracking-wider ${
              currentPlan === 'basico' || currentPlan === 'premium'
                ? 'bg-[#00D2AD]/10 text-[#00D2AD] border-[#00D2AD]/30 hover:bg-[#00D2AD]/20'
                : pendingPlan 
                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 cursor-not-allowed'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            {currentPlan === 'basico' || currentPlan === 'premium' 
              ? 'Acessar meu plano' 
              : pendingPlan ? 'Aguardando Aprovação' : 'Solicitar Básico'}
          </button>
        </div>

        {/* Plano Premium */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-2 border-[#00D2AD] rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(0,210,173,0.15)] group scale-105 z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2AD]/10 rounded-full blur-3xl group-hover:bg-[#00D2AD]/20 transition-all"></div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#00D2AD] text-[#0f172a] text-xs font-black px-4 py-1 rounded-b-lg uppercase tracking-widest">
            Mais Vantajoso
          </div>

          <div className="mb-8 mt-4">
            <h2 className="text-2xl font-black text-[#00D2AD] mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#FFC107]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Premium
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">R$ 199,99</span>
              <span className="text-gray-400 font-medium">/mês</span>
            </div>
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-white text-sm font-medium">Acesso a todos os métodos</span>
            </div>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-white text-sm font-medium">Desbloqueio FRP</span>
            </div>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span className="text-white text-sm font-medium">Desbloqueio MDM</span>
            </div>
            <div className="flex items-center gap-3 bg-[#00D2AD]/10 p-2 rounded-lg border border-[#00D2AD]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span className="text-[#00D2AD] text-sm font-black uppercase">Download Ilimitado de Arquivos</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (currentPlan === 'premium') {
                router.push('/planos/dashboard/frp');
              } else if (!pendingPlan) {
                handlePlanAction('premium');
              }
            }}
            disabled={pendingPlan && currentPlan !== 'premium'}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
              currentPlan === 'premium'
                ? 'bg-[#00D2AD]/20 text-[#00D2AD] border border-[#00D2AD]/30 hover:bg-[#00D2AD]/30 shadow-[0_0_20px_rgba(0,210,173,0.1)]'
                : pendingPlan
                  ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00D2AD] to-[#009077] hover:from-[#00BDA0] hover:to-[#007F69] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:shadow-[0_0_30px_rgba(0,210,173,0.5)] hover:scale-[1.02]'
            }`}
          >
            {currentPlan === 'premium' 
              ? 'Acessar meu plano' 
              : pendingPlan ? 'Aguardando Aprovação' : 'Solicitar Premium'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Compra */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
          <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,210,173,0.15)] animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                {selectedPlan === 'premium' ? '👑' : '⭐'} Confirmar Assinatura
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-4 mb-6 relative z-10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plano Selecionado</p>
                <p className="text-lg font-black text-white capitalize">{selectedPlan === 'basico' ? 'Básico' : 'Premium'}</p>
                <p className="text-2xl font-black text-[#00D2AD] mt-1">
                  R$ {getPlanCost(selectedPlan).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {selectedPlan === 'premium' && currentPlan === 'basico' && (
                  <p className="text-[10px] text-[#00D2AD] font-black mt-1.5 uppercase tracking-wider bg-[#00D2AD]/10 py-1 px-2 rounded border border-[#00D2AD]/20 inline-block">
                    ✨ Upgrade Básico → Premium (Paga a diferença)
                  </p>
                )}
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Seu Saldo em Conta</p>
                  <p className="text-lg font-black text-white">
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {balance >= getPlanCost(selectedPlan) ? (
                  <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full font-black uppercase tracking-wider">
                    Saldo Suficiente
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full font-black uppercase tracking-wider">
                    Saldo Insuficiente
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              {balance >= getPlanCost(selectedPlan) ? (
                <button
                  onClick={handleSubscribeAuto}
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-[#00D2AD] to-[#009077] hover:from-[#00BDA0] hover:to-[#007F69] text-[#0f172a] font-black rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin text-lg">⚙</span> Processando...
                    </>
                  ) : (
                    <>
                      <span>💳</span> Assinar com Saldo (Ativação Instantânea)
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/saldo"
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98] text-center flex items-center justify-center gap-2"
                >
                  <span>⚡</span> Adicionar Saldo via Pix
                </Link>
              )}

              <button
                onClick={handleSubscribeManual}
                disabled={submitting}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl uppercase tracking-wider transition-all text-xs"
              >
                {submitting ? 'Enviando Solicitação...' : 'Solicitar Manualmente (Aguardar Aprovação)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-white"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>}>
      <PlanosContent />
    </Suspense>
  );
}
