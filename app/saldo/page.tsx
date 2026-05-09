"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SaldoPage() {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(0); // 0: Method, 1: Amount, 2: QR Code
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentStartTime, setPaymentStartTime] = useState<string | null>(null);
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [payerName, setPayerName] = useState('');
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

    if (!payerName || payerName.trim().length < 3) {
      alert("Por favor, preencha o seu nome (como está no banco) para validação do PIX.");
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
          cpf: cpf.replace(/\D/g, ''),
          payerName: payerName.trim()
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

  const handleGenerateCard = async () => {
    if (!amount || parseFloat(amount) < 12) {
      alert("Valor mínimo para recarga é R$ 12,00");
      return;
    }

    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      alert("Por favor, preencha um CPF ou CNPJ válido para continuar.");
      return;
    }

    if (!payerName || payerName.trim().length < 3) {
      alert("Por favor, preencha o seu nome (como está no banco) para validação.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const response = await fetch('/api/card', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          amount,
          payerName: payerName.trim()
        }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (data.invoiceUrl) {
         // Redirecionar para a página segura do Asaas
         window.location.href = data.invoiceUrl;
      }
      
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar link de cartão: " + error.message);
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
      // Buscamos especificamente pelo ID externo para evitar confusão com outros pagamentos
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('external_id', pixData.id)
        .maybeSingle();


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

        {step === 0 ? (
          <div className="space-y-6 relative z-10 animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-white uppercase tracking-widest text-center mb-6">Escolha a Forma de Pagamento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => { setPaymentMethod('pix'); setStep(1); }}
                className="bg-[#1e293b] border-2 border-[#00D2AD]/50 hover:border-[#00D2AD] hover:bg-[#00D2AD]/10 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-2 shadow-xl group"
              >
                <div className="w-16 h-16 bg-[#00D2AD]/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div className="text-center">
                  <h3 className="text-white font-black text-lg uppercase tracking-widest">Via PIX</h3>
                  <p className="text-[#00D2AD] text-xs font-bold uppercase mt-1">Sem Taxas • Instantâneo</p>
                </div>
              </button>

              <button 
                onClick={() => { setPaymentMethod('card'); setStep(1); }}
                className="bg-[#1e293b] border-2 border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/10 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-2 shadow-xl group"
              >
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  💳
                </div>
                <div className="text-center">
                  <h3 className="text-white font-black text-lg uppercase tracking-widest">Cartão</h3>
                  <p className="text-blue-400 text-xs font-bold uppercase mt-1">Crédito ou Débito</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest mt-6">
              * Pagamentos via Cartão possuem taxa do gateway (1,89% + R$ 0,35)
            </p>
          </div>
        ) : step === 1 ? (
          <div className="space-y-6 relative z-10 animate-in slide-in-from-right duration-300">
            <button 
               onClick={() => setStep(0)} 
               className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
            >
               ← Voltar aos métodos
            </button>
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
              
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 rounded-r-xl flex items-center gap-3 shadow-md">
                <span className="text-amber-500 text-xl animate-pulse">💡</span>
                <p className="text-amber-500/90 text-[10px] leading-relaxed font-black uppercase tracking-widest drop-shadow-sm">
                  O saldo adicionado é de uso exclusivo para compras e ativações na plataforma.
                </p>
              </div>
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

            <div className="mt-6 p-4 bg-[#1e293b] border-2 border-[#00D2AD] rounded-2xl shadow-[0_0_15px_rgba(0,210,173,0.2)]">
              <label className="block text-lg font-black text-[#00D2AD] uppercase tracking-widest mb-3">⚠️ Seu Nome (Como está no seu banco)</label>
              <input 
                type="text" 
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white text-lg font-bold focus:border-[#00D2AD] focus:ring-1 focus:ring-[#00D2AD] transition-all outline-none"
              />
              <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider">Preencha corretamente para confirmarmos seu pagamento rapidamente.</p>
            </div>

            <div className="mt-8">
              {paymentMethod === 'pix' ? (
                <button 
                  onClick={handleGeneratePix}
                  disabled={loading || !amount}
                  className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-tighter transition-all ${
                    loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] shadow-[0_10px_30px_rgba(0,210,173,0.3)] hover:-translate-y-1'
                  }`}
                >
                  {loading ? 'GERANDO PIX...' : 'GERAR PIX (Sem Taxas)'}
                </button>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={handleGenerateCard}
                    disabled={loading || !amount}
                    className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-tighter transition-all ${
                      loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1'
                    }`}
                  >
                    {loading ? 'AGUARDE...' : 'IR PARA PAGAMENTO SEGURO'}
                  </button>
                  <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
                    Você será redirecionado para o Checkout Seguro do Asaas. A taxa (1,89% + R$ 0,35) será somada ao valor final.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300 relative z-10">
            <div className="bg-[#1e293b] border-2 border-[#00D2AD] p-8 rounded-3xl mx-auto shadow-[0_0_30px_rgba(0,210,173,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/5 rounded-full blur-2xl"></div>
               
               <div className="w-16 h-16 bg-[#00D2AD]/10 rounded-full flex items-center justify-center mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
               </div>
               
               <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-2"> CHAVE PIX ALEATÓRIA</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">Esta é a nossa chave oficial. Abra o seu banco e escolha a opção de <strong className="text-white">Transferência PIX</strong>.</p>
               
               <div className="w-full bg-[#0f172a] border border-[#334155] p-4 rounded-xl flex items-center justify-between gap-4">
                  <code className="text-[#00D2AD] text-[10px] md:text-xs font-mono break-all">{pixData?.copy_paste || 'Gerando chave...'}</code>
                  <button 
                    onClick={() => {
                        if (pixData?.copy_paste) {
                          navigator.clipboard.writeText(pixData.copy_paste);
                          alert("Chave Copiada!");
                        }
                    }}
                    className="bg-[#00D2AD] text-[#0f172a] px-4 py-2 rounded-lg font-black text-xs uppercase whitespace-nowrap shadow-md hover:bg-[#00BDA0] transition-colors"
                  >
                    Copiar
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                 <h3 className="text-amber-500 font-black text-lg uppercase tracking-tighter mb-1"> ⚠️ TRANSFIRA EXATAMENTE R$ {amount}</h3>
                 <p className="text-amber-500/80 text-xs font-bold uppercase tracking-wider">O sistema só vai aprovar se o valor transferido for <strong className="text-amber-500 underline">exatamente</strong> igual ao valor gerado aqui no site.</p>
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
