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
      
      <div className="mt-12 flex justify-center max-w-lg mx-auto">
        <div className="w-full bg-[#1e293b] border-2 border-[#00D2AD]/50 p-6 rounded-2xl flex flex-col items-center justify-center text-gray-300 shadow-lg shadow-[#00D2AD]/10">
          <span className="text-sm font-bold uppercase tracking-widest text-[#00D2AD] mb-3">Horário de Atendimento</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg md:text-xl font-black uppercase tracking-wider text-white text-center">Seg a Sex, 09h às 22h</span>
            <span className="text-lg md:text-xl font-black uppercase tracking-wider text-gray-400 text-center">Sab e Dom, 11h às 19h</span>
          </div>
        </div>
      </div>
    </div>
  )
}
