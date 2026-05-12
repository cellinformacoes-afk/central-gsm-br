"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está logado (o Supabase loga automaticamente após o clique no link de recuperação)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se não tiver sessão (token inválido/expirado ou tentou acessar direto), exibe aviso ou redireciona
        // Em muitos casos de redefinição via hash da URL, o supabase client já intercepta e processa.
      }
    };
    checkSession();

    // Listener para pegar o evento de redefinição de senha caso seja via PKCE
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // O usuário está pronto para redefinir a senha
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#09090b] text-white">
      {/* Brand Side (Visible on Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-[#050B14] relative items-center justify-center p-12 overflow-hidden border-r border-[#334155]">
        {/* Animated Cyber Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#00D2AD]/10 blur-[120px] rounded-full animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>

        {/* Central Scanline */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D2AD]/30 to-transparent shadow-[0_0_15px_rgba(0,210,173,0.5)]"></div>

        <div className="z-10 text-center relative">
            <div className="absolute -inset-10 bg-gradient-to-r from-[#00D2AD]/0 via-[#00D2AD]/5 to-[#00D2AD]/0 blur-2xl animate-pulse"></div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter italic uppercase text-white drop-shadow-[0_0_15px_rgba(0,210,173,0.3)]">JACKSON & ISRAEL <span className="text-[#00D2AD]">GSM</span></h2>
            <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed font-medium">Defina uma nova senha <span className="text-[#00D2AD] font-bold">segura</span> para o seu acesso.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#09090b]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <div className="lg:hidden mb-6 flex justify-center">
                <span className="text-2xl font-black italic uppercase">JACKSON & ISRAEL <span className="text-[#00D2AD]">GSM</span></span>
             </div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic underline decoration-[#00D2AD] decoration-4 underline-offset-8">Nova Senha</h1>
            <p className="text-gray-400 mt-6 font-medium">Digite sua nova senha abaixo para acessar sua conta.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl font-bold flex items-center gap-2">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-[#00D2AD]/10 border border-[#00D2AD]/30 text-[#00D2AD] text-sm rounded-xl font-bold flex items-center gap-2">
                <span className="text-lg">✅</span> Senha redefinida com sucesso! Redirecionando para o login...
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Nova Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D2AD] focus:ring-2 focus:ring-[#00D2AD]/30 focus:shadow-[0_0_20px_rgba(0,210,173,0.15)] transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D2AD] focus:ring-2 focus:ring-[#00D2AD]/30 focus:shadow-[0_0_20px_rgba(0,210,173,0.15)] transition-all font-medium"
              />
            </div>

            <button 
              disabled={loading || success}
              className="group relative w-full bg-gradient-to-r from-[#00D2AD] to-[#009077] hover:from-[#00BDA0] hover:to-[#007A65] disabled:opacity-50 disabled:cursor-not-allowed text-[#0f172a] font-black py-5 rounded-xl shadow-[0_5px_25px_rgba(0,210,173,0.4)] hover:shadow-[0_10px_40px_rgba(0,210,173,0.5)] hover:-translate-y-1 transition-all uppercase tracking-[0.15em] text-sm flex justify-center items-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-[-20deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out"></div>
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#0f172a]/30 border-t-[#0f172a] rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </div>
              ) : "Redefinir Senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
