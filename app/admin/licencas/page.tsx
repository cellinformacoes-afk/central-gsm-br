"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminLicencasPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data: accData, error } = await supabase
      .from('service_accounts')
      .select('*, services(title)')
      .order('license_expires_at', { ascending: true, nullsFirst: false });

    if (!error) setAccounts(accData || []);
    setLoading(false);
  }

  async function handleUpdateDate(id: string) {
    if (!editDate) return;
    
    const { error } = await supabase
      .from('service_accounts')
      .update({ license_expires_at: editDate })
      .eq('id', id);
    
    if (!error) {
      setEditingId(null);
      fetchData();
    } else {
      alert("Erro ao atualizar data: " + error.message);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Data Inválida";
      return new Date(date.getTime() + (date.getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR');
    } catch (e) {
      return "Erro no formato";
    }
  };

  const getExpiryStatus = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const expiry = new Date(dateStr);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { label: 'EXPIRADA', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      if (diffDays === 0) return { label: 'VENCE HOJE', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' };
      if (diffDays <= 7) return { label: `VENCE EM ${diffDays} DIAS`, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      return { label: `VENCE EM ${diffDays} DIAS`, color: 'text-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-800' };
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">GESTÃO DE <span className="text-[#00D2AD]">LICENÇAS</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Acompanhamento das datas de vencimento das ferramentas originais</p>
        </div>
        <button 
          onClick={() => setShowSyncInfo(!showSyncInfo)}
          className="bg-[#00D2AD] hover:bg-[#00b293] text-[#0f172a] font-black text-[10px] uppercase px-6 py-3 rounded-xl transition-all tracking-wider shadow-lg shadow-[#00D2AD]/20 active:scale-95"
        >
          🔄 Sincronizar Todas Agora
        </button>
      </div>

      {showSyncInfo && (
        <div className="mb-8 bg-[#1e293b] border border-[#00D2AD]/30 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-[#00D2AD] font-black uppercase text-xs mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00D2AD] rounded-full animate-pulse"></span>
            Instruções de Sincronização em Massa
          </h3>
          <p className="text-gray-400 text-[11px] leading-relaxed mb-4">
            Para atualizar TODAS as datas de expiração de uma vez no site oficial (sem trocar senhas), execute o seguinte comando no seu terminal do VS Code:
          </p>
          <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] font-mono text-xs text-green-400">
            node scripts/sync-licenses.js
          </div>
          <p className="text-[10px] text-gray-500 mt-4 italic">* O robô fará login em cada conta e capturará a data real do dashboard. Feche o navegador se estiver aberto logado no site.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">Consultando prazos...</div>
        ) : accounts.length > 0 ? (
          accounts.map(acc => {
            const status = getExpiryStatus(acc.license_expires_at);
            const isEditing = editingId === acc.id;

            return (
              <div key={acc.id} className={`bg-[#1e293b] p-6 rounded-2xl border ${status?.border || 'border-[#334155]'} flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group`}>
                {status?.bg && <div className={`absolute inset-y-0 left-0 w-1 ${status.color.replace('text', 'bg')} transition-all group-hover:w-2`}></div>}
                
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[#0f172a] border border-[#334155]`}>
                    🛠️
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">{acc.services?.title}</h3>
                    <p className="text-[#00D2AD] text-xs font-mono font-bold">{acc.credentials.email}</p>
                  </div>
                </div>

                <div className="flex-1 border-l border-[#334155] pl-6 hidden md:block">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expiração da Ferramenta</p>
                   {isEditing ? (
                     <div className="flex items-center gap-2 mt-2">
                        <input 
                           type="date"
                           value={editDate}
                           onChange={(e) => setEditDate(e.target.value)}
                           className="bg-[#0f172a] border border-[#334155] text-white text-xs p-2 rounded-lg outline-none focus:border-[#00D2AD]"
                        />
                        <button onClick={() => handleUpdateDate(acc.id)} className="bg-green-500 text-white p-2 rounded-lg text-[10px] uppercase font-bold">Salvar</button>
                        <button onClick={() => setEditingId(null)} className="bg-gray-600 text-white p-2 rounded-lg text-[10px] uppercase font-bold">X</button>
                     </div>
                   ) : acc.license_expires_at ? (
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-white font-black text-lg">{formatDate(acc.license_expires_at)}</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status?.color} ${status?.bg} border ${status?.border}`}>
                           {status?.label}
                        </span>
                        <button 
                          onClick={() => { setEditingId(acc.id); setEditDate(acc.license_expires_at?.split('T')[0] || ""); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                        >
                          ✏️
                        </button>
                      </div>
                   ) : (
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-gray-600 font-bold text-[10px] italic uppercase">Aguardando robô...</p>
                        <button 
                          onClick={() => { setEditingId(acc.id); setEditDate(""); }}
                          className="text-[#00D2AD] text-[9px] font-black uppercase underline"
                        >
                          Informar Data Manual
                        </button>
                      </div>
                   )}
                </div>

                <div className="hidden lg:block">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-[#0f172a] text-gray-400 border border-[#334155]`}>
                    Status: {acc.status === 'available' ? 'Ativa' : 'Em Uso'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhuma conta encontrada para monitorar.</p>
          </div>
        )}
      </div>
      
      <div className="mt-10 bg-[#0f172a]/50 p-6 rounded-2xl border border-blue-500/20">
        <h4 className="text-blue-400 font-black text-xs uppercase mb-2">💡 Dica de Gestão</h4>
        <p className="text-gray-400 text-[11px] leading-relaxed">
          As datas acima são extraídas automaticamente pelo robô durante a troca de senhas nos sites oficiais. 
          Você também pode rodar a <b>Sincronização em Massa</b> para preencher todas as datas de uma vez se não quiser esperar o robô resetar cada conta.
        </p>
      </div>
    </div>
  );
}
