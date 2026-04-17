"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function CountdownTimer({ expiryDate }: { expiryDate: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiryDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft('EXPIRADO');
        clearInterval(timer);
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  return (
    <span className={`text-[11px] font-black ${timeLeft === 'EXPIRADO' ? 'text-red-500' : 'text-[#FFC107] animate-pulse'}`}>
      {timeLeft}
    </span>
  );
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, services(title, download_url), rentals(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  const filteredOrders = orders.filter(order => 
    order.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.input_data?.imei?.includes(searchTerm)
  );

  const totalSpent = orders.filter(o => o.status === 'Concluído').reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'Concluído').length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente' || o.status === 'Em Andamento').length;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">MEUS <span className="text-[#00D2AD]">PEDIDOS</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-8 h-px bg-gray-800"></span> Gerencie suas ativações e compras
           </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Pesquisar por IMEI ou Serviço..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD]/50 outline-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:border-[#00D2AD]/30 hover:shadow-[0_0_20px_rgba(0,210,173,0.1)]"
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:stroke-[#00D2AD] transition-colors"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      {/* 🚀 DASHBOARD CLIENTE 🚀 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 rounded-3xl border border-[#334155] relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-center relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Concluídos</p>
                  <h3 className="text-2xl font-black text-white">{completedOrders}</h3>
               </div>
               <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">✅</div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 rounded-3xl border border-[#334155] relative overflow-hidden group hover:border-[#FFC107]/50 transition-all shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFC107]/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-center relative z-10">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Em Processamento</p>
                  <h3 className="text-2xl font-black text-white">{pendingOrders}</h3>
               </div>
               <div className="w-12 h-12 bg-[#FFC107]/10 rounded-2xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,193,7,0.2)] group-hover:scale-110 transition-transform">⏳</div>
            </div>
         </div>
      </div>

      <div className="bg-[#1e293b] rounded-[32px] border border-[#334155] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a]/50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Pedido</th>
                <th className="px-6 py-6">Data</th>
                <th className="px-6 py-6">IMEI / Detalhes</th>
                <th className="px-6 py-6">Valor</th>
                <th className="px-6 py-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/30">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-16 bg-[#1e293b]/50"></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gradient-to-r hover:from-[#1e293b] hover:to-[#0f172a] hover:shadow-[0_5px_15px_rgba(0,210,173,0.05)] transition-all group relative border-b border-[#334155]/30 hover:border-transparent">
                    <td className="px-8 py-7">
                       <div className="flex flex-col">
                          <span className="text-white font-black text-sm uppercase italic group-hover:text-[#00D2AD] transition-colors">{order.service_title || order.services?.title || 'Serviço Removido'}</span>
                          <span className="text-gray-500 text-[10px] font-mono mt-1">ID: #{order.id.slice(0, 8)}</span>
                       </div>
                    </td>
                    <td className="px-6 py-7">
                       <span className="text-gray-400 text-xs font-bold">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-7">
                       <div className="flex flex-wrap gap-2">
                          {order.input_data?.imei && (
                            <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-0.5">IMEI</p>
                               <span className="text-blue-400 text-xs font-mono font-bold tracking-wider">{order.input_data.imei}</span>
                            </div>
                          )}
                          {order.input_data?.account_email && (
                            <div className="bg-[#00D2AD]/10 border border-[#00D2AD]/20 px-3 py-1.5 rounded-lg">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-0.5">E-mail Conta</p>
                               <span className="text-[#00D2AD] text-[10px] font-black uppercase">{order.input_data.account_email}</span>
                            </div>
                          )}
                          {order.input_data?.quantity && (
                            <div className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-0.5">Qtd</p>
                               <span className="text-white text-xs font-black">{order.input_data.quantity}x</span>
                            </div>
                          )}
                          {!order.input_data?.imei && !order.input_data?.account_email && !order.input_data?.quantity && (
                             <span className="text-gray-500 text-xs font-bold uppercase tracking-widest italic opacity-50">S/ DETALHES</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-7">
                       <span className="text-white font-black text-sm">R$ {order.total_price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-7 text-center">
                       <div className="flex flex-col items-center gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                            order.status === 'Concluído' ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30' :
                            order.status === 'Rejeitado' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                            'bg-[#FFC107]/20 text-[#FFC107] border border-[#FFC107]/30 shadow-[0_0_10px_rgba(255,193,7,0.1)]'
                          }`}>
                            {order.status}
                          </span>
                          
                          {/* Botão para ver credenciais se for aluguel */}
                          {order.rentals && order.rentals.length > 0 && (
                            <div className="mt-3 bg-[#0f172a] p-4 rounded-xl border border-[#00D2AD]/30 text-left min-w-[200px] animate-in zoom-in duration-300">
                               <p className="text-[#00D2AD] text-[10px] font-black uppercase tracking-tighter mb-2">🔑 Dados de Acesso</p>
                               <div className="space-y-1">
                                  <p className="text-white text-xs font-mono">Email: {order.rentals[0].credentials.email}</p>
                                  <p className="text-white text-xs font-mono">Senha: {order.rentals[0].credentials.password}</p>
                               </div>
                               <div className="mt-4 pt-4 border-t border-[#334155] flex items-center justify-between">
                                  <span className="text-gray-500 text-[9px] uppercase font-bold">Expira em:</span>
                                  <CountdownTimer expiryDate={order.rentals[0].expires_at} />
                               </div>
                            </div>
                          )}

                          {/* Botão de Download para Arquivos e Métodos */}
                          {order.status === 'Concluído' && order.services?.download_url && (
                             <a 
                               href={order.services.download_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="mt-3 w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_10px_20px_rgba(0,210,173,0.2)] transition-all flex items-center justify-center gap-2"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                               BAIXAR ARQUIVO / ACESSAR
                             </a>
                           )}
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#0f172a] flex items-center justify-center text-3xl">📝</div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Você ainda não realizou nenhum pedido.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 bg-[#112328] border border-[#00D2AD]/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00D2AD]/10 flex items-center justify-center text-3xl text-[#00D2AD]">💡</div>
            <div>
               <h4 className="text-white font-black text-lg uppercase italic">Dica Importante</h4>
               <p className="text-gray-500 text-sm">O prazo médio de processamento é de 30 minutos em horário comercial.</p>
            </div>
         </div>
         <button onClick={() => window.location.reload()} className="bg-[#00D2AD] text-[#0f172a] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:-translate-y-1 transition-all">Atualizar Histórico</button>
      </div>
    </div>
  );
}
