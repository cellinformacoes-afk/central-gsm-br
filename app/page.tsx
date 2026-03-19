"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  
  // Purchase Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [imei, setImei] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (!catError) setCategories(catData || []);

    const { data: servData, error: servError } = await supabase
      .from('services')
      .select('*, categories(name, slug)')
      .eq('active', true);
    
    if (servError) {
      console.error('Error fetching services:', servError);
    } else {
      setServices(servData || []);
    }
    setLoading(false);
  }

  const handlePurchase = async () => {
    if (!selectedService) return;
    setPurchaseLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Call Unified RPC
      const { data: result, error: rpcError } = await supabase.rpc('purchase_service_v2', {
        p_user_id: session.user.id,
        p_service_id: selectedService.id,
        p_input_data: { imei: imei }
      });

      if (rpcError) throw rpcError;

      if (result.status === 'error') {
        alert(result.message);
        if (result.message === 'Saldo insuficiente') router.push('/saldo');
        return;
      }

      if (result.type === 'rental' && result.credentials) {
        alert(`Aluguel realizado com sucesso! Suas credenciais:\n\n📧 ${result.credentials.email}\n🔑 ${result.credentials.password}\n\nVocê também pode vê-las na página 'Meus Pedidos'.`);
      } else if (result.type === 'rental_pending_stock') {
        alert("Pagamento aprovado! No momento estamos sem contas em estoque. O administrador enviará sua conta em breve.");
      } else {
        alert("Pedido realizado com sucesso!");
      }

      setSelectedService(null);
      setImei('');
      router.push('/pedidos');
    } catch (error: any) {
      console.error(error);
      alert("Erro ao processar compra: " + (error.message || "Erro desconhecido"));
    } finally {
      setPurchaseLoading(false);
    }
  };

  const filteredServices = activeCategoryId 
    ? services.filter(s => s.category_id === activeCategoryId)
    : services;

  const getIcon = (slug: string) => {
    switch(slug) {
      case 'aluguel-contas': return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
      case 'creditos': return 'M12 18V6 M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8';
      case 'licencas': return 'M7 11V7a5 5 0 0 1 10 0v4';
      case 'imei': return 'M12 18h.01';
      default: return 'M12 2v20 M2 12h20';
    }
  }

  return (
    <>
      {/* Selection/Purchase Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#1e293b] max-w-md w-full rounded-3xl border border-[#00D2AD]/50 shadow-[0_0_50px_rgba(0,210,173,0.2)] overflow-hidden relative">
              <div className="p-8">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h2 className="text-2xl font-black text-white uppercase italic">{selectedService.title}</h2>
                       <p className="text-[#00D2AD] font-bold text-lg">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                       </p>
                    </div>
                    <button onClick={() => setSelectedService(null)} className="text-gray-500 hover:text-white text-2xl font-bold">×</button>
                 </div>

                 <div className="space-y-6">
                    <p className="text-gray-400 text-sm leading-relaxed">{selectedService.description || "Compre agora este serviço com ativação rápida e suporte garantido."}</p>
                    
                    {/* Conditional Input for IMEI */}
                    {(selectedService.category_id === 4 || selectedService.title.toLowerCase().includes('imei')) && (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Digite o IMEI do Aparelho</label>
                        <input 
                          type="text" 
                          value={imei}
                          onChange={(e) => setImei(e.target.value)}
                          placeholder="EX: 351234567890123"
                          className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white font-mono text-center tracking-[0.2em] focus:border-[#00D2AD] outline-none"
                        />
                      </div>
                    )}

                    <div className="bg-[#112328] p-4 rounded-xl border border-[#00D2AD]/10 text-xs text-gray-400 font-medium">
                       📌 O prazo médio de entrega para este serviço é de <span className="text-[#FFC107] font-black">{selectedService.time_estimate || '30 MINUTOS'}</span>.
                    </div>

                    <button 
                      onClick={handlePurchase}
                      disabled={purchaseLoading}
                      className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-5 rounded-2xl font-black text-lg uppercase tracking-tighter shadow-xl transition-all hover:-translate-y-1"
                    >
                      {purchaseLoading ? 'PROCESSANDO...' : 'CONFIRMAR COMPRA'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Terms Modal ... (Unchanged) */}
      {!termsAccepted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] max-w-2xl w-full rounded-xl neon-modal overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <h2 className="text-xl font-bold text-center text-[#00D2AD] drop-shadow-[0_0_8px_rgba(0,210,173,0.5)] mb-6 uppercase">BEM-VINDO(A) AO CENTRAL GSM!</h2>
              <div className="bg-[#2a1b1e] border border-red-900/50 rounded-lg p-4 text-red-100 italic">
                <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2 underline uppercase tracking-tighter"><span className="text-xl">⚖️</span> TIPICIDADE PENAL PASSÍVEL</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm not-italic opacity-80">
                  <li><strong>Art. 154-A do Código Penal:</strong> Invasão de dispositivo informático</li>
                  <li><strong>Lei 12.737/2012:</strong> Crimes informáticos</li>
                </ul>
              </div>
              <div className="bg-[#112328] border border-[#00D2AD]/20 rounded-lg p-4 text-gray-300">
                <h3 className="text-[#00D2AD] font-bold mb-2 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,210,173,0.5)] uppercase italic tracking-tighter"><span className="text-xl">🚨</span> RESPONSABILIDADE DO USUÁRIO</h3>
                <p className="text-sm leading-relaxed">O uso inadequado das ferramentas após a compra é de <strong className="text-white underline underline-offset-4 decoration-[#00D2AD]">TOTAL responsabilidade do usuário</strong>, podendo responder civil e criminalmente.</p>
              </div>
              <div className="border-2 border-dashed border-[#00D2AD]/40 bg-[#00D2AD]/5 rounded-2xl p-6 mt-6">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} className="w-6 h-6 rounded-lg border-2 border-gray-600 text-[#00D2AD] focus:ring-[#00D2AD] bg-[#0f172a] transition-all" />
                  <span className="text-sm text-gray-200 font-bold group-hover:text-white transition-colors">Declaro que <strong className="text-[#00D2AD]">Li!</strong> e <strong className="text-[#00D2AD]">ESTOU DE ACORDO</strong> com todos os termos.</span>
                </label>
              </div>
            </div>
            <div className="bg-[#151e2e] p-5 border-t border-[#334155] flex justify-between items-center gap-4">
              <button onClick={() => window.location.href = 'https://google.com'} className="bg-[#334155] hover:bg-[#475569] text-white px-8 py-3 rounded-xl font-bold transition-all uppercase text-xs">Sair</button>
              <button onClick={() => checkboxChecked && setTermsAccepted(true)} disabled={!checkboxChecked} className={`px-10 py-3 rounded-xl font-black transition-all uppercase text-xs shadow-lg ${checkboxChecked ? 'bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a]' : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}>Aceito os Termos</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="mb-12 text-center lg:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase italic leading-none">SETORES DE <span className="text-[#00D2AD] drop-shadow-[0_0_10px_rgba(0,210,173,0.3)]">SERVIÇOS</span></h1>
           <p className="text-xs text-gray-500 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <span className="w-6 h-px bg-gray-800"></span> Home <span className="text-gray-800">❯</span> {activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name : 'Catálogo Completo'}
           </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {categories.map((cat) => (
          <div 
            key={cat.id}
            onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
            className={`bg-[#1e293b] rounded-3xl p-8 border-2 transition-all cursor-pointer group text-center shadow-2xl relative overflow-hidden h-full flex flex-col items-center justify-center hover:scale-[1.02] ${
              activeCategoryId === cat.id ? 'border-[#00D2AD] bg-[#0f172a] shadow-[0_0_30px_rgba(0,210,173,0.1)]' : 'border-[#334155] hover:border-[#00D2AD]/50'
            }`}
          >
             <div className="absolute inset-0 bg-gradient-to-br from-[#00D2AD]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className={`w-20 h-20 bg-[#0f172a] rounded-2xl flex items-center justify-center mb-5 border-2 transition-all relative z-10 shadow-inner group-hover:rotate-6 ${
               activeCategoryId === cat.id ? 'border-[#00D2AD] shadow-[0_0_20px_rgba(0,210,173,0.2)]' : 'border-[#334155] group-hover:border-[#00D2AD]/40'
             }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={getIcon(cat.slug)} />
                  {cat.slug === 'imei' && <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />}
                  {cat.slug === 'licencas' && <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />}
                  {cat.slug === 'creditos' && <circle cx="12" cy="12" r="10" />}
                </svg>
             </div>
             <h3 className="text-white font-black text-xl relative z-10 uppercase italic tracking-tighter leading-tight">{cat.name}</h3>
          </div>
        ))}
      </div>

      {/* Services List Header */}
      <div className="mb-10 flex items-center justify-between border-b border-[#334155] pb-6">
        <h2 className="text-3xl font-black text-white flex items-center gap-4 uppercase italic">
           <div className="w-3 h-10 bg-[#00D2AD] rounded-full shadow-[0_0_15px_#00D2AD]"></div>
           {activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name : 'Novidades & Destaques'}
        </h2>
        {activeCategoryId && (
          <button onClick={() => setActiveCategoryId(null)} className="text-[10px] font-black text-[#00D2AD] hover:text-white transition-all uppercase tracking-[0.2em] bg-[#00D2AD]/10 px-6 py-3 rounded-full border border-[#00D2AD]/30">Ver Tudo</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1e293b] rounded-3xl p-6 border border-[#334155] h-32 animate-pulse shadow-2xl"></div>
          ))
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div 
              key={service.id} 
              onClick={() => setSelectedService(service)}
              className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-[#334155] flex items-center hover:shadow-[0_0_40px_rgba(0,210,173,0.1)] hover:-translate-y-2 hover:border-[#00D2AD]/40 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D2AD]/5 blur-[70px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className={`w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center mr-6 ${service.icon_color || 'bg-[#0f172a]'} text-white text-5xl font-black shadow-2xl border-2 border-white/5 relative z-10 group-hover:scale-110 transition-transform`}>
                {service.letter || 'S'}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                 <h3 className="text-[18px] font-black text-gray-100 mb-4 leading-none group-hover:text-[#00D2AD] transition-colors uppercase italic tracking-tighter">{service.title}</h3>
                 
                 <div className="flex items-center gap-4">
                    <span className="text-[#00D2AD] font-black text-2xl drop-shadow-[0_0_5px_rgba(0,210,173,0.3)]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                    </span>
                    {service.time_estimate && (
                      <div className="flex items-center gap-2 bg-[#FFC107]/10 px-3 py-1.5 rounded-lg border border-[#FFC107]/30">
                        <span className="w-2 h-2 rounded-full bg-[#FFC107] animate-pulse"></span>
                        <span className="text-[#FFC107] text-[10px] font-black uppercase tracking-widest">{service.time_estimate}</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-28 text-center bg-[#1e293b]/30 rounded-[40px] border-4 border-dashed border-[#334155] flex flex-col items-center gap-6">
             <div className="w-24 h-24 rounded-full bg-[#1e293b] flex items-center justify-center text-4xl text-gray-700 shadow-inner">📦</div>
             <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-xs">Estoque Vazio para esta categoria</p>
          </div>
        )}
      </div>

      <div className="mt-20 p-12 bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-[50px] border border-[#00D2AD]/20 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-3xl">
         <div className="max-w-xl text-center lg:text-left">
            <h2 className="text-4xl font-black text-white uppercase italic leading-tight mb-4 tracking-tighter">PRECISA DE <span className="text-[#00D2AD]">SUPORTE</span> TÉCNICO?</h2>
            <p className="text-gray-400 font-medium">Nossa equipe de especialistas está pronta para ajudar você com qualquer dúvida ou ativação via WhatsApp.</p>
         </div>
         <a href="https://wa.me/yournumber" className="whitespace-nowrap bg-[#25D366] hover:bg-[#1fb356] text-white px-12 py-6 rounded-[30px] font-black uppercase text-lg shadow-[0_15px_35px_rgba(37,211,102,0.3)] hover:-translate-y-2 transition-all">Falar com Consultor</a>
      </div>
    </>
  )
}
