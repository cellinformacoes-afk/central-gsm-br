"use client";
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
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
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <body className={`${inter.className} min-h-screen flex flex-col bg-[#0f172a]`}>
        {/* Sticky Navbar */}
        <header className="sticky top-0 z-50 w-full bg-[#1e293b]/90 backdrop-blur-md border-b border-[#334155] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 bg-[#00D2AD]/20 rounded-md border-2 border-[#00D2AD] flex items-center justify-center relative overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                 </div>
                 <div className="flex flex-col">
                    <div className="flex flex-wrap items-baseline">
                      <span className="text-white font-black text-xl italic tracking-tight uppercase">JACKSON & ISRAEL</span>
                      <span className="text-[#00D2AD] font-black text-xl italic ml-1 drop-shadow-[0_0_5px_rgba(0,210,173,0.5)]">GSM</span>
                    </div>
                    <span className="text-[#00D2AD] text-[10px] font-bold tracking-[0.2em] mt-0.5 text-center w-full">ALUGUEL DE BOX DIGITAL</span>
                 </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
               <Link href="/" className="text-sm font-medium text-white hover:text-[#00D2AD] transition-colors">Início</Link>
               <Link href="/pedidos" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Meus Pedidos</Link>
               <Link href="/saldo" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Adicionar Saldo</Link>
               <Link href="/suporte" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Suporte</Link>
            </nav>

            {/* Right Buttons */}
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-[#0f172a] border border-[#334155] px-3 py-1.5 rounded-lg text-sm font-medium">
                     <span className="text-gray-400">Saldo:</span>
                     <span className="text-[#00D2AD] font-black">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile?.balance || 0)}
                     </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Sair
                  </button>
                  <Link href="/perfil" className="w-8 h-8 rounded-full bg-[#00D2AD] flex items-center justify-center text-[#0f172a] font-black text-xs">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </Link>
                </>
              ) : (
                <Link href="/login" className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-5 py-2 rounded-md font-bold text-sm shadow-[0_0_15px_rgba(0,210,173,0.3)] transition-all uppercase">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* WhatsApp Float */}
        <div className="fixed right-4 bottom-4 z-40">
           <a href="https://wa.me/yournumber" target="_blank" className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
           </a>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mt-4 relative z-10">
           {children}
        </main>

        <footer className="w-full border-t border-[#334155] p-8 text-center text-gray-500 text-sm mt-12 bg-[#0f172a]">
           <p>© 2026 JACKSON & ISRAEL GSM - Todos os direitos reservados.</p>
        </footer>
    </body>
  );
}
