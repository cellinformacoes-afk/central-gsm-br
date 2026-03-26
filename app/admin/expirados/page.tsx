'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminCreds from '@/components/admin/AdminCreds';
import { Shield, RefreshCcw, CheckCircle2, XCircle, Clock, Key, Mail, Trash2 } from 'lucide-react';

export default function ExpiradosPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchExpirados();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      router.push('/');
    }
  };

  const fetchExpirados = async () => {
    setLoading(true);
    // Primeiro garante que o monitor rodou para capturar novas expirações
    await supabase.rpc('monitor_rental_expiration');
    
    // Busca contas pendentes de reset
    const { data, error } = await supabase
      .from('service_accounts')
      .select('*, services(title)')
      .eq('status', 'pending_reset')
      .order('created_at', { ascending: false });
    
    if (!error) setAccounts(data || []);
    setLoading(false);
  };

  const markAsResolved = async (id: string) => {
    if (!confirm("Confirmar que a senha foi alterada manualmente no site oficial?")) return;
    
    const { error } = await supabase
      .from('service_accounts')
      .update({ status: 'available' })
      .eq('id', id);
    
    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      // Limpar tarefas de automação antigas para evitar lixo no DB
      await supabase.from('automation_tasks').delete().eq('account_id', id);
      fetchExpirados();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Admin Nav */}
        <div className="flex gap-4 mb-10 border-b border-[#334155] pb-4 overflow-x-auto no-scrollbar">
           <Link href="/admin/pedidos" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap flex items-center gap-2">🛒 Pedidos</Link>
           <Link href="/admin/estoque" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap flex items-center gap-2">📦 Estoque</Link>
           <Link href="/admin/servicos" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap flex items-center gap-2">🛠️ Serviços</Link>
           <Link href="/admin/expirados" className="text-[#FFC107] border-b-2 border-[#FFC107] font-black uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap flex items-center gap-2">⚠️ Expirados</Link>
        </div>

        {/* Credentials Info */}
        <AdminCreds />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
              <Shield className="text-[#FFC107]" size={40} />
              Contas Expiradas
            </h1>
            <p className="text-gray-500 font-medium text-sm">Resete a senha no site oficial e clique em "Liberar Conta"</p>
          </div>
          
          <button 
            onClick={fetchExpirados}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-all border border-white/10"
          >
            <RefreshCcw className={loading ? 'animate-spin' : ''} size={16}/>
            Atualizar Lista
          </button>
        </div>

        <div className="bg-[#1e293b]/50 border border-[#334155] rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0f172a]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Serviço / Ferramenta</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Dados para Login</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Ação Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {loading ? (
                   <tr><td colSpan={3} className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-2 text-gray-500">
                       <RefreshCcw className="animate-spin" size={24} />
                       <span className="font-bold uppercase text-[10px]">Carregando...</span>
                     </div>
                   </td></tr>
                ) : accounts.length === 0 ? (
                   <tr><td colSpan={3} className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-2 text-gray-400">
                       <CheckCircle2 size={32} className="text-[#00D2AD]" />
                       <span className="font-bold uppercase text-sm">Tudo Limpo!</span>
                       <span className="text-xs text-gray-500">Nenhuma conta pendente de reset no momento.</span>
                     </div>
                   </td></tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                             <Key className="text-yellow-500" size={20} />
                           </div>
                           <div>
                             <div className="font-black text-white text-base italic uppercase tracking-tighter">{account.services?.title || 'Serviço'}</div>
                             <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                               <Clock size={10} /> Expiração Detectada
                             </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-2 bg-[#0f172a] px-3 py-1.5 rounded-lg border border-[#334155] w-fit">
                             <Mail size={12} className="text-[#00D2AD]" />
                             <code className="text-[#00D2AD] text-xs font-mono font-bold">{account.credentials?.email}</code>
                           </div>
                           <div className="flex items-center gap-2 bg-[#000]/20 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">Senha Atual:</span>
                             <code className="text-white text-xs font-mono ml-1">{account.credentials?.password}</code>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <button 
                          onClick={() => markAsResolved(account.id)}
                          className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(0,210,173,0.2)] hover:scale-105 transition-all"
                        >
                          Liberar Conta
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-[#1e293b]/30 border border-[#334155] p-6 rounded-3xl">
           <h3 className="text-white font-black uppercase text-xs mb-3 flex items-center gap-2">
             <Shield className="text-blue-400" size={16} /> Como proceder?
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-gray-500 font-medium">
             <div className="space-y-1">
               <span className="text-white font-bold block">1. ACESSO</span>
               <p>Acesse o site da ferramenta original (ex: UnlockTool) com o e-mail e senha atual mostrados acima.</p>
             </div>
             <div className="space-y-1">
               <span className="text-white font-bold block">2. ALTERAÇÃO</span>
               <p>Vá nas configurações da conta e altere a senha para uma nova combinação.</p>
             </div>
             <div className="space-y-1">
               <span className="text-white font-bold block">3. LIBERAÇÃO</span>
               <p>Volte aqui e clique em "Liberar Conta". O sistema atualizará a senha no banco de dados e tornará a conta disponível para o próximo cliente.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
