"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminFaturamentoPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPix, setTotalPix] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [licenseCount, setLicenseCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // en-CA retorna formato YYYY-MM-DD no timezone local
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'admin') router.push('/');
  }

  async function fetchData() {
    setLoading(true);
    const start = new Date(startDate);
    start.setUTCHours(3, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(3, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);

    let allTransactions: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, created_at, profiles(email)')
        .eq('status', 'success')
        .in('type', ['pix', 'credit_card', 'deposit'])
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .range(from, from + step - 1);

      if (error) { console.error(error); hasMore = false; break; }
      if (data && data.length > 0) {
        allTransactions = [...allTransactions, ...data];
        from += step;
        if (data.length < step) hasMore = false;
      } else { hasMore = false; }
    }

    setTransactions(allTransactions);
    let pix = 0; let card = 0;
    allTransactions.forEach(t => {
      const amt = (parseFloat(t.amount) || 0) * 0.988;
      if (t.type === 'pix' || t.type === 'deposit') pix += amt;
      else if (t.type === 'credit_card') card += amt;
    });

    // Buscar pedidos de licencas no periodo (category_id = 3)
    const { data: licOrders } = await supabase
      .from('orders')
      .select('id, services(category_id)')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
    const licCount = licOrders ? licOrders.filter((o: any) => o.services?.category_id === 3).length : 0;
    setLicenseCount(licCount);
    setTotalPix(pix);
    setTotalCard(card);
    setLoading(false);
  }

  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  const descontoLicencas = licenseCount * 50;
  const totalBruto = totalPix + totalCard;
  const lucroLiquido = totalBruto - descontoLicencas;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">RELATORIO DE <span className="text-[#00D2AD]">LUCRO</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Faturamento liquido apos custos de licencas e taxas</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0f172a] p-3 rounded-2xl border border-[#334155]">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 ml-1">De:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#00D2AD]" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 ml-1">Ate:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#00D2AD]" />
            </div>
            <button onClick={fetchData} className="bg-[#00D2AD]/10 hover:bg-[#00D2AD] text-[#00D2AD] hover:text-[#0f172a] mt-4 md:mt-5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-[#00D2AD]/30">Filtrar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-[#00D2AD]/50 shadow-[0_0_30px_rgba(0,210,173,0.1)] relative overflow-hidden group hover:border-[#00D2AD] transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-[#00D2AD] uppercase tracking-widest mb-1">Lucro Liquido</p>
                  <h3 className="text-4xl font-black text-white truncate">{fmt(lucroLiquido)}</h3>
                  {(descontoLicencas > 0) && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[9px] text-gray-500 font-bold">Bruto: <span className="text-gray-400">{fmt(totalBruto)}</span></p>
                      {descontoLicencas > 0 && <p className="text-[9px] text-orange-400 font-bold">- Custo licencas ({licenseCount}x R$50): {fmt(descontoLicencas)}</p>}
                    </div>
                  )}
               </div>
               <div className="w-12 h-12 bg-[#00D2AD]/10 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(0,210,173,0.2)] group-hover:scale-110 transition-transform">💰</div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-[#334155] shadow-xl relative overflow-hidden group hover:border-[#25D366]/50 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total via PIX</p>
                  <h3 className="text-3xl font-black text-[#25D366] truncate">{fmt(totalPix)}</h3>
               </div>
               <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(37,211,102,0.2)] group-hover:scale-110 transition-transform">⚡</div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-3xl border border-[#334155] shadow-[0_0_20px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total via Cartao</p>
                  <h3 className="text-3xl font-black text-blue-400 truncate">{fmt(totalCard)}</h3>
               </div>
               <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">💳</div>
            </div>
         </div>
      </div>

      {(descontoLicencas > 0) && (
        <div className="mb-6 bg-[#1e293b]/50 border border-[#334155] rounded-2xl p-4 flex flex-wrap gap-6 text-xs font-bold text-gray-400">
          <span>Total bruto: <span className="text-white">{fmt(totalBruto)}</span></span>
          {descontoLicencas > 0 && <span className="text-orange-400">Custo licencas ({licenseCount} venda{licenseCount !== 1 ? 's' : ''} x R$50): -{fmt(descontoLicencas)}</span>}
          <span className="text-[#00D2AD]">Lucro liquido: {fmt(lucroLiquido)}</span>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-3xl border border-[#334155] overflow-hidden">
        <div className="p-6 border-b border-[#334155]">
          <h2 className="text-xl font-black text-white uppercase italic">HISTORICO DE <span className="text-[#00D2AD]">PAGAMENTOS</span></h2>
        </div>
        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">Carregando Dados...</div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-[#334155]">
                  <th className="p-4">Data</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Metodo</th>
                  <th className="p-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors">
                    <td className="p-4 text-xs font-mono text-gray-400 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="p-4 text-sm font-bold text-white">{tx.profiles?.email || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${(tx.type === 'pix' || tx.type === 'deposit') ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-blue-500/20 text-blue-400'}`}>
                        {(tx.type === 'pix' || tx.type === 'deposit') ? 'PIX' : 'CARTAO'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm font-black text-[#00D2AD]">{fmt((parseFloat(tx.amount) || 0) * 0.988)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum pagamento encontrado neste periodo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
