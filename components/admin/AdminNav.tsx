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
      // Começo e fim do dia atual no fuso horário local
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfDay = tomorrow.toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'success')
        .eq('type', 'deposit')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

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
    { href: '/admin/expirados', label: '⚠️ Contas Expiradas' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-[#334155] pb-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={
                isActive 
                  ? "text-[#00D2AD] border-b-2 border-[#00D2AD] font-black uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap" 
                  : "text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap"
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
