"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DownloadsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [dbDownloads, setDbDownloads] = useState<any[]>([]);
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
        .select('plan, role')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan !== 'premium' && profile?.role !== 'admin') {
        router.push('/planos/dashboard/frp');
      } else {
        // Buscar downloads extras do banco
        const { data: extras } = await supabase.from('extra_downloads').select('*');
        if (extras) setDbDownloads(extras);
        
        setLoading(false);
      }
    }
    checkPlan();
  }, [router]);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin text-4xl text-[#00D2AD]">⚙</span></div>;

  const hardcodedBrands = ['REALME SPD', 'REALME MTK', 'MOTOROLA', 'INFINIX MTK', 'TECNO MTK', 'ITEL MTK', 'POCO', 'XIAOMI'];
  const brands = Array.from(new Set([...hardcodedBrands, ...dbDownloads.map(d => d.brand.toUpperCase())])).sort();

  const allTools = [
    { name: 'Hot 40 Pro', desc: 'Arquivos e ferramentas para Hot 40 Pro', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Hot 40i', desc: 'Arquivos e ferramentas para Hot 40i', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Hot 50 Pro', desc: 'Arquivos e ferramentas para Hot 50 Pro', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Hot 50 Pro+', desc: 'Arquivos e ferramentas para Hot 50 Pro+', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Hot 50i', desc: 'Arquivos e ferramentas para Hot 50i', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Note 40 4G', desc: 'Arquivos e ferramentas para Note 40 4G', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Note 40 5G', desc: 'Arquivos e ferramentas para Note 40 5G', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Note 40X 5G', desc: 'Arquivos e ferramentas para Note 40X 5G', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Note 50S', desc: 'Arquivos e ferramentas para Note 50S', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Smart 8 Pro', desc: 'Arquivos e ferramentas para Smart 8 Pro', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Smart 9', desc: 'Arquivos e ferramentas para Smart 9', size: 'N/A', url: '#', brand: 'INFINIX MTK' },
    { name: 'Itel A50', desc: 'Arquivos e ferramentas para Itel A50', size: 'N/A', url: '#', brand: 'ITEL MTK' },
    { name: 'Itel A70', desc: 'Arquivos e ferramentas para Itel A70', size: 'N/A', url: '#', brand: 'ITEL MTK' },
    { name: 'Itel P55 5G', desc: 'Arquivos e ferramentas para Itel P55 5G', size: 'N/A', url: '#', brand: 'ITEL MTK' },
    { name: 'Itel Power 70', desc: 'Arquivos e ferramentas para Itel Power 70', size: 'N/A', url: '#', brand: 'ITEL MTK' },
    { name: 'Itel S24', desc: 'Arquivos e ferramentas para Itel S24', size: 'N/A', url: '#', brand: 'ITEL MTK' },
    { name: 'Moto E13', desc: 'Arquivos e ferramentas para Moto E13', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto E32', desc: 'Arquivos e ferramentas para Moto E32', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto E40', desc: 'Arquivos e ferramentas para Moto E40', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto G04s', desc: 'Arquivos e ferramentas para Moto G04s', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto G14', desc: 'Arquivos e ferramentas para Moto G14', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto G20', desc: 'Arquivos e ferramentas para Moto G20', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'Moto G35', desc: 'Arquivos e ferramentas para Moto G35', size: 'N/A', url: '#', brand: 'MOTOROLA' },
    { name: 'POCO C40', desc: 'Arquivos e ferramentas para POCO C40', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO C75', desc: 'Arquivos e ferramentas para POCO C75', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO C85', desc: 'Arquivos e ferramentas para POCO C85', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO M4 5G', desc: 'Arquivos e ferramentas para POCO M4 5G', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO M4 Pro 5G', desc: 'Arquivos e ferramentas para POCO M4 Pro 5G', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO M8 5G', desc: 'Arquivos e ferramentas para POCO M8 5G', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X3 Pro', desc: 'Arquivos e ferramentas para POCO X3 Pro', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X5 Pro 5G', desc: 'Arquivos e ferramentas para POCO X5 Pro 5G', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X6', desc: 'Arquivos e ferramentas para POCO X6', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X6 5G', desc: 'Arquivos e ferramentas para POCO X6 5G', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X6 Pro', desc: 'Arquivos e ferramentas para POCO X6 Pro', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X7', desc: 'Arquivos e ferramentas para POCO X7', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X7 Pro', desc: 'Arquivos e ferramentas para POCO X7 Pro', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'POCO X8 Pro', desc: 'Arquivos e ferramentas para POCO X8 Pro', size: 'N/A', url: '#', brand: 'POCO' },
    { name: 'REALME 14T', desc: 'Arquivos e ferramentas para REALME 14T', size: 'N/A', url: '#', brand: 'REALME MTK' },
    { name: 'REALME C65', desc: 'Arquivos e ferramentas para REALME C65', size: 'N/A', url: '#', brand: 'REALME MTK' },
    { name: 'REALME C75', desc: 'Arquivos e ferramentas para REALME C75', size: 'N/A', url: '#', brand: 'REALME MTK' },
    { name: 'REALME C75X', desc: 'Arquivos e ferramentas para REALME C75X', size: 'N/A', url: '#', brand: 'REALME MTK' },
    { name: 'REALME C61', desc: 'Arquivos e ferramentas para REALME C61', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME C63', desc: 'Arquivos e ferramentas para REALME C63', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME C71', desc: 'Arquivos e ferramentas para REALME C71', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME C73', desc: 'Arquivos e ferramentas para REALME C73', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME NOTE 50', desc: 'Arquivos e ferramentas para REALME NOTE 50', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME NOTE 60', desc: 'Arquivos e ferramentas para REALME NOTE 60', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME NOTE 60X', desc: 'Arquivos e ferramentas para REALME NOTE 60X', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'REALME NOTE 70', desc: 'Arquivos e ferramentas para REALME NOTE 70', size: 'N/A', url: '#', brand: 'REALME SPD' },
    { name: 'Tecno Camon 30 5G', desc: 'Arquivos e ferramentas para Tecno Camon 30 5G', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Tecno Pova 6 Neo', desc: 'Arquivos e ferramentas para Tecno Pova 6 Neo', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Tecno Spark 10 Pro', desc: 'Arquivos e ferramentas para Tecno Spark 10 Pro', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Tecno Spark 30c', desc: 'Arquivos e ferramentas para Tecno Spark 30c', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Tecno Spark 40 5G', desc: 'Arquivos e ferramentas para Tecno Spark 40 5G', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Tecno Spark Go 5G', desc: 'Arquivos e ferramentas para Tecno Spark Go 5G', size: 'N/A', url: '#', brand: 'TECNO MTK' },
    { name: 'Note 13 Pro+ 5G', desc: 'Arquivos e ferramentas para Note 13 Pro+ 5G', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi 13', desc: 'Arquivos e ferramentas para Redmi 13', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi 13C', desc: 'Arquivos e ferramentas para Redmi 13C', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi 14', desc: 'Arquivos e ferramentas para Redmi 14', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi 14c', desc: 'Arquivos e ferramentas para Redmi 14c', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi 15C', desc: 'Arquivos e ferramentas para Redmi 15C', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi Note 13', desc: 'Arquivos e ferramentas para Redmi Note 13', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi Note 13 Pro 5G', desc: 'Arquivos e ferramentas para Redmi Note 13 Pro 5G', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi Note 14 5g', desc: 'Arquivos e ferramentas para Redmi Note 14 5g', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi Note 15', desc: 'Arquivos e ferramentas para Redmi Note 15', size: 'N/A', url: '#', brand: 'XIAOMI' },
    { name: 'Redmi Note 15 Pro', desc: 'Arquivos e ferramentas para Redmi Note 15 Pro', size: 'N/A', url: '#', brand: 'XIAOMI' },
  ];

  const combinedTools = [
    ...allTools,
    ...dbDownloads.map(d => ({
      name: d.name,
      desc: d.description || 'Arquivo de download extra',
      size: d.size || 'N/A',
      url: d.url,
      brand: d.brand.toUpperCase()
    }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const tools = selectedBrand ? combinedTools.filter(t => t.brand === selectedBrand) : combinedTools;

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
