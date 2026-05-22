"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminNav() {
  const pathname = usePathname();
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRevenue() {
      // Ajuste para o fuso horário de Brasília (UTC-3)
      const now = new Date();
      const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      
      const startOfDay = new Date(brTime);
      startOfDay.setUTCHours(3, 0, 0, 0); // 00:00 no Brasil = 03:00 UTC
      
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(endOfDay.getUTCHours() + 24);

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'success')
        .in('type', ['deposit', 'pix', 'credit_card'])
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (!error && data) {
        const total = data.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        setTodayRevenue(total);
      } else {
        setTodayRevenue(0);
      }
    }

    fetchRevenue();
  }, []);

  const links = [
    { href: '/admin/pedidos', label: '🛒 Pedidos' },
    { href: '/admin/estoque', label: '📦 Gestão de Estoque' },
    { href: '/admin/servicos', label: '🛠️ Gerenciar Serviços' },
    { href: '/admin/assinaturas', label: '💎 Assinaturas' },
    { href: '/admin/tutoriais', label: '📖 Tutoriais' },
    { href: '/admin/fraudes', label: '🚫 Fraudes' },
    { href: '/admin/conciliacao', label: '⚡ Conciliação' },
    { href: '/admin/downloads-extras', label: '⬇️ Download Extra' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 border-b border-[#334155] pb-6">
      <div className="flex flex-wrap gap-x-2 gap-y-4 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={
                isActive 
                  ? "bg-[#00D2AD]/10 text-[#00D2AD] border border-[#00D2AD]/30 rounded-lg font-black uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap transition-all" 
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent rounded-lg font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap transition-all"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      
      {todayRevenue !== null && (
        <div className="flex items-center gap-2 bg-[#00D2AD]/10 border border-[#00D2AD]/20 px-4 py-2 rounded-xl shrink-0">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Entradas Hoje:</span>
          <span className="text-[#00D2AD] font-black text-sm tracking-tighter">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
          </span>
        </div>
      )}
    </div>
  );
}
