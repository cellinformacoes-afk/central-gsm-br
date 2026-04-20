"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AntiCapture from '@/components/AntiCapture';

export default function MiniCursoPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
      setLoading(false);
    }
    getUser();
  }, []);

  if (loading) return null;

  return (
    <AntiCapture userEmail={user?.email}>
      <div className="h-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3">
            <span className="text-[#00D2AD]">🎓</span> Mini Curso: Dominando Desbloqueios
          </h1>
          <p className="text-gray-400 mt-2">Aprenda as técnicas mais avançadas do mercado com segurança e exclusividade.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist / Aulas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black rounded-3xl overflow-hidden border border-white/5 aspect-video relative flex items-center justify-center">
              <div className="text-center p-8">
                 <div className="w-20 h-20 bg-[#00D2AD]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00D2AD]/40">
                   <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Vídeo Aula: Primeiros Passos</h3>
                 <p className="text-gray-500 text-sm mt-2">O player de vídeo está protegido contra gravação externa.</p>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/40">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Gravação Bloqueada</span>
              </div>
            </div>

            <div className="bg-[#1e293b]/50 p-8 rounded-3xl border border-white/5">
              <h3 className="text-xl font-black text-white mb-6">Material de Apoio</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#00D2AD]/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">📄</div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#00D2AD] transition-colors uppercase">Guia de Estudos - Aula {i}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">PDF • 2.4 MB</p>
                      </div>
                    </div>
                    <button className="text-[#00D2AD] hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar de Progresso */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#00D2AD]/10 to-transparent p-6 rounded-3xl border border-[#00D2AD]/20">
              <p className="text-[10px] font-black text-[#00D2AD] uppercase tracking-[0.2em] mb-4">Sua Proteção Ativa</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-[#00D2AD]">✓</span> Ant-Screen Capture
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-[#00D2AD]">✓</span> Watermark ID: {user?.id?.slice(0, 8)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-[#00D2AD]">✓</span> Shortcut Blocker Active
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b]/50 p-6 rounded-3xl border border-white/5">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Módulos do Curso</h4>
              <div className="space-y-2">
                {[
                  { name: '01. Introdução ao Sistema', duration: '10 min', active: true },
                  { name: '02. Configurando as Tools', duration: '15 min' },
                  { name: '03. Desbloqueio BROM', duration: '25 min' },
                  { name: '04. Técnicas de MDM', duration: '30 min' },
                  { name: '05. Conclusão e Dicas', duration: '12 min' },
                ].map((m, i) => (
                  <button key={i} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${m.active ? 'bg-[#00D2AD] text-[#0f172a]' : 'hover:bg-white/5'}`}>
                    <div>
                      <p className={`text-[11px] font-black uppercase ${m.active ? 'text-[#0f172a]' : 'text-white group-hover:text-[#00D2AD]'}`}>{m.name}</p>
                      <p className={`text-[10px] mt-0.5 ${m.active ? 'text-[#0f172a]/70' : 'text-gray-500'}`}>{m.duration}</p>
                    </div>
                    {m.active ? (
                       <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center text-[10px]">▶</div>
                    ) : (
                       <div className="w-6 h-6 border border-white/10 rounded-full flex items-center justify-center text-[10px] text-gray-600">🔒</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AntiCapture>
  );
}
