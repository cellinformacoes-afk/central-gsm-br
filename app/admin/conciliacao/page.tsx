"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function ConciliacaoPage() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isTest, setIsTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
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

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !amount) {
      alert('Por favor, preencha o e-mail e o valor.');
      return;
    }

    if (!confirm(`Deseja adicionar R$ ${amount} na conta de ${email}?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/credit-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          amount: parseFloat(amount),
          isTest
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setEmail('');
        setAmount('');
        setIsTest(false);
      } else {
        alert('Erro: ' + (result.error || 'Falha ao creditar'));
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          ADICIONAR SALDO <span className="text-[#00D2AD]">MANUAL</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
          Adicione saldo diretamente na conta de um cliente de forma rápida.
        </p>
      </div>

      <div className="max-w-xl bg-[#0f172a]/50 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2AD]/5 blur-[100px] rounded-full pointer-events-none" />

        <form onSubmit={handleCredit} className="relative z-10 flex flex-col gap-6">
          
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">
              E-mail do Cliente
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
              placeholder="cliente@email.com" 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">
              Valor a Adicionar (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">R$</span>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-black text-lg"
                placeholder="0.00" 
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-[#1e293b]/50 border border-white/5 rounded-xl cursor-pointer hover:bg-[#1e293b] transition-all">
            <input 
              type="checkbox" 
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              className="w-5 h-5 accent-[#00D2AD] rounded bg-black/40 border-white/10"
            />
            <div>
              <span className="block text-sm font-black text-white uppercase tracking-tighter">
                Isso é um Teste ou Cortesia
              </span>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                Marque para NÃO contar nas vendas de hoje.
              </span>
            </div>
          </label>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-[#00D2AD] text-[#0f172a] hover:bg-[#00BDA0] shadow-[0_10px_20px_rgba(0,210,173,0.2)] hover:-translate-y-1'
            }`}
          >
            {loading ? 'PROCESSANDO...' : 'CREDITAR SALDO AGORA'}
            {!loading && <span className="text-lg">💰</span>}
          </button>
        </form>
      </div>

      <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl max-w-xl">
        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <span>💡</span> Como usar esta tela
        </p>
        <p className="text-gray-400 text-xs leading-relaxed font-medium">
          Se o cliente fez um PIX e o Asaas falhou em avisar o sistema, basta colocar o e-mail dele e o valor. Como foi uma venda real, deixe a caixinha <strong>desmarcada</strong> para que conte no seu "Entradas Hoje". Se for apenas um teste, marque a caixinha!
        </p>
      </div>
    </div>
  );
}
