"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function ConciliacaoPage() {
  const [orphans, setOrphans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [emails, setEmails] = useState<{ [key: string]: string }>({});
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchOrphans();
    // Carregar IDs ignorados do localStorage
    const savedHidden = localStorage.getItem('admin_hidden_orphans');
    if (savedHidden) setHiddenIds(JSON.parse(savedHidden));
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

  async function fetchOrphans() {
    setLoading(true);
    try {
      const response = await fetch('/api/pix/sync');
      const data = await response.json();
      const list = data.unmatched_in_asaas || [];
      setOrphans(list);
      
      // Preencher e-mails sugeridos
      const newEmails: any = {};
      list.forEach((o: any) => {
        if (o.suggested_email) newEmails[o.id] = o.suggested_email;
      });
      setEmails(prev => ({ ...newEmails, ...prev }));
    } catch (err) {
      console.error('Erro ao buscar órfãos:', err);
    }
    setLoading(false);
  }

  async function handleCredit(orphan: any) {
    const email = emails[orphan.id];
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um e-mail válido.');
      return;
    }

    if (!confirm(`Deseja creditar R$ ${orphan.value} para o e-mail ${email}?`)) return;

    setProcessingId(orphan.id);
    try {
      const response = await fetch('/api/admin/credit-orphan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          amount: orphan.value,
          asaasId: orphan.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        fetchOrphans(); 
      } else {
        alert('Erro: ' + (result.error || 'Falha ao creditar'));
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setProcessingId(null);
  }

  function handleHide(id: string) {
    const newHidden = [...hiddenIds, id];
    setHiddenIds(newHidden);
    localStorage.setItem('admin_hidden_orphans', JSON.stringify(newHidden));
  }

  const visibleOrphans = orphans.filter(o => !hiddenIds.includes(o.id));

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            CONCILIAÇÃO <span className="text-[#00D2AD]">MANUAL</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
            Pagamentos do Asaas sem dono automático.
          </p>
        </div>
        <button 
          onClick={fetchOrphans}
          className="text-[10px] font-black uppercase tracking-widest text-[#00D2AD] border border-[#00D2AD]/30 px-4 py-2 rounded-xl hover:bg-[#00D2AD]/10 transition-all"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">
            Buscando no Asaas...
          </div>
        ) : visibleOrphans.length > 0 ? (
          visibleOrphans.map((orphan) => (
            <div key={orphan.id} className="bg-[#1e293b] p-6 rounded-3xl border border-[#334155] hover:border-[#00D2AD]/30 transition-all group relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#334155] flex items-center justify-center text-3xl shadow-xl">
                    💰
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase italic tracking-tighter text-xl line-clamp-1">
                      {orphan.payer || 'PAGADOR DESCONHECIDO'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#00D2AD] font-black text-lg italic">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orphan.value)}
                      </span>
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-[#0f172a] px-2 py-1 rounded-lg">
                        {new Date(orphan.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto bg-[#0f172a]/50 p-3 rounded-2xl border border-[#334155]/50">
                  <div className="w-full sm:w-72 relative">
                    <input 
                      type="email" 
                      placeholder="E-MAIL DO CLIENTE..."
                      value={emails[orphan.id] || ''}
                      onChange={(e) => setEmails({...emails, [orphan.id]: e.target.value})}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-4 text-xs font-bold text-white uppercase tracking-widest focus:border-[#00D2AD] outline-none transition-all pr-10"
                    />
                    {orphan.suggested_email && !emails[orphan.id] && (
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] animate-bounce text-[#00D2AD]">✨</span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleCredit(orphan)}
                      disabled={processingId === orphan.id}
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        processingId === orphan.id 
                          ? 'bg-gray-700 text-gray-500' 
                          : 'bg-[#00D2AD] text-[#0f172a] hover:bg-[#00BDA0] shadow-[0_10px_20px_rgba(0,210,173,0.2)] hover:-translate-y-0.5'
                      }`}
                    >
                      {processingId === orphan.id ? 'CREDITANDO...' : 'CREDITAR AGORA'}
                    </button>
                    <button 
                      onClick={() => handleHide(orphan.id)}
                      title="Já resolvi por fora / Ignorar"
                      className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              
              {orphan.suggested_email && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] bg-[#00D2AD]/20 text-[#00D2AD] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter animate-pulse">Sugestão Detectada:</span>
                  <span className="text-[10px] text-gray-400 font-bold italic">{orphan.suggested_email}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Tudo limpo por aqui! ✅</p>
             <button onClick={() => { setHiddenIds([]); localStorage.removeItem('admin_hidden_orphans'); fetchOrphans(); }} className="text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-[#00D2AD]">Mostrar itens ocultos</button>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>🔍</span> Como funciona a sugestão?
          </p>
          <p className="text-gray-400 text-xs leading-relaxed font-medium">
            O robô busca clientes que geraram um PIX do mesmo valor nas últimas 24h. Se houver apenas um, ele sugere o e-mail automaticamente para facilitar sua vida.
          </p>
        </div>
        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>🗑️</span> Botão Lixeira
          </p>
          <p className="text-gray-400 text-xs leading-relaxed font-medium">
            Use a lixeira para pagamentos que você já creditou manualmente direto no perfil do cliente. Isso limpa sua lista de trabalho.
          </p>
        </div>
      </div>
    </div>
  );
}
