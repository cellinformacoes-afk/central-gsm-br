"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  // Terms Modal State (com persistência de sessão para não aparecer toda vez no menu 'Início')
  const [termsAccepted, setTermsAccepted] = useState(true); // default true to avoid hydration mismatch/flash
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = sessionStorage.getItem('termsAccepted');
      if (!accepted) setTermsAccepted(false);
    }
  }, []);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  
  // Purchase Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [imei, setImei] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  
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

    // Basic Validation
    if (selectedService.categories?.slug === 'creditos' && !accountEmail) {
      alert("Por favor, informe o e-mail da conta onde os créditos serão adicionados.");
      return;
    }
    if (selectedService.category_id === 4 && !imei) {
      alert("Por favor, informe o IMEI do aparelho.");
      return;
    }

    setPurchaseLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Call Unified RPC with quantity
      const { data: result, error: rpcError } = await supabase.rpc('purchase_service_v2', {
        p_user_id: session.user.id,
        p_service_id: selectedService.id,
        p_input_data: { imei: imei, account_email: accountEmail },
        p_quantity: quantity
      });

      if (rpcError) throw rpcError;

      if (result.status === 'error') {
        if (result.message === 'Saldo insuficiente') {
          setSelectedService(null);
          setImei('');
          setQuantity(1);
          setPurchaseLoading(false);
          setShowInsufficientBalance(true);
          return;
        }
        alert(result.message);
        setSelectedService(null);
        setImei('');
        setQuantity(1);
        setPurchaseLoading(false);
        return;
      }

      const lastResult = result;

      if (lastResult.type === 'rental' && lastResult.credentials) {
        alert(`Aluguel realizado com sucesso! Suas credenciais:\n\n📧 ${lastResult.credentials.email}\n🔑 ${lastResult.credentials.password}\n\nVocê também pode vê-las na página 'Meus Pedidos'.`);
      } else if (lastResult.type === 'rental_pending_stock') {
        alert("Pagamento aprovado! No momento estamos sem contas em estoque. O administrador enviará sua conta em breve.");
      } else {
        alert(quantity > 1 ? `Pedido de ${quantity} unidades realizado com sucesso!` : "Pedido realizado com sucesso!");
      }

      setSelectedService(null);
      setImei('');
      setAccountEmail('');
      setQuantity(1);
      router.push('/pedidos');
    } catch (error: any) {
      console.error(error);
      alert("Erro ao processar compra: " + (error.message || "Erro desconhecido"));
    } finally {
      setPurchaseLoading(false);
    }
  };

  const filteredServices = services
    .filter(s => !activeCategoryId || s.category_id === activeCategoryId)
    .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getIcon = (slug: string) => {
    switch(slug) {
      case 'aluguel-contas': return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
      case 'creditos': return 'M12 18V6 M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8';
      case 'licencas': return 'M7 11V7a5 5 0 0 1 10 0v4';
      case 'imei': return 'M12 18h.01';
      case 'arquivos': return 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z';
      case 'metodos': return 'M22 10v6M2 10v6';
      default: return 'M12 2v20 M2 12h20';
    }
  }

  return (
    <>
      {/* Selection/Purchase Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#0f172a]/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="flex min-h-full items-center justify-center py-4 text-center">
              <div className="bg-[#1e293b] max-w-md w-full rounded-3xl border border-[#00D2AD]/50 shadow-[0_0_50px_rgba(0,210,173,0.2)] relative text-left">
                  <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h2 className="text-2xl font-black text-white uppercase italic">{selectedService.title}</h2>
                           <p className="text-[#00D2AD] font-bold text-lg">
                              {selectedService.category_id === 9 ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                           </p>
                        </div>
                        <button onClick={() => { setSelectedService(null); setAccountEmail(''); setImei(''); }} className="text-gray-500 hover:text-white text-2xl font-bold">×</button>
                     </div>

                     <div className="space-y-6">
                        <p className="text-gray-400 text-sm leading-relaxed">{selectedService.description || "Compre agora este serviço com ativação rápida e suporte garantido."}</p>
                        
                        {/* Quantity Selector (Apenas para Créditos) */}
                        {selectedService.categories?.slug === 'creditos' && (
                          <>
                            <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#334155]/50 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Quantidade</span>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                  <span className="text-[#00D2AD]">{quantity}</span> <span className="text-sm text-gray-400">x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-[#1e293b] rounded-xl p-1 border border-[#334155]">
                                <button 
                                  onClick={() => setQuantity(Math.max(5, quantity - 1))}
                                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-gray-400 hover:text-white hover:bg-[#334155] transition-all"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                                </button>
                                <span className="w-8 text-center font-black text-white">{quantity}</span>
                                <button 
                                  onClick={() => setQuantity(quantity + 1)}
                                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-gray-400 hover:text-[#00D2AD] hover:bg-[#334155] transition-all"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-[#112328] p-4 rounded-xl border border-[#00D2AD]/20">
                              <span className="text-sm font-bold text-gray-300 uppercase">Total a Pagar:</span>
                              <span className="text-2xl font-black text-[#00D2AD] drop-shadow-[0_0_8px_rgba(0,210,173,0.4)]">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price * quantity)}
                              </span>
                            </div>

                            {/* Account Email Field for Credits */}
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">E-mail da Conta (Destino dos Créditos)</label>
                              <input 
                                type="email" 
                                value={accountEmail}
                                onChange={(e) => setAccountEmail(e.target.value)}
                                placeholder="DIGITE O E-MAIL"
                                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white font-bold text-center focus:border-[#00D2AD] outline-none transition-all"
                              />
                            </div>
                          </>
                        )}
                        
                        {/* Conditional Input for IMEI (Only for IMEI Category) */}
                        {selectedService.category_id === 4 && (
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

                        {selectedService.category_id !== 9 && (
                          <div className="bg-[#112328] p-4 rounded-xl border border-[#00D2AD]/10 text-xs text-gray-400 font-medium">
                             📌 O prazo médio de entrega para este serviço é de <span className="text-[#FFC107] font-black">{selectedService.time_estimate || '30 MINUTOS'}</span>.
                          </div>
                        )}

                        {selectedService.category_id === 9 ? (
                          <button 
                            onClick={() => {
                              if (selectedService.download_url) {
                                window.open(selectedService.download_url, '_blank');
                              } else {
                                alert("Link de download não disponível no momento.");
                              }
                            }}
                            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-5 rounded-2xl font-black text-lg uppercase tracking-tighter shadow-xl transition-all hover:-translate-y-1"
                          >
                            BAIXAR AGORA
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={handlePurchase}
                              disabled={purchaseLoading}
                              className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-5 rounded-2xl font-black text-lg uppercase tracking-tighter shadow-xl transition-all hover:-translate-y-1"
                            >
                              {purchaseLoading ? 'PROCESSANDO...' : 'CONFIRMAR COMPRA'}
                            </button>

                            {selectedService.categories?.slug === 'creditos' && (
                              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                <p className="text-[10px] text-red-400 font-bold leading-relaxed text-center uppercase">
                                  <span className="text-red-500 font-black">ATENÇÃO :</span> DIGITE O EMAIL CERTO. SE REGISTRAR O EMAIL ERRADO O CREDITO IRÁ PARAR EM OUTRA CONTA E NÃO CONSEGUIMOS REVERTER ISSO MUITA ATENÇÃO PARA NÃO COLOCAR O EMAIL ERRADO. EMAIL ERRADO NÃO FAZEMOS REENBOLSO.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                     </div>
                  </div>
               </div>
            </div>
        </div>
      )}

      {/* Terms Modal com Session Storage */}
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
              <button 
                onClick={() => {
                  if (checkboxChecked) {
                    setTermsAccepted(true);
                    sessionStorage.setItem('termsAccepted', 'true');
                  }
                }} 
                disabled={!checkboxChecked} 
                className={`px-10 py-3 rounded-xl font-black transition-all uppercase text-xs shadow-lg ${checkboxChecked ? 'bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a]' : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}
              >
                Aceito os Termos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero & Navigation Section */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-[#1e293b]/50 p-8 rounded-[40px] border border-[#334155]/50 backdrop-blur-sm">
        <div className="shrink-0">
           <h1 className="text-4xl font-black tracking-tighter text-white mb-1 uppercase italic leading-none">SETORES DE <span className="text-[#00D2AD] drop-shadow-[0_0_10px_rgba(0,210,173,0.3)]">SERVIÇOS</span></h1>
           <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <span className="w-4 h-px bg-[#00D2AD]"></span> Explore Nossas Soluções
           </p>
        </div>

        {/* Compact Category Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setActiveCategoryId(null)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 ${
              activeCategoryId === null 
              ? 'bg-[#00D2AD] border-[#00D2AD] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)]' 
              : 'bg-[#0f172a] border-[#334155] text-gray-400 hover:border-[#00D2AD]/50 hover:text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeCategoryId === null ? 'bg-[#0f172a] animate-pulse' : 'bg-gray-600'}`}></div>
            TODOS
          </button>

          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 group ${
                activeCategoryId === cat.id 
                ? 'bg-[#00D2AD] border-[#00D2AD] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)]' 
                : 'bg-[#0f172a] border-[#334155] text-gray-400 hover:border-[#00D2AD]/50 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={activeCategoryId === cat.id ? 'text-[#0f172a]' : 'text-[#00D2AD] group-hover:scale-110 transition-transform'}>
                <path d={getIcon(cat.slug)} />
                {cat.slug === 'imei' && <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />}
                {cat.slug === 'licencas' && <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />}
                {cat.slug === 'creditos' && <circle cx="12" cy="12" r="10" />}
                {cat.slug === 'metodos' && <path d="M22 7L12 2 2 7l10 5 10-5z M12 22l-10-5v-6l10 5 10-5v6z" />}
              </svg>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services List Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-[#334155]/50 pb-6 ml-2 gap-4">
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-8 bg-[#00D2AD] rounded-full shadow-[0_0_10px_#00D2AD]"></div>
           <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
              {activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name : 'Programas Disponíveis'}
           </h2>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-md w-full group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#00D2AD] group-focus-within:scale-110 transition-transform">
                 <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
           </div>
           <input 
              type="text" 
              placeholder="PESQUISAR SERVIÇO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0f172a] border-2 border-[#334155] rounded-2xl py-3 pl-12 pr-10 text-white font-black text-xs uppercase tracking-widest focus:border-[#00D2AD] focus:shadow-[0_0_30px_rgba(0,210,173,0.15)] outline-none transition-all placeholder:text-gray-600"
           />
           {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
           )}
        </div>

        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
          {filteredServices.length} {filteredServices.length === 1 ? 'Resultado' : 'Resultados'}
        </div>
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
              onClick={() => {
                setSelectedService(service);
                setQuantity(service.categories?.slug === 'creditos' ? 5 : 1);
              }}
              className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-[#334155] flex items-center hover:shadow-[0_0_40px_rgba(0,210,173,0.1)] hover:-translate-y-2 hover:border-[#00D2AD]/40 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D2AD]/5 blur-[70px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className={`w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center mr-6 overflow-hidden ${service.icon_color || 'bg-[#0f172a]'} text-white text-5xl font-black shadow-2xl border-2 border-white/5 relative z-10 group-hover:scale-110 transition-transform`}>
                {service.logo_url ? (
                  <img 
                    src={service.logo_url} 
                    alt="" 
                    className="w-full h-full object-contain p-2" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = service.letter || 'S';
                    }}
                  />
                ) : (
                  service.letter || 'S'
                )}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                 <h3 className="text-[18px] font-black text-gray-100 mb-4 leading-none group-hover:text-[#00D2AD] transition-colors uppercase italic tracking-tighter">{service.title}</h3>
                 
                 <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4">
                       <span className="text-[#00D2AD] font-black text-2xl drop-shadow-[0_0_5px_rgba(0,210,173,0.3)]">
                         {service.category_id === 9 ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                       </span>
                       {service.category_id !== 9 && service.is_rental && service.duration_hours && (
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight mt-1">
                           ⏱️ {Number(service.duration_hours) < 24 
                             ? `${service.duration_hours} HORAS` 
                             : `${Math.floor(Number(service.duration_hours) / 24)} ${Math.floor(Number(service.duration_hours) / 24) === 1 ? 'DIA' : 'DIAS'}`
                           } DE USO
                         </span>
                       )}
                    </div>
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
         <a href="https://wa.me/5511913378848?text=Vim%20pelo%20site%20Centralgsm" className="whitespace-nowrap bg-[#25D366] hover:bg-[#1fb356] text-white px-12 py-6 rounded-[30px] font-black uppercase text-lg shadow-[0_15px_35px_rgba(37,211,102,0.3)] hover:-translate-y-2 transition-all">Falar com Consultor</a>
      </div>
      {/* Modal de Saldo Insuficiente */}
      {showInsufficientBalance && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#1e293b] max-w-sm w-full rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden relative text-center p-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">💰</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic mb-2">Saldo Insuficiente</h2>
            <p className="text-gray-400 mb-8 leading-relaxed font-medium">
              Adicione créditos à sua conta para continuar.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setShowInsufficientBalance(false);
                  router.push('/saldo');
                }}
                className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-4 rounded-xl font-black text-[15px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,210,173,0.3)] transition-all hover:-translate-y-1"
              >
                + Adicionar Saldo
              </button>
              <button 
                onClick={() => setShowInsufficientBalance(false)}
                className="w-full bg-transparent hover:bg-[#334155] border-2 border-[#334155] text-gray-300 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
