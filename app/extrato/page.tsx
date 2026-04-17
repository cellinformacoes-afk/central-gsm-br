"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Clock, Search } from 'lucide-react';
import Link from 'next/link';

export default function ExtratoPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar extrato:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalDepositado = transactions.filter(t => t.type === 'deposit' && (t.status === 'success' || t.status === 'approved')).reduce((sum, current) => sum + (current.amount || 0), 0);
  const totalGasto = transactions.filter(t => t.type !== 'deposit').reduce((sum, current) => sum + (current.amount || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">
            Extrato <span className="text-[#00D2AD]">Financeiro</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Acompanhe seu histórico de recargas e pagamentos.
          </p>
        </div>
        <Link 
          href="/saldo"
          className="bg-[#00D2AD]/10 hover:bg-[#00D2AD]/20 text-[#00D2AD] px-4 py-2 rounded-lg text-sm font-bold border border-[#00D2AD]/20 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span className="hidden md:inline">Voltar</span>
        </Link>
      </div>

      {/* Dashboard Resumo */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 mb-6">
           <div className="bg-[#1e293b] p-5 rounded-3xl border border-[#334155] relative overflow-hidden group hover:border-green-500/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-center relative z-10">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Recargas (PIX)</p>
                    <h3 className="text-xl md:text-2xl font-black text-green-500">{formatCurrency(totalDepositado)}</h3>
                 </div>
                 <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">📈</div>
              </div>
           </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-[#0f172a]/50 backdrop-blur-xl border border-[#334155] rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#00D2AD] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Carregando movimentações...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-[#334155]">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 md:p-6 hover:bg-gradient-to-r hover:from-[#1e293b] hover:to-transparent transition-all flex items-center justify-between gap-4 group cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    t.type === 'deposit' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {t.type === 'deposit' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight">
                      {t.description}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-gray-500 text-[10px] md:text-xs">
                        {formatDate(t.created_at)}
                      </span>
                      {t.status && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'success' || t.status === 'approved'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {t.status === 'success' || t.status === 'approved' ? 'Concluído' : 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm md:text-lg font-black italic tracking-tight ${
                    t.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {t.type === 'deposit' ? '+' : '-'} {formatCurrency(Math.abs(t.amount || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[#334155]/30 rounded-full flex items-center justify-center text-gray-500">
              <Search size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Nenhuma movimentação</p>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Suas recargas e pagamentos aparecerão aqui assim que você começar a usar sua conta.
              </p>
            </div>
            <Link 
              href="/saldo"
              className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(0,210,173,0.3)]"
            >
              Adicionar Saldo
            </Link>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 items-start">
        <div className="bg-blue-500/20 p-2 rounded-xl text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div className="space-y-1">
          <p className="text-white font-bold text-sm">Dúvida sobre um pagamento?</p>
          <p className="text-gray-400 text-xs">
            Se alguma transação não aparecer ou houver erro, entre em contato com nosso suporte via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
