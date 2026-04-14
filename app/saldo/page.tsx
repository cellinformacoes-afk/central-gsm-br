"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SaldoPage() {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1); // 1: Choose amount, 2: PIX QR Code
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentStartTime, setPaymentStartTime] = useState<string | null>(null);
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) {
          setProfile(data);
          if (data.cpf) setCpf(data.cpf);
        }
      }
    };
    fetchProfile();
  }, []);

  // Polling automático a cada 10 segundos quando o QR Code está visível
  useEffect(() => {
    let interval: any;
    if (step === 2 && pixData?.id) {
      interval = setInterval(() => {
        console.log("Polling automático para o pagamento:", pixData.id);
        checkPaymentStatus(true); // pass true to avoid alert on fail
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [step, pixData]);

  const handleGeneratePix = async () => {
    if (!amount || parseFloat(amount) < 12) {
      alert("Valor mínimo para recarga é R$ 12,00");
      return;
    }

    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      alert("Por favor, preencha um CPF ou CNPJ válido para continuar.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          description: `Recarga Central GSM - R$ ${amount}`,
          userId: session.user.id,
          cpf: cpf.replace(/\D/g, '')
        }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setPixData(data);
      setPaymentStartTime(new Date().toISOString());
      setStep(2);
      
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar Pix: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    console.log("Iniciando verificação de pagamento. pixData:", pixData);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Tentar verificar DIRETAMENTE no Mercado Pago via nossa nova API
      if (pixData?.id) {
        console.log("Chamando /api/pix/check para ID:", pixData.id);
        const checkRes = await fetch(`/api/pix/check?id=${pixData.id}&userId=${session.user.id}&t=${Date.now()}`);
        const checkData = await checkRes.json();
        console.log("Resultado do /api/pix/check:", checkData);
        
        if (checkData.status === 'approved' || checkData.status === 'already_processed') {
          router.push('/saldo/sucesso?amount=' + (checkData.amount || amount));
          return;
        }
      } else {
        console.warn("pixData.id não encontrado, pulando verificação direta.");
      }

      // 2. Fallback: Verificar se a transação já foi registrada no Banco de Dados (pelo webhook)
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gt('created_at', paymentStartTime || new Date(0).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transaction && transaction.status === 'success') {
        console.log("Pagamento detectado no DB!");
        router.push('/saldo/sucesso?amount=' + (transaction.amount || amount));
      } else if (!isAuto) {
        alert("Pagamento ainda não detectado. Se você já pagou, aguarde 30 segundos e tente novamente. Se o problema persistir, entre em contato com o suporte.");
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-[#1e293b] rounded-3xl p-8 border border-[#334155] shadow-2xl relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2AD]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <h1 className="text-3xl font-black text-white mb-2 uppercase italic">ADICIONAR SALDO</h1>
        <p className="text-gray-400 text-sm mb-8 font-medium">Recarregue sua conta instantaneamente via PIX.</p>

        {step === 1 ? (
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quanto deseja adicionar?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00D2AD] font-black text-xl">R$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 pl-12 pr-4 text-white text-2xl font-black focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD] transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">* Mínimo R$ 12,00</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[20, 50, 100].map((val) => (
                <button 
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="bg-[#0f172a] border border-[#334155] hover:border-[#00D2AD] text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-1"
                >
                  + R$ {val}
                </button>
              ))}
            </div>

            {!profile?.cpf && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">CPF ou CNPJ (Obrigatório Asaas)</label>
                <input 
                  type="text" 
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white text-lg font-bold focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD] transition-all outline-none"
                />
              </div>
            )}

            <button 
              onClick={handleGeneratePix}
              disabled={loading || !amount}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-tighter transition-all ${
                loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] shadow-[0_10px_30px_rgba(0,210,173,0.3)]'
              }`}
            >
              {loading ? 'GERANDO PIX...' : 'GERAR QR CODE PIX'}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300 relative z-10">
            <div className="bg-white p-4 rounded-3xl w-64 h-64 mx-auto shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center border-4 border-[#00D2AD]">
               {pixData?.qr_code_base64 ? (
                 <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-full h-full object-contain" />
               ) : (
                 <div className="w-full h-full bg-[#1e293b] rounded-xl flex items-center justify-center relative overflow-hidden">
                    <span className="text-white font-black text-center text-xs opacity-20 uppercase tracking-[0.5em] rotate-12 absolute">PIX PIX PIX PIX PIX PIX</span>
                    <div className="w-16 h-16 bg-[#00D2AD] rounded-lg shadow-[0_0_20px_#00D2AD] flex items-center justify-center animate-pulse">
                       <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20 M2 12h20"/></svg>
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <h3 className="text-white font-black text-xl uppercase tracking-tighter"> Escaneie o QR Code acima</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto">Ou utilize o código Copia e Cola abaixo para realizar o pagamento no seu banco.</p>
               
               <div className="bg-[#0f172a] border border-[#334155] p-4 rounded-xl flex items-center justify-between gap-4">
                  <code className="text-[#00D2AD] text-[10px] font-mono truncate">{pixData?.copy_paste || 'Gerando código...'}</code>
                  <button 
                    onClick={() => {
                        if (pixData?.copy_paste) {
                          navigator.clipboard.writeText(pixData.copy_paste);
                          alert("Código Copiado!");
                        }
                    }}
                    className="bg-[#00D2AD] text-[#0f172a] px-4 py-2 rounded-lg font-black text-xs uppercase whitespace-nowrap"
                  >
                    Copiar
                  </button>
               </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
               <button 
                onClick={() => checkPaymentStatus()}
                disabled={loading}
                className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-4 rounded-2xl font-black uppercase text-sm shadow-[0_10px_20px_rgba(0,210,173,0.2)] transition-all"
               >
                 {loading ? 'VERIFICANDO...' : 'JÁ PAGUEI / VERIFICAR AGORA'}
               </button>
               <button 
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
               >
                 Voltar e Alterar Valor
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-[#112328] border border-[#00D2AD]/20 rounded-2xl p-6 flex items-center gap-4">
         <div className="w-12 h-12 rounded-full bg-[#00D2AD]/10 flex items-center justify-center text-2xl text-[#00D2AD]">🛡️</div>
         <div>
            <h4 className="text-white font-black text-sm uppercase">Pagamento 100% Seguro</h4>
            <p className="text-gray-500 text-xs">Seu saldo é creditado instantaneamente após a confirmação do PIX.</p>
         </div>
      </div>
    </div>
  );
}
