"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tab = 'FRP' | 'MDM';

export default function DesbloqueiosPage() {
  const [tab, setTab] = useState<Tab>('FRP');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [celular, setCelular] = useState('');
  const [tipo, setTipo] = useState<'FRP' | 'MDM'>('FRP');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*, categories(name, slug)')
      .eq('active', true)
      .in('categories.slug', ['desbloqueio-frp', 'desbloqueio-mdm']);

    if (error) {
      console.error('Erro ao buscar desbloqueios:', error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }

  const frpServices = services.filter(s => s.categories?.slug === 'desbloqueio-frp');
  const mdmServices = services.filter(s => s.categories?.slug === 'desbloqueio-mdm');
  const visibleServices = tab === 'FRP' ? frpServices : mdmServices;

  const handlePurchase = async () => {
    if (!selectedService) return;

    if (!nome.trim()) {
      alert("Por favor, digite seu nome.");
      return;
    }

    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      alert("Por favor, digite seu WhatsApp corretamente com DDD (ex: 11999998888).");
      return;
    }

    if (!celular.trim()) {
      alert("Por favor, informe o modelo do celular que deseja desbloquear.");
      return;
    }

    setPurchaseLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: result, error: rpcError } = await supabase.rpc('purchase_service_v2', {
        p_user_id: session.user.id,
        p_service_id: selectedService.id,
        p_input_data: { nome: nome.trim(), whatsapp: digits, celular: celular.trim(), tipo },
        p_quantity: 1
      });

      if (rpcError) throw rpcError;

      if (result.status === 'error') {
        alert(result.message);
        if (result.message === 'Saldo insuficiente') router.push('/saldo');
        return;
      }

      alert("Pedido de desbloqueio realizado com sucesso! Entraremos em contato pelo seu WhatsApp.");
      setSelectedService(null);
      setNome('');
      setWhatsapp('');
      setCelular('');
      router.push('/pedidos');
    } catch (error: any) {
      console.error(error);
      alert("Erro ao processar compra: " + (error.message || "Erro desconhecido"));
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh]">
      {/* Header */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-[#1e293b]/50 p-8 rounded-[40px] border border-[#334155]/50 backdrop-blur-sm">
        <div className="shrink-0">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-1 uppercase italic leading-none">
            DESBLOQUEIOS <span className="text-[#00D2AD] drop-shadow-[0_0_10px_rgba(0,210,173,0.3)]">REMOTO</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-4 h-px bg-[#00D2AD]"></span> FRP & MDM
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#00D2AD]/10 border border-[#00D2AD]/20 px-4 py-2 rounded-xl shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No pedido, informe seu WhatsApp para o atendimento</span>
        </div>
      </div>

      {/* Tabs FRP / MDM */}
      <div className="flex gap-2 mb-8">
        {(['FRP', 'MDM'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedService(null); }}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border-2 ${
              tab === t
                ? 'bg-[#00D2AD] border-[#00D2AD] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)]'
                : 'bg-[#0f172a] border-[#334155] text-gray-400 hover:border-[#00D2AD]/50 hover:text-white'
            }`}
          >
            {t === 'FRP' ? '📱 FRP' : '🔒 MDM'}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1e293b] rounded-3xl p-6 border border-[#334155] h-32 animate-pulse shadow-2xl"></div>
          ))
        ) : visibleServices.length > 0 ? (
          visibleServices.map((service) => (
            <div
              key={service.id}
              onClick={() => { setNome(''); setWhatsapp(''); setCelular(''); setTipo(service.categories?.slug === 'desbloqueio-mdm' ? 'MDM' : 'FRP'); setSelectedService(service); }}
              className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-[#334155] flex items-center transition-all relative overflow-hidden hover:shadow-[0_0_40px_rgba(0,210,173,0.1)] hover:-translate-y-2 hover:border-[#00D2AD]/40 cursor-pointer group"
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
          <div className="col-span-full p-20 text-center bg-[#1e293b]/30 rounded-[40px] border-4 border-dashed border-[#334155] flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#1e293b] flex items-center justify-center text-4xl text-gray-700 shadow-inner">📱</div>
            <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-xs">Nenhum modelo cadastrado ainda</p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
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
                <button onClick={() => { setSelectedService(null); setNome(''); setWhatsapp(''); setCelular(''); }} className="text-gray-500 hover:text-white text-2xl font-bold">×</button>
              </div>

              <div className="space-y-6">
                <p className="text-gray-400 text-sm leading-relaxed">{selectedService.description || "Faça o desbloqueio remoto deste modelo. Após a compra entraremos em contato pelo WhatsApp."}</p>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Seu Nome *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="EX: João da Silva"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white text-center focus:border-[#00D2AD] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">WhatsApp com DDD *</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="EX: 11999998888"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white font-mono text-center tracking-[0.1em] focus:border-[#00D2AD] outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 text-center">Faremos o desbloqueio e chamaremos você neste número.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Modelo do Celular a Desbloquear *</label>
                  <input
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="EX: Realme Note 70 / iPhone 11"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-4 px-4 text-white text-center focus:border-[#00D2AD] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Confirme o tipo de Desbloqueio *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['FRP', 'MDM'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipo(t)}
                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border-2 ${
                          tipo === t
                            ? 'bg-[#00D2AD] border-[#00D2AD] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)]'
                            : 'bg-[#0f172a] border-[#334155] text-gray-400 hover:border-[#00D2AD]/50 hover:text-white'
                        }`}
                      >
                        {t === 'FRP' ? '📱 FRP' : '🔒 MDM'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#112328] p-4 rounded-xl border border-[#00D2AD]/10 text-xs text-gray-400 font-medium">
                  📌 Prazo médio: <span className="text-[#FFC107] font-black">{selectedService.time_estimate || '30 MINUTOS'}</span>.
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
    </div>
  );
}