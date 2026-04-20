"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminFraudesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('fraud_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setLogs(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            Controle de <span className="text-red-500">Fraudes</span> 🚫
          </h1>
          <p className="text-gray-400 font-medium">Histórico de contestações de Pix e Cartão (Auto-Ban)</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Evento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Carregando histórico...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhuma fraude detectada até o momento. ✅</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-bold">{log.user_email}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{log.user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400 font-mono">
                        {log.user_cpf || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#00D2AD] font-mono bg-[#00D2AD]/10 px-2 py-1 rounded">
                        {log.payment_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-red-400 font-black">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(log.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                        log.event_type === 'CHARGEBACK' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {log.event_type === 'CHARGEBACK' ? 'Contestação (MED)' : 'Estorno'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
        <h3 className="text-red-500 font-black uppercase text-sm mb-2 flex items-center gap-2">
           💡 Como funciona a proteção automática?
        </h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2"><span>•</span> Quando o Asaas envia um alerta de contestação (MED) ou estorno, o sistema reage em milissegundos.</li>
          <li className="flex gap-2"><span>•</span> O valor é debitado do saldo do cliente imediatamente (mesmo que fique negativo).</li>
          <li className="flex gap-2"><span>•</span> O CPF do cliente é enviado para a Blacklist e a conta é excluída dos dados de login.</li>
          <li className="flex gap-2"><span>•</span> Este cliente nunca mais conseguirá logar ou se cadastrar com o mesmo documento.</li>
        </ul>
      </div>
    </div>
  );
}
