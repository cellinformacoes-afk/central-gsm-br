"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('TUDO');
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
    
    // Fetch Categories
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    setCategories(catData || []);

    // Join orders with profiles, services and rentals
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (email),
        services:service_id (category_id),
        rentals:rentals(credentials, expires_at)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setOrders(data || []);
    } else {
      console.error("Erro ao buscar pedidos:", error);
    }
    setLoading(false);
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Tem certeza que deseja CANCELAR este pedido e ESTORNAR o saldo para o cliente?')) return;

    try {
      const { data, error } = await supabase.rpc('cancel_order_v2', { p_order_id: orderId });
      
      if (error) throw error;
      
      if (data.status === 'success') {
        alert(data.message);
        fetchData(); // Recarregar dados
      } else {
        alert('Erro: ' + data.message);
      }
    } catch (err: any) {
      console.error('Erro ao cancelar:', err);
      alert('Falha ao cancelar pedido: ' + err.message);
    }
  }

  async function handleCompleteOrder(orderId: string) {
    if (!confirm('Deseja marcar este pedido como CONCLUÍDO (Entregue)?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Concluído' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      alert('Pedido marcado como concluído!');
      fetchData(); // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao concluir:', err);
      alert('Falha ao concluir pedido: ' + err.message);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.input_data?.imei?.includes(searchTerm) ||
      order.input_data?.account_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategoryId === null || order.services?.category_id === activeCategoryId;
    
    const matchesStatus = statusFilter === 'TUDO' || 
                         (statusFilter === 'PENDENTES' && order.status?.toLowerCase() === 'pendente') ||
                         (statusFilter === 'CONCLUÍDOS' && (order.status?.toLowerCase() === 'concluído' || order.status?.toLowerCase() === 'completed')) ||
                         (statusFilter === 'CANCELADOS' && order.status?.toLowerCase() === 'cancelado');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'concluído': return 'bg-[#00D2AD]/20 text-[#00D2AD]';
      case 'completed': return 'bg-[#00D2AD]/20 text-[#00D2AD]';
      case 'paid': return 'bg-[#00D2AD]/20 text-[#00D2AD]';
      case 'pendente': return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelado': return 'bg-red-500/20 text-red-500';
      case 'failed': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Admin Nav */}
      <div className="flex gap-4 mb-10 border-b border-[#334155] pb-4 overflow-x-auto no-scrollbar">
         <Link href="/admin/pedidos" className="text-[#00D2AD] border-b-2 border-[#00D2AD] font-black uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">🛒 Pedidos</Link>
         <Link href="/admin/estoque" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">📦 Gestão de Estoque</Link>
         <Link href="/admin/servicos" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">🛠️ Gerenciar Serviços</Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">HISTÓRICO DE <span className="text-[#00D2AD]">PEDIDOS</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Visualize todas as vendas do site</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="PESQUISAR CLIENTE OU IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-10 text-xs font-bold text-white uppercase tracking-widest focus:border-[#00D2AD] outline-none transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-[#334155] mb-8 w-fit">
        {['TUDO', 'PENDENTES', 'CONCLUÍDOS', 'CANCELADOS'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === status 
                ? 'bg-[#334155] text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setActiveCategoryId(null)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryId === null ? 'bg-[#334155] text-white border border-[#475569]' : 'bg-[#0f172a] text-gray-500 border border-[#334155] hover:text-gray-300'}`}
          >
            TODOS OS SETORES
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-[#00D2AD] text-[#0f172a] border border-[#00D2AD]/50 shadow-[0_0_20px_rgba(0,210,173,0.3)]' : 'bg-[#0f172a] text-gray-500 border border-[#334155] hover:text-[#00D2AD]'}`}
            >
              {cat.name}
            </button>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse uppercase font-black tracking-widest">Carregando Pedidos...</div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const rental = order.rentals && order.rentals.length > 0 ? order.rentals[0] : null;
            
            return (
              <div key={order.id} className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] hover:border-[#00D2AD]/30 transition-all group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-[#334155] flex items-center justify-center text-2xl group-hover:scale-110 transition-all shadow-xl flex-shrink-0">
                      {order.service_title?.toLowerCase().includes('credito') ? '💰' : 
                       order.service_title?.toLowerCase().includes('imei') ? '📱' : 
                       order.service_title?.toLowerCase().includes('aluguel') ? '🔑' : '📦'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 overflow-x-auto whitespace-nowrap no-scrollbar">
                        <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">{order.service_title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Comprado por: <span className="text-gray-300">{order.profiles?.email}</span></p>
                      
                      {/* Input Data / Specialized Fields */}
                      <div className="flex flex-wrap gap-3">
                        {order.input_data?.account_email && (
                          <div className="bg-[#00D2AD]/10 border border-[#00D2AD]/20 px-3 py-1.5 rounded-lg">
                            <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">E-mail Destino:</p>
                            <p className="text-[#00D2AD] font-black text-xs uppercase underline underline-offset-2">{order.input_data.account_email}</p>
                          </div>
                        )}
                        {order.input_data?.imei && (
                          <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                            <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">IMEI:</p>
                            <p className="text-blue-400 font-black text-xs font-mono tracking-widest">{order.input_data.imei}</p>
                          </div>
                        )}
                        {order.input_data?.quantity && (
                          <div className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
                            <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Qtd:</p>
                            <p className="text-white font-black text-xs">{order.input_data.quantity} un</p>
                          </div>
                        )}

                        {/* RENTAL DETAILS (CREDENTIALS) */}
                        {rental && (
                          <>
                            <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                              <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Login Entregue:</p>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-purple-400 font-black text-xs tracking-tight">E: {rental.credentials?.email}</p>
                                <p className="text-purple-400 font-black text-xs tracking-tight">S: {rental.credentials?.password}</p>
                              </div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                              <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Expiração:</p>
                              <p className="text-red-400 font-black text-xs">{new Date(rental.expires_at).toLocaleString('pt-BR')}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center min-w-[120px]">
                    <p className="text-white font-black text-2xl tracking-tighter italic">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}
                    </p>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1 mb-4">
                      Comprado em: {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>

                    {order.status?.toLowerCase() === 'pendente' && (
                      <div className="flex flex-col gap-2 w-full">
                        <button 
                          onClick={() => handleCompleteOrder(order.id)}
                          className="bg-[#00D2AD]/10 hover:bg-[#00D2AD] text-[#00D2AD] hover:text-[#0f172a] border border-[#00D2AD]/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D2AD]/20"
                        >
                          ✅ CONCLUIR ENTREGA
                        </button>
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-red-500/20"
                        >
                          ❌ CANCELAR E ESTORNAR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
