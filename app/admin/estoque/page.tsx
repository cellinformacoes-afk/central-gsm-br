"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminEstoquePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [newPass, setNewPass] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'pending_reset'>('all');
  
  // New Account Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ service_id: '', email: '', password: '', duration_hours: '', price: '' });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastCopiedAccountId, setLastCopiedAccountId] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, accountId?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (accountId) setLastCopiedAccountId(accountId);
    setTimeout(() => {
      setCopiedKey(prev => prev === key ? null : prev);
    }, 2000);
  };

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
    const { data: servData } = await supabase.from('services').select('id, title, duration_hours, price').eq('is_rental', true);
    setServices(servData || []);

    const { data: accData, error } = await supabase
      .from('service_accounts')
      .select('*, services(title)')
      .order('status', { ascending: false });

    if (!error) setAccounts(accData || []);
    setLoading(false);
  }

  const handleUpdatePassword = async () => {
    if (!newPass || !editingAccount) return;

    const { error } = await supabase
      .from('service_accounts')
      .update({
        credentials: { ...editingAccount.credentials, password: newPass },
        status: 'available'
      })
      .eq('id', editingAccount.id);

    if (error) {
      alert("Erro ao atualizar senha");
    } else {
      setIsModalOpen(false);
      setNewPass('');
      setLastCopiedAccountId(null);
      fetchData();
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Primeiro atualiza o serviço com a nova duração e preço
    const { error: servError } = await supabase
      .from('services')
      .update({
        duration_hours: parseInt(formData.duration_hours),
        price: parseFloat(formData.price)
      })
      .eq('id', parseInt(formData.service_id));

    if (servError) {
       alert("Erro ao atualizar dados do serviço: " + servError.message);
       return;
    }

    const { error } = await supabase.from('service_accounts').insert({
      service_id: parseInt(formData.service_id),
      credentials: { email: formData.email, password: formData.password },
      status: 'available'
    });

    if (error) {
      alert("Erro ao adicionar conta: " + error.message);
    } else {
      setShowAddForm(false);
      setFormData({ service_id: '', email: '', password: '', duration_hours: '', price: '' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;
    const { error } = await supabase.from('service_accounts').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleTriggerRobot = async (id: string) => {
    if (!confirm("Você quer mandar essa conta para o Robô resetar sozinho agora?")) return;
    const { error } = await supabase.from('service_accounts').update({ status: 'pending_reset' }).eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Admin Nav */}
      <AdminNav />



       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">GESTÃO DE <span className="text-[#00D2AD]">ESTOQUE</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Controle de contas e troca de senhas</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#0f172a] p-1 rounded-xl border border-[#334155]">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-[#334155] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'available' ? 'bg-[#00D2AD] text-[#0f172a] shadow-lg shadow-[#00D2AD]/20' : 'text-gray-500 hover:text-[#00D2AD]'}`}
            >
              Disponíveis
            </button>
            <button 
              onClick={() => setFilter('rented')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'rented' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-blue-400'}`}
            >
              Em Uso
            </button>
            <button 
              onClick={() => setFilter('pending_reset')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'pending_reset' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:text-red-400'}`}
            >
              Pendentes
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#00D2AD] text-[#0f172a] px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:-translate-y-1 transition-all"
          >
            {showAddForm ? 'CANCELAR' : '+ NOVA CONTA'}
          </button>
        </div>
      </div>

      {/* 🚀 DASHBOARD COCKPIT 🚀 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-[#334155] shadow-xl relative overflow-hidden group hover:border-[#00D2AD]/50 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Livres p/ Aluguel</p>
                  <h3 className="text-4xl font-black text-white">{accounts.filter(a => a.status === 'available').length}</h3>
               </div>
               <div className="w-12 h-12 bg-[#00D2AD]/10 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(0,210,173,0.2)] group-hover:scale-110 transition-transform">✅</div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-[#334155] shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contas em Uso</p>
                  <h3 className="text-4xl font-black text-white">{accounts.filter(a => a.status === 'rented').length}</h3>
               </div>
               <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">🔑</div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:border-red-500/80 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reset Pendente</p>
                  <h3 className="text-4xl font-black text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{accounts.filter(a => a.status === 'pending_reset').length}</h3>
               </div>
               <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center justify-center text-2xl animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_20px_rgba(239,68,68,0.4)]">⚠️</div>
            </div>
         </div>
      </div>

      {showAddForm && (
        <div className="mb-10 bg-[#1e293b] p-8 rounded-3xl border border-[#00D2AD]/30 animate-in slide-in-from-top duration-300">
           <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase">Serviço</label>
                  <select 
                    required
                    value={formData.service_id}
                    onChange={e => {
                       const selected = services.find(s => s.id === parseInt(e.target.value));
                       setFormData({
                          ...formData, 
                          service_id: e.target.value,
                          duration_hours: selected?.duration_hours?.toString() || '',
                          price: selected?.price?.toString() || ''
                       });
                    }}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]"
                 >
                    <option value="">Selecione...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase">Email / Login</label>
                 <input 
                    required
                    type="text" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]"
                 />
              </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Senha</label>
                  <input 
                     required
                     type="text" 
                     value={formData.password}
                     onChange={e => setFormData({...formData, password: e.target.value})}
                     className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]"
                  />
               </div>
               
               {/* Novos Campos solicitados */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Horas Aluguel</label>
                  <input 
                     required
                     type="number" 
                     value={formData.duration_hours}
                     onChange={e => setFormData({...formData, duration_hours: e.target.value})}
                     placeholder="Ex: 3"
                     className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Preço Aluguel (R$)</label>
                  <input 
                     required
                     type="number" 
                     step="0.01"
                     value={formData.price}
                     onChange={e => setFormData({...formData, price: e.target.value})}
                     placeholder="Ex: 15.00"
                     className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]"
                  />
               </div>
               <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-10 py-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all">Salvar no Estoque</button>
               </div>
           </form>
        </div>
      )}

       <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">Carregando Estoque...</div>
        ) : accounts.filter(acc => filter === 'all' || acc.status === filter).length > 0 ? (
          accounts
            .filter(acc => filter === 'all' || acc.status === filter)
            .map(acc => {
              const isSelected = acc.id === lastCopiedAccountId;
              return (
              <div 
                key={acc.id} 
                className={`p-6 rounded-3xl border transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1 ${
                  isSelected 
                    ? 'border-[#00D2AD] ring-2 ring-[#00D2AD] shadow-[0_0_35px_rgba(0,210,173,0.35)] bg-gradient-to-r from-[#1e293b] via-[#1e293b] to-[#00D2AD]/20'
                    : acc.status === 'pending_reset' 
                      ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.2)] bg-red-900/10' 
                      : 'border-[#334155] bg-[#1e293b] hover:border-[#00D2AD]/30'
                }`}
              >
                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      isSelected ? 'bg-[#00D2AD] text-[#0f172a] shadow-[0_0_15px_rgba(0,210,173,0.5)] scale-110' :
                      acc.status === 'pending_reset' ? 'bg-red-500/10 text-red-500' : 
                      acc.status === 'rented' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-[#00D2AD]/10 text-[#00D2AD]'
                    }`}>
                       {isSelected ? '🎯' : acc.status === 'pending_reset' ? '⚠️' : acc.status === 'rented' ? '🔑' : '✅'}
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="text-white font-black uppercase italic tracking-tighter text-sm md:text-base">{acc.services?.title}</h3>
                          {isSelected && (
                             <span className="px-2.5 py-0.5 rounded-full bg-[#00D2AD] text-[#0f172a] font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-[0_0_10px_rgba(0,210,173,0.5)]">
                                🎯 COPIADO / EM ANDAMENTO
                             </span>
                          )}
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded transition-all ${isSelected ? 'bg-[#00D2AD]/20 text-white font-bold border border-[#00D2AD]/40' : 'text-gray-400'}`}>
                             {acc.credentials?.email}
                          </span>
                          <button 
                             type="button"
                             onClick={() => copyToClipboard(acc.credentials?.email, `${acc.id}-email`, acc.id)}
                             title="Copiar Email/Login"
                             className="p-1 rounded bg-[#0f172a] hover:bg-[#334155] border border-[#334155] text-gray-400 hover:text-[#00D2AD] transition-all flex items-center gap-1 text-[10px]"
                          >
                             {copiedKey === `${acc.id}-email` ? (
                                <span className="text-[#00D2AD] flex items-center gap-1 font-bold text-[10px]">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                   Copiado!
                                </span>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                             )}
                          </button>
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${isSelected ? 'bg-[#00D2AD]/20 text-[#00D2AD] border border-[#00D2AD]/40 font-black' : 'text-[#00D2AD]'}`}>
                             Senha: {acc.credentials?.password}
                          </span>
                          <button 
                             type="button"
                             onClick={() => copyToClipboard(acc.credentials?.password, `${acc.id}-pass`, acc.id)}
                             title="Copiar Senha"
                             className="p-1 rounded bg-[#0f172a] hover:bg-[#334155] border border-[#334155] text-gray-400 hover:text-[#00D2AD] transition-all flex items-center gap-1 text-[10px]"
                          >
                             {copiedKey === `${acc.id}-pass` ? (
                                <span className="text-[#00D2AD] flex items-center gap-1 font-bold text-[10px]">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                   Copiada!
                                </span>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                             )}
                          </button>
                       </div>
                    </div>
                 </div>

               <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    acc.status === 'pending_reset' ? 'bg-red-500 text-white animate-pulse' :
                    acc.status === 'rented' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-[#00D2AD]/20 text-[#00D2AD]'
                  }`}>
                    {acc.status === 'pending_reset' ? 'RESET PENDENTE' : acc.status === 'rented' ? 'ALUGADA' : 'DISPONÍVEL'}
                  </span>

                  <div className="flex gap-2">
                     <button 
                        onClick={() => { setEditingAccount(acc); setIsModalOpen(true); }}
                        className="bg-[#334155] hover:bg-[#475569] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
                     >
                        Reset Manual
                     </button>
                     <button 
                        onClick={() => handleDelete(acc.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors p-2"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                     </button>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Estoque vazio. Adicione contas para começar.</p>
          </div>
        )}
      </div>

      {/* Modal de Reset de Senha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-md p-4">
           <div className="bg-[#1e293b] max-w-sm w-full rounded-3xl border border-[#00D2AD]/50 p-8 shadow-2xl">
              <h2 className="text-xl font-black text-white uppercase italic mb-2">ATUALIZAR SENHA</h2>
              <p className="text-gray-400 text-xs mb-6">Insira a nova senha definida no site oficial.</p>
              
              <div className="space-y-4">
                 <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155]">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Conta:</p>
                    <p className="text-white font-mono text-sm">{editingAccount?.credentials.email}</p>
                 </div>
                 
                 <input 
                    type="text" 
                    placeholder="Nova Senha" 
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#00D2AD]/30 rounded-xl p-4 text-white font-mono focus:border-[#00D2AD] outline-none"
                 />

                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-[#334155] text-white py-3 rounded-xl font-black uppercase text-xs">Cancelar</button>
                    <button onClick={handleUpdatePassword} className="flex-1 bg-[#00D2AD] text-[#0f172a] py-3 rounded-xl font-black uppercase text-xs">Confirmar</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
