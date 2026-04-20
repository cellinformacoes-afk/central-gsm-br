"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminAssinaturasPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchRequests();
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

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    if (!confirm("Confirmar aprovação deste plano? O saldo será descontado do cliente.")) return;
    
    setProcessingId(id);
    try {
      const { data, error } = await supabase.rpc('approve_plan_purchase_request', {
        p_request_id: id
      });

      if (error) throw error;
      if (data.success === false) {
        alert(data.error);
      } else {
        alert("Plano aprovado com sucesso!");
        fetchRequests();
      }
    } catch (e: any) {
      alert("Erro ao aprovar: " + (e.message || "Erro desconhecido"));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Deseja realmente recusar este pedido?")) return;

    setProcessingId(id);
    const { error } = await supabase
      .from('plan_purchase_requests')
      .update({ status: 'rejected', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      alert("Pedido recusado.");
      fetchRequests();
    } else {
      alert("Erro ao recusar: " + error.message);
    }
    setProcessingId(null);
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">CONTROLE DE <span className="text-[#00D2AD]">ASSINATURAS</span> 💎</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Aprovação manual de planos e monitoramento de expirações</p>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitação</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano / Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Vigência</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse uppercase font-black tracking-widest">Carregando pedidos...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhum pedido de assinatura encontrado.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(req.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-bold">{req.user_email}</span>
                        <span className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase">{req.user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#00D2AD] font-black uppercase italic tracking-tighter">{req.plan_name}</span>
                        <span className="text-xs text-white/50 font-bold">R$ {req.cost.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded w-fit uppercase tracking-widest ${
                          req.status === 'pending' ? 'bg-orange-500/20 text-orange-500' :
                          req.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {req.status === 'pending' ? 'Pendente' : 
                           req.status === 'approved' ? 'Ativo' : 'Recusado'}
                        </span>
                        {req.status === 'approved' && (
                          <div className="flex flex-col text-[9px]">
                            <span className="text-gray-500 font-bold">INÍCIO: {formatDate(req.approved_at)}</span>
                            <span className="text-green-400 font-black">FIM: {formatDate(req.expiration_date)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={!!processingId}
                            className="bg-green-600 hover:bg-green-500 text-white font-black text-[9px] uppercase px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={!!processingId}
                            className="bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                          >
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 font-black uppercase italic">Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
