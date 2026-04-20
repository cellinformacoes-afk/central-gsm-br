"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingCpf, setEditingCpf] = useState(false);
  const [newCpf, setNewCpf] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    setLoading(true);
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

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCpf(formatCPF(e.target.value));
  };

  const handleUpdateCpf = async () => {
    const cleanCpf = newCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      alert("Por favor, insira um CPF válido com 11 dígitos.");
      return;
    }

    setUpdateLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ cpf: cleanCpf })
      .eq('id', profile.id);

    if (error) {
      alert("Erro ao atualizar CPF: " + error.message);
    } else {
      alert("CPF atualizado com sucesso!");
      setEditingCpf(false);
      getProfile();
    }
    setUpdateLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-8 text-center font-black uppercase tracking-widest animate-pulse">Carregando perfil...</div>;
  if (!profile) return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-8 text-center text-red-500 font-bold uppercase">Perfil não encontrado. Faça login.</div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight uppercase italic underline decoration-[#00D2AD] decoration-4 underline-offset-8">Meu Perfil</h1>
          <p className="text-gray-400 mt-6 font-medium">Gerencie as informações da sua conta e segurança da plataforma.</p>
        </div>

        <div className="bg-[#0f172a] rounded-[40px] border border-[#334155] overflow-hidden shadow-[0_0_50px_rgba(0,210,173,0.1)] transition-all hover:shadow-[0_0_70px_rgba(0,210,173,0.15)]">
           <div className="p-10 border-b border-[#334155] flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-[#0f172a] to-[#050B14] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2AD]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="w-28 h-28 bg-gradient-to-br from-[#00D2AD] to-[#009077] rounded-3xl flex items-center justify-center text-[#0f172a] text-5xl font-black shadow-[0_0_30px_rgba(0,210,173,0.4)] relative z-10">
                 {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left relative z-10">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">{profile.username || 'Usuário'}</h2>
                 <p className="text-gray-400 font-bold tracking-wide mt-1">{profile.email}</p>
                 <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                    <span className="inline-flex items-center gap-2 bg-[#00D2AD]/10 text-[#00D2AD] px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#00D2AD]/20 shadow-lg">
                       <span className="w-2 h-2 bg-[#00D2AD] rounded-full animate-pulse shadow-[0_0_10px_#00D2AD]"></span>
                       Conta Ativa
                    </span>
                    <span className="inline-flex items-center gap-2 bg-gray-800/50 text-gray-400 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700">
                       {profile.role || 'CLIENTE'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="group space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-[#00D2AD] rounded-full"></span>
                       Nome Completo
                    </label>
                    <div className="w-full bg-[#050B14] border-2 border-[#334155] rounded-2xl py-4.5 px-6 text-white font-bold transition-all group-hover:border-[#00D2AD]/30">
                       {profile.username}
                    </div>
                 </div>
                 <div className="group space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-[#00D2AD] rounded-full"></span>
                       Endereço de E-mail
                    </label>
                    <div className="w-full bg-[#050B14] border-2 border-[#334155] rounded-2xl py-4.5 px-6 text-gray-500 font-bold transition-all">
                       {profile.email}
                    </div>
                 </div>
                 
                 <div className="md:col-span-2 group space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-[#00D2AD] rounded-full"></span>
                       Documento (CPF)
                    </label>
                    <div className="relative group">
                       {!editingCpf ? (
                          <div className="w-full bg-[#050B14] border-2 border-[#334155] rounded-2xl py-4.5 px-6 flex items-center justify-between transition-all group-hover:border-[#00D2AD]/50">
                             <span className={`${profile.cpf ? 'text-[#00D2AD]' : 'text-red-400'} font-black text-sm tracking-[0.15em]`}>
                                {profile.cpf ? profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "CPF NÃO CADASTRADO"}
                             </span>
                             {!profile.cpf && (
                                <button 
                                   onClick={() => setEditingCpf(true)}
                                   className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                   Cadastrar CPF
                                </button>
                             )}
                          </div>
                       ) : (
                          <div className="flex flex-col sm:flex-row gap-3">
                             <input 
                                type="text"
                                value={newCpf}
                                onChange={handleCpfChange}
                                placeholder="000.000.000-00"
                                className="flex-1 bg-[#050B14] border-2 border-[#00D2AD] rounded-2xl py-4 px-6 text-white font-black tracking-[0.2em] outline-none shadow-[0_0_20px_rgba(0,210,173,0.1)]"
                             />
                             <div className="flex gap-2">
                                <button 
                                   onClick={handleUpdateCpf}
                                   disabled={updateLoading}
                                   className="flex-1 sm:flex-none bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50"
                                >
                                   {updateLoading ? '...' : 'Salvar'}
                                </button>
                                <button 
                                   onClick={() => { setEditingCpf(false); setNewCpf(""); }}
                                   className="flex-1 sm:flex-none bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                                >
                                   Cancelar
                                </button>
                             </div>
                          </div>
                       )}
                       {!profile.cpf && !editingCpf && (
                         <p className="text-[10px] text-red-500/80 font-bold uppercase mt-2 ml-1 italic animate-pulse">
                            ⚠️ Atenção: você precisa cadastrar seu CPF para continuar usando os serviços.
                         </p>
                       )}
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t border-[#334155] flex flex-col items-center gap-2">
                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">
                    Sincronizado com Jackson & Israel GSM
                 </p>
                 <p className="text-[10px] text-gray-600 font-medium">
                    Usuário desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

