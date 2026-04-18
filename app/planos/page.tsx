"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function PlanosContent() {
  const [session, setSession] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpgrade = searchParams.get('upgrade') === 'true';

  useEffect(() => {
    async function checkPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Prioritize database plan
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.log('Note: Database plan check failed, defaulting to free:', profileError.message);
        }

        const userPlan = profile?.plan || 'free';
        setCurrentPlan(userPlan);
        console.log('PlanosPage: currentPlan =', userPlan);
        
        if (userPlan !== 'free' && !isUpgrade) {
          console.log('PlanosPage: Redirecting to dashboard...');
          router.push('/planos/dashboard/frp');
        } else {
          console.log('PlanosPage: Showing plans table.');
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    }

    checkPlan();
  }, [router, isUpgrade]);

  const handleSubscribe = async (plan: string) => {
    if (!session) return;
    
    setLoading(true);
    try {
      // 1. Update Database (Supabase)
      const { error } = await supabase
        .from('profiles')
        .update({ plan: plan })
        .eq('id', session.user.id);

      if (error) throw error;

      // 2. Clear localStorage (deprecated)
      localStorage.removeItem(`userPlan_${session.user.id}`);
      
      alert(`Parabéns! Você assinou o Plano ${plan === 'premium' ? 'Premium' : 'Básico'}.`);
      router.push('/planos/dashboard/frp');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao processar assinatura: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
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
              <span className="text-4xl font-black text-white">R$ 9,99</span>
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
              } else {
                handleSubscribe('basico');
              }
            }}
            className={`w-full py-4 rounded-xl font-bold border transition-all uppercase tracking-wider ${
              currentPlan === 'basico' || currentPlan === 'premium'
                ? 'bg-[#00D2AD]/10 text-[#00D2AD] border-[#00D2AD]/30 hover:bg-[#00D2AD]/20'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            {currentPlan === 'basico' || currentPlan === 'premium' ? 'Acessar Dashboard' : 'Assinar Básico'}
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
              <span className="text-5xl font-black text-white">R$ 149,99</span>
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
              } else {
                handleSubscribe('premium');
              }
            }}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
              currentPlan === 'premium'
                ? 'bg-[#00D2AD]/20 text-[#00D2AD] border border-[#00D2AD]/30 hover:bg-[#00D2AD]/30 shadow-[0_0_20px_rgba(0,210,173,0.1)]'
                : 'bg-gradient-to-r from-[#00D2AD] to-[#009077] hover:from-[#00BDA0] hover:to-[#007F69] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:shadow-[0_0_30px_rgba(0,210,173,0.5)] hover:scale-[1.02]'
            }`}
          >
            {currentPlan === 'premium' ? 'Acessar Dashboard' : 'Assinar Premium'}
          </button>
        </div>
      </div>
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
