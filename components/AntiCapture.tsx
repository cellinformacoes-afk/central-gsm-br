"use client";

import { useEffect, useState } from 'react';

interface AntiCaptureProps {
  children: React.ReactNode;
  userEmail?: string;
}

/**
 * Componente de proteção contra Captura de Tela e Gravação.
 * Implementa:
 * 1. Blur automático ao perder foco (troca de aba/janela)
 * 2. Bloqueio de Botão Direito (Context Menu)
 * 3. Bloqueio de Atalhos de Desenvolvedor (F12, Ctrl+Shift+I, etc.)
 * 4. Marcad'água flutuante com e-mail do usuário (Deterrente)
 * 5. CSS para desativar seleção de texto
 */
export default function AntiCapture({ children, userEmail }: AntiCaptureProps) {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    // 1. Controle de Foco/Visibilidade
    const handleVisibility = () => setIsFocused(!document.hidden);
    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // 2. Bloqueio de Interações e Atalhos
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, Ctrl+P
      const isDevTools = 
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key.toUpperCase()));

      if (isDevTools) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`relative min-h-full transition-all duration-700 ease-in-out select-none ${!isFocused ? 'blur-[40px] grayscale brightness-50' : ''}`}>
      
      {/* Aviso de Proteção quando desfocado */}
      {!isFocused && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 max-w-sm">
            <span className="text-4xl mb-4 block">🛡️</span>
            <h3 className="text-xl font-bold text-white mb-2">Conteúdo Protegido</h3>
            <p className="text-gray-400 text-sm">Volte para a aba do navegador para visualizar o curso. Capturas de tela e gravações são proibidas.</p>
          </div>
        </div>
      )}

      {/* Marcad'água Dinâmica (Baixa opacidade, flutuante) */}
      <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden select-none opacity-[0.03] flex items-center justify-center">
        <div className="grid grid-cols-3 gap-20 -rotate-12 translate-x-10 translate-y-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="text-lg font-black text-white whitespace-nowrap uppercase tracking-widest animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
              {userEmail || 'USUÁRIO PROTEGIDO'}
            </div>
          ))}
        </div>
      </div>

      <div className={!isFocused ? 'pointer-events-none' : ''}>
        {children}
      </div>

      <style jsx global>{`
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
