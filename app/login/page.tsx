"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh(); // Ensure layout balance updates
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#09090b] text-white">
      {/* Brand Side (Visible on Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-[#0f172a] relative items-center justify-center p-12 overflow-hidden border-r border-[#334155]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D2AD]/10 blur-[120px] rounded-full -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full translate-y-1/2"></div>
        
        <div className="z-10 text-center">
            <h2 className="text-4xl font-black mb-6 tracking-tighter italic uppercase">JACKSON & ISRAEL <span className="text-[#00D2AD]">GSM</span></h2>
            <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed font-medium">Faça login para gerenciar seus aluguéis e adicionar saldo com segurança.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#09090b]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <div className="lg:hidden mb-6 flex justify-center">
                <span className="text-2xl font-black italic uppercase">JACKSON & ISRAEL <span className="text-[#00D2AD]">GSM</span></span>
             </div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic underline decoration-[#00D2AD] decoration-4 underline-offset-8">Acessar Conta</h1>
            <p className="text-gray-400 mt-6 font-medium">Informe suas credenciais para entrar no sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl font-bold flex items-center gap-2">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" 
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3.5 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD] transition-all font-medium"
              />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Senha</label>
                <Link href="#" className="text-[10px] font-bold text-[#00D2AD] hover:text-white transition-colors">ESQUECI A SENHA</Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3.5 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD] transition-all font-medium"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] font-black py-5 rounded-xl shadow-[0_4px_20px_rgba(0,210,173,0.4)] hover:shadow-[0_4px_30px_rgba(0,210,173,0.6)] transition-all uppercase tracking-[0.1em] text-sm flex justify-center items-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0f172a]/30 border-t-[#0f172a] rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : "Entrar no Sistema"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 font-medium">
            Ainda não tem conta? <Link href="/cadastro" className="text-[#00D2AD] font-black hover:text-white transition-colors ml-1 uppercase">CRIAR CONTA</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
