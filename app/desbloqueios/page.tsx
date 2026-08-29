"use client";

import Link from 'next/link';

export default function DesbloqueiosPage() {
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
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Escolha o tipo de desbloqueio</span>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link
          href="/planos/dashboard/frp"
          className="group bg-[#1e293b] rounded-3xl p-8 shadow-2xl border border-[#334155] flex flex-col items-center text-center transition-all relative overflow-hidden hover:shadow-[0_0_40px_rgba(0,210,173,0.1)] hover:-translate-y-2 hover:border-[#00D2AD]/40 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D2AD]/5 blur-[70px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="w-24 h-24 mb-6 rounded-2xl flex items-center justify-center bg-[#0f172a] text-5xl border-2 border-white/5 shadow-2xl group-hover:scale-110 transition-transform relative z-10">
            📱
          </div>

          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 group-hover:text-[#00D2AD] transition-colors relative z-10">
            FRP
          </h3>
          <p className="text-gray-400 text-sm font-medium mb-6 relative z-10">
            Desbloqueio de conta Google (Factory Reset Protection) para diversos aparelhos.
          </p>

          <span className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all group-hover:scale-105 relative z-10">
            Acessar FRP
          </span>
        </Link>

        <Link
          href="/planos/dashboard/mdm"
          className="group bg-[#1e293b] rounded-3xl p-8 shadow-2xl border border-[#334155] flex flex-col items-center text-center transition-all relative overflow-hidden hover:shadow-[0_0_40px_rgba(0,210,173,0.1)] hover:-translate-y-2 hover:border-[#00D2AD]/40 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D2AD]/5 blur-[70px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="w-24 h-24 mb-6 rounded-2xl flex items-center justify-center bg-[#0f172a] text-5xl border-2 border-white/5 shadow-2xl group-hover:scale-110 transition-transform relative z-10">
            🔒
          </div>

          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 group-hover:text-[#00D2AD] transition-colors relative z-10">
            MDM
          </h3>
          <p className="text-gray-400 text-sm font-medium mb-6 relative z-10">
            Remoção de gerenciamento de dispositivo (MDM) de forma remota.
          </p>

          <span className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all group-hover:scale-105 relative z-10">
            Acessar MDM
          </span>
        </Link>
      </div>
    </div>
  );
}