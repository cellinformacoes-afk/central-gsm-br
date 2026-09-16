"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

type PixTransaction = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  external_id: string | null;
  type: string;
  description: string | null;
  created_at: string;
  profiles: { email: string } | null;
};

export default function AdminPixPage() {
  const [transactions, setTransactions] = useState<PixTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('TUDO');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const router = useRouter();

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profile?.role !== 'admin') router.push('/');
  }, [router]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, profiles:user_id (email)')
      .in('type', ['pix', 'deposit'])
      .order('created_at', { ascending: false })
      .limit(300);

    if (!error) {
      setTransactions((data as PixTransaction[]) || []);
    } else {
      console.error('Erro ao buscar transações PIX:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin();
    fetchTransactions();
  }, [checkAdmin, fetchTransactions]);

  const handleApprove = async (tx: PixTransaction) => {
    if (!confirm(
      `⚠️ CONFIRMAR PAGAMENTO\n\nCliente: ${tx.profiles?.email}\nValor: R$ ${parseFloat(String(tx.amount)).toFixed(2)}\n\nConfirme que o pagamento caiu no seu banco antes de aprovar.`
    )) return;

    setApprovingId(tx.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Sessão expirada. Faça login novamente.'); return; }

      const res = await fetch('/api/admin/credit-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transactionId: tx.id }),
      });

      const result = await res.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        fetchTransactions();
      } else {
        alert('❌ Erro: ' + result.error);
      }
    } catch (err: any) {
      console.error('Erro ao aprovar:', err);
      alert('Falha ao aprovar: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'approved': return { badge: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400', label: 'PAGO' };
      case 'pending':  return { badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400', label: 'PENDENTE' };
      case 'failed':
      case 'expired':  return { badge: 'bg-red-500/20 text-red-400', dot: 'bg-red-400', label: status.toUpperCase() };
      default:         return { badge: 'bg-gray-500/20 text-gray-400', dot: 'bg-gray-500', label: status?.toUpperCase() || '—' };
    }
  };

  const filtered = transactions.filter(tx => {
    const matchesSearch =
      tx.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'TUDO' ||
      (statusFilter === 'PENDENTES' && tx.status?.toLowerCase() === 'pending') ||
      (statusFilter === 'CONCLUÍDOS' && (tx.status?.toLowerCase() === 'success' || tx.status?.toLowerCase() === 'approved'));

    return matchesSearch && matchesStatus;
  });

  const totalPending = transactions.filter(t => t.status?.toLowerCase() === 'pending').length;
  const totalPendingValue = transactions
    .filter(t => t.status?.toLowerCase() === 'pending')
    .reduce((acc, t) => acc + parseFloat(String(t.amount)), 0);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            PEDIDOS DE SALDO <span className="text-[#00D2AD]">(PIX)</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
            Aqui ficam os pedidos que os clientes fazem na aba &quot;Comprar Créditos&quot;. Confirme se o PIX caiu antes de aprovar!
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="BUSCAR POR EMAIL OU ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-10 text-xs font-bold text-white uppercase tracking-widest focus:border-[#00D2AD] outline-none transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>

      {/* Alert: Pendentes */}
      {totalPending > 0 && (
        <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-4 mb-6 animate-pulse">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-black uppercase tracking-widest text-sm">
              {totalPending} pagamento{totalPending > 1 ? 's' : ''} pendente{totalPending > 1 ? 's' : ''}
            </p>
            <p className="text-yellow-400/70 text-xs font-bold uppercase">
              Total pendente: R$ {totalPendingValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-[#334155] mb-8 w-fit">
        {['TUDO', 'PENDENTES', 'CONCLUÍDOS'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === s
                ? 'bg-[#334155] text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="bg-[#1e293b] border border-[#334155] hover:border-[#00D2AD]/50 text-gray-400 hover:text-[#00D2AD] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          🔄 ATUALIZAR
        </button>
      </div>

      {/* Transaction List */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Nenhum pedido {statusFilter !== 'TUDO' ? statusFilter.toLowerCase() : ''} no momento.
            </p>
          </div>
        ) : (
          filtered.map(tx => {
            const s = getStatusStyle(tx.status);
            const isPending = tx.status?.toLowerCase() === 'pending';
            const isApproving = approvingId === tx.id;

            return (
              <div
                key={tx.id}
                className={`bg-[#1e293b] p-5 rounded-2xl border transition-all group ${
                  isPending
                    ? 'border-yellow-500/30 hover:border-yellow-500/60'
                    : 'border-[#334155] hover:border-[#00D2AD]/20'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status dot */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${s.dot} ${isPending ? 'animate-pulse' : ''}`} />
                    </div>

                    <div className="min-w-0">
                      {/* Email + badge */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-black text-sm truncate">
                          {tx.profiles?.email ?? <span className="text-gray-600 italic">sem email</span>}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex-shrink-0 ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                          📅 {new Date(tx.created_at).toLocaleString('pt-BR')}
                        </span>
                        {tx.external_id && (
                          <span className="text-gray-600 text-[9px] font-mono truncate max-w-[200px]" title={tx.external_id}>
                            ID: {tx.external_id}
                          </span>
                        )}
                        {tx.description && (
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            {tx.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: value + action */}
                  <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 justify-between md:justify-start flex-shrink-0">
                    <p className={`font-black text-2xl tracking-tighter italic ${isPending ? 'text-yellow-400' : 'text-white'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                    </p>

                    {isPending && (
                      <button
                        onClick={() => handleApprove(tx)}
                        disabled={isApproving}
                        className="bg-[#00D2AD]/10 hover:bg-[#00D2AD] text-[#00D2AD] hover:text-[#0f172a] border border-[#00D2AD]/30 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D2AD]/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isApproving ? '⏳ APROVANDO...' : '✅ CONFIRMAR PAGAMENTO'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-6">
          Exibindo {filtered.length} de {transactions.length} registros
        </p>
      )}
    </div>
  );
}
