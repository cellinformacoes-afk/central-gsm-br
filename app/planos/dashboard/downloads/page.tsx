"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const id = Object.keys(localStorage).find(k => k.startsWith('userPlan_'));
    const plan = id ? localStorage.getItem(id) : null;
    
    if (plan !== 'premium') {
      router.push('/planos/dashboard/frp');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return null;

  const tools = [
    { name: 'SamFw Tool v4.9', desc: 'Ferramenta completa para Samsung FRP e muito mais.', size: '15 MB' },
    { name: 'SP Flash Tool', desc: 'Software oficial da MediaTek para Flashear ROMs.', size: '45 MB' },
    { name: 'Odin v3.14.4', desc: 'Flasheador de ROM nativo para toda linha Samsung.', size: '3.5 MB' },
    { name: 'Motorola Fastboot Fix', desc: 'Script automatizado para remover MDM da linha Moto.', size: '1 MB' },
    { name: 'Pacote de Drivers Universal', desc: 'Drivers ADB, Fastboot, Samsung, MTK e SPD em um clique.', size: '250 MB' },
    { name: 'UnlockTool setup mais recente', desc: 'Instalador online oficial 2026.', size: '120 MB' },
  ];

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3">
          <span className="text-[#00D2AD]">💾</span> Central de Downloads
        </h1>
        <p className="text-gray-400 mt-2">Área exclusiva do Plano Premium. Baixe todas as ferramentas e arquivos necessários para seus desbloqueios.</p>
      </div>

      <div className="bg-[#0f172a]/50 p-8 rounded-3xl border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <div key={idx} className="bg-[#1e293b] border border-white/10 hover:border-[#00D2AD]/50 p-6 rounded-2xl flex flex-col group transition-all h-full">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-[#00D2AD]/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-[#00D2AD] transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00D2AD] transition-colors">{tool.name}</h3>
              <p className="text-sm text-gray-400 mb-6 flex-1">{tool.desc}</p>
              
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                <span className="text-xs font-bold text-gray-500">{tool.size}</span>
                <button className="text-xs font-bold bg-[#00D2AD]/10 text-[#00D2AD] hover:bg-[#00D2AD] hover:text-[#0f172a] px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(0,210,173,0.1)]">
                  Baixar Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
