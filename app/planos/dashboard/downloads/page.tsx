"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  image_url?: string;
}

interface DeviceMethod {
  id: string;
  brand: string;
  model: string;
  category: 'FRP' | 'MDM' | 'DOWNLOADS';
  video_url?: string;
  attention?: string;
  steps: Step[];
  files?: { name: string; size: string; url?: string }[];
}

export default function DownloadsPage() {
  const [methods, setMethods] = useState<DeviceMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DeviceMethod | null>(null);
  const [plan, setPlan] = useState<string>('free');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan !== 'premium') {
        router.push('/planos/dashboard/frp');
      } else {
        setPlan('premium');
        setLoading(false);
      }
    }
    checkPlan();
    
    async function fetchMethods() {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('category', 'DOWNLOADS');
      
      if (!error && data) {
        setMethods(data);
        // Set first brand as default if available
        const uniqueBrands = Array.from(new Set(data.map(m => m.brand)));
        if (uniqueBrands.length > 0) {
          setSelectedBrand(uniqueBrands[0]);
        }
      }
    }
    fetchMethods();
  }, [router]);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  const brands = Array.from(new Set(methods.map(m => m.brand)));
  const filteredMethods = methods.filter(m => m.brand === selectedBrand);

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3">
          <span className="text-[#00D2AD]">💾</span> Central de Downloads
        </h1>
        <p className="text-gray-400 mt-2">Área exclusiva do Plano Premium. Baixe todas as ferramentas e arquivos necessários para seus desbloqueios.</p>
      </div>

      {/* Abas de Fabricantes / Categorias */}
      {!selectedMethod && brands.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedBrand === brand 
                  ? 'bg-[#00D2AD] text-[#0f172a] shadow-[0_0_20px_rgba(0,210,173,0.3)]' 
                  : 'bg-[#1e293b] text-gray-500 hover:text-white border border-white/5'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      )}

      {!selectedMethod ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.length > 0 ? (
            filteredMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className="bg-[#0f172a]/50 hover:bg-[#00D2AD]/10 border border-white/5 hover:border-[#00D2AD]/30 p-6 rounded-2xl flex flex-col items-start transition-all group h-full"
              >
                <div className="w-full flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-[#00D2AD] bg-[#00D2AD]/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                    {method.brand}
                  </span>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest group-hover:text-white transition-colors">ACESSAR</span>
                </div>

                <span className="text-xl font-black text-white text-left group-hover:text-[#00D2AD] transition-colors">{method.model}</span>
                <p className="text-gray-500 text-[11px] mt-2 font-medium leading-relaxed flex-1 text-left">
                  {method.attention ? method.attention.substring(0, 80) + '...' : 'Arquivos e ferramentas para ' + method.model}
                </p>
                
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00D2AD]/60 group-hover:text-[#00D2AD] transition-all">
                  Abrir Arquivos
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-white/5">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum download cadastrado nesta categoria ainda.</p>
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
            Voltar para lista de categorias
          </button>

          <div className="bg-[#0f172a]/50 p-8 rounded-3xl border border-white/5">
            <div className="flex items-baseline gap-4 mb-8 border-b border-white/5 pb-8">
              <h2 className="text-4xl font-black text-white">{selectedMethod.model}</h2>
              <span className="text-lg text-gray-500 font-bold uppercase">{selectedMethod.brand}</span>
            </div>

            {selectedMethod.attention && (
              <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-4 items-start">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">Atenção</h4>
                  <p className="text-yellow-500/80 text-sm font-medium leading-relaxed">
                    {selectedMethod.attention}
                  </p>
                </div>
              </div>
            )}

            {selectedMethod.steps && selectedMethod.steps.length > 0 && selectedMethod.steps[0].title !== "" && (
              <>
                <h3 className="text-xl font-black text-white mb-6">Instruções de Uso</h3>
                <div className="space-y-6 mb-12 border-b border-white/5 pb-12">
                  {selectedMethod.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-[#00D2AD]/20 border border-[#00D2AD]/40 text-[#00D2AD] font-black rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,210,173,0.1)]">
                        {idx + 1}
                      </div>
                      <div className="pt-2">
                        <h4 className="text-base font-bold text-white mb-1 drop-shadow-md">{step.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">{step.description}</p>
                        {step.image_url && (
                          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 mt-5 max-w-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative">
                            <img src={step.image_url} alt={step.title} className="w-full h-auto object-contain transform group-hover:scale-[1.02] transition-transform duration-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Arquivos Disponíveis
              </h3>

              {(!selectedMethod.files || selectedMethod.files.length === 0) ? (
                 <div className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-2xl text-center">
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Nenhum arquivo anexado ainda.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedMethod.files.map((file, idx) => (
                    <div key={idx} className="bg-[#1e293b] border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-[#00D2AD]/50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-white mb-1 group-hover:text-[#00D2AD] transition-colors">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                      <a 
                        href={file.url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-[#00D2AD] flex items-center justify-center text-gray-400 hover:text-[#0f172a] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
