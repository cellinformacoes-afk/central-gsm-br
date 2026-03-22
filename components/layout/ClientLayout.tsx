"use client";
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingResets, setPendingResets] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
      if (data.role === 'admin') fetchPendingResets();
    }
  }

  async function fetchPendingResets() {
    // Chamar o monitor primeiro para garantir que está atualizado
    await supabase.rpc('monitor_rental_expiration');
    
    // Contar pendentes
    const { count } = await supabase
      .from('service_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_reset');
    
    setPendingResets(count || 0);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
        {/* Sticky Navbar */}
        <header className="sticky top-0 z-50 w-full bg-[#1e293b]/90 backdrop-blur-md border-b border-[#334155] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Mobile Menu Button */}
            {session && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                )}
              </button>
            )}

            {/* Logo */}
            <Link href="/" className={`flex flex-col justify-center flex-1 md:flex-none ${session ? 'ml-2' : ''} md:ml-0`}>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-[#00D2AD]/20 rounded-md border-2 border-[#00D2AD] flex items-center justify-center relative overflow-hidden shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 w-4 h-4 md:w-5 md:h-5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                 </div>
                 <div className="flex flex-col overflow-hidden">
                    <div className="flex items-baseline overflow-hidden">
                      <span className="text-white font-black text-sm md:text-xl italic tracking-tight uppercase truncate">JACKSON & ISRAEL [V2]</span>
                      <span className="text-[#00D2AD] font-black text-sm md:text-xl italic ml-1 drop-shadow-[0_0_5px_rgba(0,210,173,0.5)]">GSM</span>
                    </div>
                    <span className="text-[#00D2AD] text-[8px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] mt-0.5 truncate uppercase">ALUGUEL DE BOX DIGITAL</span>
                 </div>
              </div>
            </Link>

            {/* Navigation Desktop */}
            {session && (
              <nav className="hidden md:flex items-center gap-6">
                 <Link href="/" className="text-sm font-medium text-white hover:text-[#00D2AD] transition-colors">Início</Link>
                 <Link href="/pedidos" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Meus Pedidos</Link>
                 <Link href="/saldo" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Adicionar Saldo</Link>
                 <Link href="/extrato" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Ver Extrato</Link>
                 <Link href="/suporte" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Suporte</Link>
                 {profile?.role === 'admin' && (
                   <div className="flex items-center gap-2">
                     <Link href="/admin/estoque" className="text-[10px] md:text-xs font-black text-gray-400 hover:text-[#FFC107] transition-all bg-white/5 px-2 md:px-3 py-1.5 rounded-lg border border-white/10 uppercase">
                       Estoque
                     </Link>
                     <Link href="/admin/servicos" className="text-[10px] md:text-xs font-black text-gray-400 hover:text-[#00D2AD] transition-all bg-white/5 px-2 md:px-3 py-1.5 rounded-lg border border-white/10 uppercase">
                       Serviços
                     </Link>
                     <Link href="/admin/expirados" className="flex items-center gap-2 text-[10px] md:text-xs font-black text-[#FFC107] hover:text-white transition-all bg-[#FFC107]/10 px-2 md:px-3 py-1.5 rounded-lg border border-[#FFC107]/20 uppercase">
                       Expirados
                       {pendingResets > 0 && (
                         <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white animate-bounce">
                           {pendingResets}
                         </span>
                       )}
                     </Link>
                   </div>
                 )}
              </nav>
            )}


            {/* Right Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              {session ? (
                <>
                  <div className="flex items-center gap-1.5 md:gap-2 bg-[#00D2AD]/10 border border-[#00D2AD]/20 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-sm font-bold">
                     <span className="hidden xs:inline text-gray-400">Saldo:</span>
                     <span className="text-[#00D2AD]">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile?.balance || 0)}
                     </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="hidden md:block text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Sair
                  </button>
                  <Link href="/perfil" className="w-8 h-8 rounded-full bg-[#00D2AD] flex items-center justify-center text-[#0f172a] font-black text-xs shrink-0 shadow-[0_0_10px_rgba(0,210,173,0.3)]">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </Link>
                </>
              ) : (
                <Link href="/login" className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-3 md:px-5 py-1.5 md:py-2 rounded-md font-bold text-xs md:text-sm shadow-[0_0_15px_rgba(0,210,173,0.3)] transition-all uppercase">
                  Entrar
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="md:hidden bg-[#1e293b] border-t border-[#334155] p-4 absolute w-full left-0 top-16 shadow-2xl animate-in slide-in-from-top duration-200">
               <nav className="flex flex-col gap-4">
                  <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-white flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Início
                  </Link>
                  <Link href="/pedidos" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Meus Pedidos
                  </Link>
                  <Link href="/saldo" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Adicionar Saldo
                  </Link>
                  <Link href="/extrato" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Ver Extrato
                  </Link>
                  <Link href="/suporte" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Suporte
                  </Link>
                   {profile?.role === 'admin' && (
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Painel Admin</span>
                       <Link href="/admin/estoque" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-white flex items-center gap-3 p-3 rounded-xl hover:bg-[#0f172a] border border-white/5">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                         Estoque
                       </Link>
                       <Link href="/admin/servicos" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-white flex items-center gap-3 p-3 rounded-xl hover:bg-[#0f172a] border border-white/5">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                         Serviços
                       </Link>
                       <Link href="/admin/expirados" onClick={() => setIsMenuOpen(false)} className="text-base font-black text-[#FFC107] flex items-center justify-between p-3 rounded-xl hover:bg-[#0f172a] border border-[#FFC107]/20 bg-[#FFC107]/5">
                         <div className="flex items-center gap-3">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                           Reset Manual
                         </div>
                         {pendingResets > 0 && (
                           <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] text-white">
                             {pendingResets}
                           </span>
                         )}
                       </Link>
                     </div>
                   )}
                  <div className="h-px bg-[#334155] my-2" />
                  <button 
                    onClick={handleLogout}
                    className="text-base font-bold text-red-400 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sair da Conta
                  </button>
               </nav>
            </div>
          )}
        </header>


        {/* WhatsApp Float */}
        <div className="fixed right-4 bottom-4 z-40">
           <a href="https://wa.me/5511913378848?text=Vim%20pelo%20site%20Centralgsm" target="_blank" className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
           </a>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mt-4 relative z-10">
           {children}
        </main>

        <footer className="w-full border-t border-[#334155] p-8 text-center text-gray-500 text-sm mt-12 bg-[#0f172a]">
           <p>© 2026 JACKSON & ISRAEL GSM - Todos os direitos reservados.</p>
        </footer>
    </div>
  );
}
