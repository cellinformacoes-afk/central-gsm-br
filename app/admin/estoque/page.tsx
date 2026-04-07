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
    // Refresh expiration first
    await supabase.rpc('monitor_rental_expiration');

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
            .map(acc => (
            <div key={acc.id} className={`bg-[#1e293b] p-6 rounded-2xl border ${acc.status === 'pending_reset' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-[#334155]'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${acc.status === 'pending_reset' ? 'bg-red-500/10 text-red-500' : acc.status === 'rented' ? 'bg-blue-500/10 text-blue-500' : 'bg-[#00D2AD]/10 text-[#00D2AD]'}`}>
                     {acc.status === 'pending_reset' ? '⚠️' : acc.status === 'rented' ? '🔑' : '✅'}
                  </div>
                  <div>
                     <h3 className="text-white font-black uppercase italic tracking-tighter">{acc.services?.title}</h3>
                     <p className="text-gray-500 text-xs font-mono">{acc.credentials.email}</p>
                     <p className="text-[#00D2AD] text-[10px] font-mono mt-0.5 font-bold">Senha: {acc.credentials.password}</p>
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
                        onClick={() => handleTriggerRobot(acc.id)}
                        className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/50 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
                     >
                        🤖 Chamar Robô
                     </button>
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
