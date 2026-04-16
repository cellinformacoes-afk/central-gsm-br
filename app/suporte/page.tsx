export default function Support() {
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Suporte via WhatsApp</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
        Nossa equipe está pronta para ajudar você com dúvidas, problemas de aluguel de ferramentas ou desbloqueios de IMEI.
      </p>

      <a 
        href="https://wa.me/5511913378848?text=Vim%20pelo%20site%20Centralgsm" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        Falar com Suporte Agora
      </a>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <a 
          href="/qr-gms" 
          className="flex items-center justify-center gap-3 bg-[#1e293b] border border-[#334155] hover:border-[#00D2AD]/50 text-gray-300 hover:text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#00D2AD]/10 flex items-center justify-center group-hover:bg-[#00D2AD]/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00D2AD]"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
          </div>
          Gerar QR Code GMS
        </a>
        <div className="bg-[#1e293b]/50 border border-[#334155]/50 p-4 rounded-2xl flex items-center justify-center text-[10px] text-gray-500 font-black uppercase tracking-widest text-center">
          Horário: Seg a Sex, 09h às 18h
        </div>
      </div>
    </div>
  )
}
