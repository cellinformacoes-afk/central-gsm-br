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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        const userPlan = localStorage.getItem(`userPlan_${session.user.id}`);
        if (userPlan) {
          setPlan(userPlan);
          setLoading(false);
          
          // Protect downloads route for basic plan
          if (pathname === '/planos/dashboard/downloads' && userPlan !== 'premium') {
            router.push('/planos/dashboard/frp');
          }
        } else {
          router.push('/planos');
        }
      } else {
        router.push('/login');
      }
    });
  }, [router, pathname]);

  if (loading) return <div className="h-screen flex items-center justify-center text-white"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  const links = [
    { name: 'FRP (Desbloqueio)', href: '/planos/dashboard/frp', icon: '📱' },
    { name: 'MDM (Desbloqueio)', href: '/planos/dashboard/mdm', icon: '🔒' },
    ...(plan === 'premium' ? [{ name: 'Downloads Extras', href: '/planos/dashboard/downloads', icon: '💾' }] : []),
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[70vh]">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        {/* Plan Info */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D2AD]/20 to-[#009077]/20 border border-[#00D2AD]/30 flex items-center justify-center text-xl">
            {plan === 'premium' ? '👑' : '⭐'}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seu Plano</p>
            <p className={`text-sm font-black uppercase ${plan === 'premium' ? 'text-[#00D2AD]' : 'text-white'}`}>
              {plan === 'premium' ? 'Premium' : 'Básico'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-2 flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname?.startsWith(link.href);
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
            <button 
              onClick={() => router.push('/planos')}
              className="w-full py-2 bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(0,210,173,0.3)]"
            >
              Fazer Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
