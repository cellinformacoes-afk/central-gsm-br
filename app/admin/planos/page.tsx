"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPlanosPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchRequests();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
    }
  }

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from("plan_purchase_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setRequests(data || []);
    } else {
      console.error("Error fetching plan requests:", error);
    }
    setLoading(false);
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm("Deseja realmente APROVAR esta solicitação de plano?")) return;
    setActionLoadingId(requestId);

    try {
      const { data, error } = await supabase.rpc("approve_plan_purchase_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      alert("Solicitação aprovada com sucesso! O plano do usuário está ativo.");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao aprovar plano: " + (err.message || "Erro desconhecido"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Deseja realmente REJEITAR esta solicitação de plano?")) return;
    setActionLoadingId(requestId);

    try {
      const { error } = await supabase
        .from("plan_purchase_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      alert("Solicitação rejeitada com sucesso.");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao rejeitar solicitação: " + (err.message || "Erro desconhecido"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Aprovado
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Rejeitado
          </span>
        );
      case "pending":
      default:
        return (
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            Pendente
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Admin Nav */}
      <div className="flex gap-4 mb-10 border-b border-[#334155] pb-4">
        <Link href="/admin/estoque" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2">
          📦 Gestão de Estoque
        </Link>
        <Link href="/admin/servicos" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2">
          🛠️ Gerenciar Serviços
        </Link>
        <Link href="/admin/planos" className="text-[#00D2AD] border-b-2 border-[#00D2AD] font-black uppercase text-xs tracking-widest px-4 py-2">
          💳 Solicitações de Planos
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          SOLICITAÇÕES DE <span className="text-[#00D2AD]">PLANOS</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
          Aprove ou rejeite as requisições de assinaturas enviadas pelos clientes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse font-black uppercase tracking-widest">
          Carregando Solicitações...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-[#1e293b] rounded-3xl p-12 text-center border border-[#334155]">
          <span className="text-4xl block mb-4">💳</span>
          <p className="text-gray-400 font-bold uppercase text-sm tracking-wider">
            Nenhuma solicitação de plano encontrada no banco de dados.
          </p>
        </div>
      ) : (
        <div className="bg-[#1e293b] rounded-3xl border border-[#334155] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0f172a]/50 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-6">Cliente (E-mail)</th>
                  <th className="p-6">Plano Solicitado</th>
                  <th className="p-6">Valor Mensal</th>
                  <th className="p-6">Data Solicitação</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/40 text-sm font-medium text-white">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-gray-200">{request.user_email}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{request.user_id}</div>
                    </td>
                    <td className="p-6 font-bold uppercase tracking-wider text-xs">
                      {request.plan_name === "premium" ? "⭐ Premium" : "🔹 Básico"}
                    </td>
                    <td className="p-6 font-bold text-[#00D2AD]">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(request.cost)}
                    </td>
                    <td className="p-6 text-xs text-gray-400">
                      {new Date(request.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-6 text-center">{getStatusBadge(request.status)}</td>
                    <td className="p-6 text-right">
                      {request.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleApprove(request.id)}
                            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-[#0f172a] font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors"
                          >
                            {actionLoadingId === request.id ? "..." : "Aprovar"}
                          </button>
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleReject(request.id)}
                            className="bg-[#334155] hover:bg-red-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-2">
                          Finalizado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
