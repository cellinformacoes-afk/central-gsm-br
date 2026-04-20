"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockMethods, DeviceMethod } from '@/lib/mock-methods';

export default function MDMPage() {
  const [methods, setMethods] = useState<DeviceMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DeviceMethod | null>(null);
  const [plan, setPlan] = useState<string>('basico');
  const [selectedBrand, setSelectedBrand] = useState<string>('REALME');

  useEffect(() => {
    async function fetchPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();
        setPlan(profile?.plan || 'free');
      }
    }
    fetchPlan();
    
    setMethods(mockMethods.filter(m => m.category === 'MDM'));
  }, []);

  const brands = ['REALME', 'MOTOROLA', 'INFINIX MTK', 'TECNO MTK'];
  const filteredMethods = methods.filter(m => m.brand === selectedBrand);

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3">
          <span className="text-[#FFC107]">🔒</span> Desbloqueio MDM
        </h1>
        <p className="text-gray-400 mt-2">Drible bloqueios corporativos e de pagamento (PayJoy, Knox) com nossos métodos de exclusividade.</p>
      </div>

      {/* Abas de Fabricantes */}
      {!selectedMethod && (
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedBrand === brand 
                  ? 'bg-[#FFC107] text-[#0f172a] shadow-[0_0_20px_rgba(255,193,7,0.3)]' 
                  : 'bg-[#1e293b] text-gray-500 hover:text-white border border-white/5'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      )}

      {!selectedMethod ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMethods.length > 0 ? (
            filteredMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className="bg-[#0f172a]/50 hover:bg-[#FFC107]/10 border border-white/5 hover:border-[#FFC107]/30 p-6 rounded-2xl flex flex-col items-start transition-all group"
              >
                <div className="w-full flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-[#FFC107] bg-[#FFC107]/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                    {method.brand}
                  </span>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest group-hover:text-white transition-colors">v.2026</span>
                </div>

                <span className="text-xl font-black text-white text-left group-hover:text-[#FFC107] transition-colors">{method.model}</span>
                <p className="text-gray-500 text-[11px] mt-2 font-medium leading-relaxed">
                  Bypass avançado de bloqueios PayJoy, Knox e empresariais.
                </p>
                
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFC107]/60 group-hover:text-[#FFC107] transition-all">
                  Abrir Tutorial
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-white/5">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum método encontrado para {selectedBrand} nesta categoria.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setSelectedMethod(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Voltar para lista de aparelhos
          </button>

          <div className="bg-[#0f172a]/50 p-8 rounded-3xl border border-white/5">
            <div className="flex items-baseline gap-4 mb-8 border-b border-white/5 pb-8">
              <h2 className="text-4xl font-black text-white">{selectedMethod.model}</h2>
              <span className="text-lg text-gray-500 font-bold uppercase">{selectedMethod.brand}</span>
            </div>

            {selectedMethod.videoUrl && (
              <div className="mb-10 w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative group flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                 <span className="absolute bottom-4 left-4 text-xs font-bold text-white/50 bg-black/50 px-2 py-1 rounded">Vídeo indisponível (Demo)</span>
              </div>
            )}

            <h3 className="text-xl font-black text-white mb-6">Passo a Passo</h3>
            <div className="space-y-6">
              {selectedMethod.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FFC107]/20 border border-[#FFC107]/40 text-[#FFC107] font-black rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(255,193,7,0.1)]">
                    {idx + 1}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-base font-bold text-gray-200 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedMethod.files && selectedMethod.files.length > 0 && (
              <div className="mt-12 pt-8 border-t border-white/5">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Arquivos Necessários
                </h3>

                {plan === 'basico' ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-red-400">
                      <p className="font-bold mb-1">Acesso Bloqueado</p>
                      <p className="text-sm opacity-80">O Plano Básico não permite baixar arquivos. Faça upgrade para o Premium para liberar os downloads.</p>
                    </div>
                    <a href="/planos" className="shrink-0 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-4 py-2 rounded-xl transition-colors">
                      Fazer Upgrade
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedMethod.files.map((file, idx) => (
                      <div key={idx} className="bg-[#1e293b] border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-[#FFC107]/50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-white mb-1 group-hover:text-[#FFC107] transition-colors">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-[#FFC107] flex items-center justify-center text-gray-400 hover:text-[#0f172a] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
