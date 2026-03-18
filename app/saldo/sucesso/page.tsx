"use client";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Suspense } from 'react';

function SucessoContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
      <div className="bg-[#1e293b] rounded-3xl p-12 border border-[#334155] shadow-[0_0_50px_rgba(0,210,173,0.1)] relative overflow-hidden">
        
        {/* Animated Checkmark */}
        <div className="w-24 h-24 bg-[#00D2AD] rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_#00D2AD] animate-bounce">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 className="text-4xl font-black text-white mb-4 uppercase italic">PAGAMENTO CONFIRMADO!</h1>
        <p className="text-gray-400 text-lg mb-8">
           Seu saldo de <span className="text-[#00D2AD] font-black">R$ {amount}</span> já foi creditado e está pronto para uso.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <Link 
            href="/"
            className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-8 py-4 rounded-xl font-black uppercase tracking-tighter transition-all shadow-lg text-sm"
           >
             Ir para Serviços
           </Link>
           <Link 
            href="/pedidos"
            className="bg-[#334155] hover:bg-[#475569] text-white px-8 py-4 rounded-xl font-black uppercase tracking-tighter transition-all text-sm"
           >
             Ver Extrato
           </Link>
        </div>

        {/* Support Link */}
        <p className="mt-12 text-gray-500 text-xs font-bold uppercase tracking-widest">
           Algum problema? <Link href="/suporte" className="text-[#00D2AD] hover:underline">Fale com o Suporte</Link>
        </p>
      </div>
    </div>
  );
}

export default function SucessoSaldoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
      <SucessoContent />
    </Suspense>
  );
}
