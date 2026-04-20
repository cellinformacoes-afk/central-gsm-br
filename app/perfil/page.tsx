"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-8 text-center">Carregando...</div>;
  if (!profile) return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-8 text-center text-red-500">Perfil não encontrado. Faça login.</div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight uppercase italic underline decoration-[#00D2AD] decoration-4 underline-offset-8">Perfil do Usuário</h1>
          <p className="text-gray-400 mt-6 font-medium">Gerencie as informações da sua conta e segurança.</p>
        </div>

        <div className="bg-[#0f172a] rounded-3xl border border-[#334155] overflow-hidden shadow-[0_0_50px_rgba(0,210,173,0.1)]">
           <div className="p-8 border-b border-[#334155] flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-[#0f172a] to-[#050B14]">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00D2AD] to-[#009077] rounded-2xl flex items-center justify-center text-[#0f172a] text-4xl font-black shadow-[0_0_20px_rgba(0,210,173,0.3)]">
                 {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left">
                 <h2 className="text-2xl font-black uppercase italic">{profile.username || 'Usuário'}</h2>
                 <p className="text-gray-400 font-medium">{profile.email}</p>
                 <span className="inline-flex items-center gap-2 mt-4 bg-[#00D2AD]/10 text-[#00D2AD] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-[#00D2AD]/20">
                    <span className="w-2 h-2 bg-[#00D2AD] rounded-full animate-pulse"></span>
                    Conta Ativa
                 </span>
              </div>
           </div>

           <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                    <div className="w-full bg-[#050B14] border border-[#334155] rounded-xl py-4 px-5 text-white font-medium">
                       {profile.username}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Endereço de E-mail</label>
                    <div className="w-full bg-[#050B14] border border-[#334155] rounded-xl py-4 px-5 text-gray-400 font-medium">
                       {profile.email}
                    </div>
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Documento (CPF)</label>
                    <div className="w-full bg-[#050B14] border border-[#334155] rounded-xl py-4 px-5 text-[#00D2AD] font-bold tracking-widest">
                       {profile.cpf ? profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "Não informado"}
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-[#334155]">
                 <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center">
                    Cadastro realizado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
