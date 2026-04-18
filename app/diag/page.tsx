"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DiagPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [status, setStatus] = useState('Pronto para iniciar');
  const mainCode = '*#*#426#*#*';

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback para contextos não seguros (HTTP / IP Local)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  };

  const copyAndTrigger = async (code: string) => {
    await copyToClipboard(code);
    setStatus(`Código copiado!`);
    
    // Tenta abrir o discador.
    window.location.href = `tel:${code}`;
    
    setTimeout(() => {
        setStatus('Código copiado! Agora cole no teclado de chamadas do celular.');
    }, 1500);
  };

  const triggerDiagnostic = (code: string) => {
    setStatus(`Tentando abrir diagnostic: ${code}...`);
    window.location.href = `tel:${code}`;
    
    setTimeout(() => {
        setStatus('Se o menu não abriu, tente digitar o código manualmente no discador.');
    }, 2000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-white px-6">
      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-[#00D2AD]/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,210,173,0.1)] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00D2AD] to-transparent"></div>
        
        <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-[#00D2AD]/10 rounded-full flex items-center justify-center border-2 border-[#00D2AD] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00D2AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
        </div>

        <h1 className="text-3xl font-black italic mb-2 tracking-tight">FCM <span className="text-[#00D2AD]">DIAGNOSTIC</span></h1>
        <p className="text-gray-400 text-sm mb-8">Abra o menu do Google para ver o ID do celular e ativar o Play Protect.</p>

        <div className="space-y-6">
            <div className="bg-black/20 p-8 rounded-3xl border border-[#00D2AD]/10 mb-2 transition-all hover:bg-black/30">
                <button 
                    onClick={() => copyAndTrigger(mainCode)}
                    className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] font-black py-6 rounded-2xl shadow-[0_0_30px_rgba(0,210,173,0.3)] transition-all active:scale-95 uppercase tracking-tighter text-lg flex items-center justify-center gap-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    ABRIR DIAGNÓSTICO GOOGLE
                </button>
            </div>
            
            <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Outros Fabricantes</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => triggerDiagnostic('*#0*#')}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl border border-white/5 transition-all active:scale-95 uppercase text-xs"
                >
                    Samsung
                </button>
                <button 
                    onClick={() => triggerDiagnostic('*#*#6484#*#*')}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl border border-white/5 transition-all active:scale-95 uppercase text-xs"
                >
                    Xiaomi
                </button>
            </div>
        </div>

        <div className="mt-8 p-4 bg-black/30 rounded-lg border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-[#00D2AD] mb-1 font-bold">Status do Sistema</p>
            <p className="text-xs text-gray-300 font-mono">{status}</p>
        </div>

        {!isMobile && (
            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-bold uppercase italic">
                Aviso: Use um dispositivo móvel para melhores resultados.
            </div>
        )}
      </div>

      <div className="mt-12 text-center">
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em]">Propriedade de Jackson & Israel GSM</p>
      </div>
    </div>
  );
}
