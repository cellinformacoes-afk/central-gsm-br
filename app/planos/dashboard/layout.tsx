"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PlanosDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<any>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Fetch plan from database with safety fallback
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan, plan_expiration_date, role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.log('Note: Database plan check failed:', profileError.message);
        }

        const userPlan = profile?.plan || 'free';
        const expiration = profile?.plan_expiration_date;
        const userRole = profile?.role || 'user';
        
        // 1. Check for expiration
        if (userPlan !== 'free' && expiration) {
          const now = new Date();
          const expDate = new Date(expiration);
          
          if (now > expDate) {
            console.log('Dashboard: Plan expired. Resetting to free.');
            await supabase.from('profiles').update({ plan: 'free' }).eq('id', session.user.id);
            router.push('/planos');
            return;
          }
        }

        let days = null;
        if (userPlan !== 'free' && expiration) {
          const now = new Date();
          const expDate = new Date(expiration);
          const diffTime = expDate.getTime() - now.getTime();
          days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        setPlan(userPlan);
        setRole(userRole);
        setExpiryDate(expiration);
        setDaysRemaining(days);
        setLoading(false);
        
        // Protect downloads route for basic plan and non-admin
        if (pathname === '/planos/dashboard/downloads' && userPlan !== 'premium' && userRole !== 'admin') {
          router.push('/planos/dashboard/frp');
        }
      } else {
        router.push('/login');
      }
    }

    checkAccess();
  }, [router, pathname]);

  if (loading) return <div className="h-screen flex items-center justify-center text-white"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  // Render navigation links
  // Fetch user role if profile is available (we can do a simple client-side check if we had user role state, but since we didn't add userRole state, let's keep it simple or check plan)
  // Wait, let's check if we can store role in state or check directly. Since we don't have a role state, let's add one or use session/db check.
  // Wait! Let's add a [role, setRole] state to layout.tsx!
  // Yes, adding const [role, setRole] = useState<string | null>(null); makes it easy to check in links array.

  type NavLink = {
  name: string;
  href: string;
  icon: string;
  disabled?: boolean;
};

const links: NavLink[] = [
    { name: 'FRP (Desbloqueio)', href: '/planos/dashboard/frp', icon: '📱' },
    { name: 'MDM (Desbloqueio)', href: '/planos/dashboard/mdm', icon: '🔒' },
    { 
      name: 'Downloads Extras', 
      href: '/planos/dashboard/downloads', 
      icon: '💾',
      disabled: plan !== 'premium' && role !== 'admin'
    },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[70vh]">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        {/* Plan Info */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D2AD]/20 to-[#009077]/20 border border-[#00D2AD]/30 flex items-center justify-center text-xl shrink-0">
              {plan === 'premium' ? '👑' : '⭐'}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seu Plano</p>
              <p className={`text-sm font-black uppercase ${plan === 'premium' ? 'text-[#00D2AD]' : 'text-white'}`}>
                {plan === 'premium' ? 'Premium' : plan === 'basico' ? 'Básico' : 'Gratuito'}
              </p>
              {expiryDate && plan !== 'free' && (
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  Validade: {new Date(expiryDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {plan !== 'free' && daysRemaining !== null && (
            <div className="pt-2 border-t border-white/5 w-full">
              <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold mb-1">
                <span>{daysRemaining === 1 ? 'Resta 1 dia' : `Restam ${daysRemaining} dias`}</span>
                <span>30 dias</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    daysRemaining <= 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#00D2AD]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (daysRemaining / 30) * 100))}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-500 mt-1 font-semibold text-center">
                Faltam {daysRemaining} dias para renovação
              </p>
            </div>
          )}
        </div>

        {/* Warning Banner when close to expiry */}
        {plan !== 'free' && daysRemaining !== null && daysRemaining <= 5 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center animate-pulse duration-[3000ms]">
            <p className="text-xs text-red-200 font-bold mb-2 flex items-center justify-center gap-1.5">
              ⚠️ Renovação Próxima
            </p>
            <p className="text-[11px] text-gray-300 font-medium mb-3 leading-relaxed">
              Seu plano vence em {daysRemaining === 1 ? '1 dia' : `${daysRemaining} dias`}. Renove agora para não perder o acesso!
            </p>
            <Link 
              href="/planos?upgrade=true"
              className="block w-full py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg text-xs uppercase tracking-widest transition-all text-center shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105"
            >
              Renovar Plano
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            if ('disabled' in link && link.disabled) {
              return (
                <button 
                  key={link.name}
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm text-gray-400/50 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all text-left group/lock cursor-pointer"
                >
                  <span className="text-lg opacity-60 group-hover/lock:scale-110 transition-transform">{link.icon}</span>
                  <span className="line-through">{link.name}</span>
                  <span className="ml-auto text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                    🔒 PREMIUM
                  </span>
                </button>
              )
            }
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-[#00D2AD]/10 text-[#00D2AD] border border-[#00D2AD]/20 shadow-[0_0_15px_rgba(0,210,173,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.name}
              </Link>
            )
          })}
        </nav>

        {plan !== 'premium' && (
          <div className="bg-gradient-to-br from-[#00D2AD]/10 to-transparent border border-[#00D2AD]/20 rounded-2xl p-4 text-center mt-auto">
            <p className="text-sm text-gray-300 font-medium mb-3">
              Quer acesso ilimitado aos arquivos de download?
            </p>
            <Link 
              href="/planos?upgrade=true"
              className="block w-full py-2 bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] font-black rounded-lg text-xs uppercase tracking-widest transition-all text-center shadow-[0_0_15px_rgba(0,210,173,0.3)] hover:scale-105"
            >
              Fazer Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 min-h-[500px]">
        {children}
      </div>

      {/* Pop-up Modal Premium Upgrade */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
          <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-2 border-[#00D2AD] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,210,173,0.25)] animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00D2AD]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#009077]/10 rounded-full blur-3xl"></div>
            
            {/* Top Banner Ribbon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#00D2AD] text-[#0f172a] text-[10px] font-black px-6 py-1 rounded-b-xl uppercase tracking-widest">
              👑 PREMIUM UPGRADE
            </div>

            <div className="flex justify-between items-start mb-6 mt-2 relative z-10">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Liberar Downloads Extras
              </h3>
              <button 
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-4 mb-6 relative z-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#00D2AD]/20 to-[#009077]/20 border border-[#00D2AD]/30 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(0,210,173,0.2)]">
                💾
              </div>
              <p className="text-gray-200 font-bold text-base leading-relaxed">
                Seja Premium para liberar downloads!
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Obtenha acesso ilimitado a todos os arquivos Miskidata Realme, drivers e ferramentas por apenas mais:
              </p>
              <div className="py-3 px-4 bg-[#00D2AD]/5 border border-[#00D2AD]/20 rounded-2xl inline-block">
                <span className="text-2xl font-black text-[#00D2AD]">
                  {plan === 'basico' ? 'R$ 70,00' : 'R$ 199,99/mês'}
                </span>
                {plan === 'basico' && (
                  <span className="text-[10px] block text-gray-400 font-semibold mt-0.5">
                    (Diferença do plano atual)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <Link
                href="/planos?upgrade=true"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full py-4 bg-gradient-to-r from-[#00D2AD] to-[#009077] hover:from-[#00BDA0] hover:to-[#007F69] text-[#0f172a] font-black rounded-xl uppercase tracking-wider text-center transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                🚀 Fazer Upgrade Agora
              </Link>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold rounded-xl uppercase tracking-wider transition-all text-xs"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
