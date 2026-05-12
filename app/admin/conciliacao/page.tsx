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
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchOrphans();
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
      setOrphans(data.unmatched_in_asaas || []);
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
        fetchOrphans(); // Atualizar lista
      } else {
        alert('Erro: ' + (result.error || 'Falha ao creditar'));
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setProcessingId(null);
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          CONCILIAÇÃO <span className="text-amber-500">MANUAL</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
          Pagamentos recebidos no Asaas que não foram vinculados a nenhum cliente automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">
            Buscando no Asaas...
          </div>
        ) : orphans.length > 0 ? (
          orphans.map((orphan) => (
            <div key={orphan.id} className="bg-[#1e293b] p-6 rounded-3xl border border-[#334155] hover:border-amber-500/30 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#334155] flex items-center justify-center text-3xl shadow-xl">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">
                      {orphan.payer || 'PAGADOR DESCONHECIDO'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-amber-500 font-black text-lg italic">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orphan.value)}
                      </span>
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        Recebido em: {new Date(orphan.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono mt-1 uppercase">ID: {orphan.id}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <input 
                    type="email" 
                    placeholder="E-MAIL DO CLIENTE..."
                    value={emails[orphan.id] || ''}
                    onChange={(e) => setEmails({...emails, [orphan.id]: e.target.value})}
                    className="w-full sm:w-64 bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-4 text-xs font-bold text-white uppercase tracking-widest focus:border-amber-500 outline-none transition-all"
                  />
                  <button 
                    onClick={() => handleCredit(orphan)}
                    disabled={processingId === orphan.id}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      processingId === orphan.id 
                        ? 'bg-gray-700 text-gray-500' 
                        : 'bg-amber-500 text-[#0f172a] hover:bg-amber-400 shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
                    }`}
                  >
                    {processingId === orphan.id ? 'PROCESSANDO...' : 'CREDITAR CLIENTE'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Tudo limpo! Não há pagamentos órfãos.</p>
             <button onClick={fetchOrphans} className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline">Atualizar agora</button>
          </div>
        )}
      </div>
      
      <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <span>ℹ️</span> Dica de Conciliação
        </p>
        <p className="text-gray-400 text-xs leading-relaxed font-medium">
          Estes pagamentos aparecem aqui quando o cliente faz um PIX direto para sua chave sem clicar em "GERAR PIX" no site, ou quando o nome no banco é muito diferente do nome que ele digitou. Ao creditar por aqui, o saldo cai na hora e o pagamento sai desta lista.
        </p>
      </div>
    </div>
  );
}
