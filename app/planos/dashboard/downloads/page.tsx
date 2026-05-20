"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DownloadsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
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
        setLoading(false);
      }
    }
    checkPlan();
  }, [router]);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  const brands = ['REALME SPD', 'REALME MTK', 'MOTOROLA', 'INFINIX MTK', 'TECNO MTK', 'ITEL MTK', 'POCO', 'XIAOMI'];

  const allTools = [
    { name: 'SamFw Tool v4.9', desc: 'Ferramenta completa para FRP e muito mais.', size: '15 MB', url: '#', brand: 'XIAOMI' },
    { name: 'SP Flash Tool', desc: 'Software oficial da MediaTek para Flashear ROMs.', size: '45 MB', url: '#', brand: 'POCO' },
    { name: 'Odin v3.14.4', desc: 'Flasheador de ROM nativo.', size: '3.5 MB', url: '#', brand: 'XIAOMI' },
    { name: 'Motorola Fastboot Fix', desc: 'Script automatizado para remover MDM da linha Moto.', size: '1 MB', url: '#', brand: 'MOTOROLA' },
    { name: 'Pacote de Drivers Universal', desc: 'Drivers ADB, Fastboot, MTK e SPD em um clique.', size: '250 MB', url: '#', brand: 'REALME SPD' },
    { name: 'UnlockTool setup mais recente', desc: 'Instalador online oficial 2026.', size: '120 MB', url: '#', brand: 'REALME MTK' },
  ];

  const tools = selectedBrand ? allTools.filter(t => t.brand === selectedBrand) : allTools;

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3">
          <span className="text-[#00D2AD]">💾</span> Central de Downloads
        </h1>
        <p className="text-gray-400 mt-2">Área exclusiva do Plano Premium. Baixe todas as ferramentas e arquivos necessários para seus desbloqueios.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {brands.map(brand => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
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

      <div className="bg-[#0f172a]/50 p-8 rounded-3xl border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.length > 0 ? (
            tools.map((tool, idx) => (
            <div
              key={idx}
              className="bg-[#0f172a]/50 hover:bg-[#00D2AD]/10 border border-white/5 hover:border-[#00D2AD]/30 p-6 rounded-2xl flex flex-col items-start transition-all group h-full"
            >
              <div className="w-full flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-[#00D2AD] bg-[#00D2AD]/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                  DOWNLOAD
                </span>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest group-hover:text-white transition-colors">{tool.size}</span>
              </div>

              <span className="text-xl font-black text-white text-left group-hover:text-[#00D2AD] transition-colors">{tool.name}</span>
              <p className="text-gray-500 text-[11px] mt-2 font-medium leading-relaxed flex-1 text-left">
                {tool.desc}
              </p>
              
              <a href={tool.url} target="_blank" rel="noreferrer" className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00D2AD]/60 group-hover:text-[#00D2AD] transition-all cursor-pointer">
                Fazer Download
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-1 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </a>
            </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-white/5">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum download encontrado para esta marca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
