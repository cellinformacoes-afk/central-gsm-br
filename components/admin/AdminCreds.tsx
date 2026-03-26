"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminCreds() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/credentials')
      .then(res => res.json())
      .then(data => {
        if (data.email) setEmail(data.email);
        if (data.password) setPassword(data.password);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro desconhecido');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert('Erro ao salvar credenciais e atualizar login real:\n' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-lg relative">
       {loading && (
         <div className="absolute inset-0 bg-[#1e293b]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
           <span className="text-[#00D2AD] font-bold text-xs uppercase animate-pulse">Carregando...</span>
         </div>
       )}
        <div>
          <h2 className="text-[#00D2AD] font-black uppercase text-sm flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             Acesso Rápido - Admin Original
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Ao salvar, os dados reais de acesso do seu painel Admin também serão sincronizados e alterados automaticamente para evitar trabalho duplo.</p>
       </div>
       <div className="flex flex-col xs:flex-row gap-4 w-full md:w-auto items-end">
          <div className="flex-1 w-full md:w-48">
             <label className="text-gray-500 text-[10px] font-black uppercase block mb-1">Login / Email Administrador</label>
             <input 
               type="text" 
               value={email} 
               onChange={(e) => setEmail(e.target.value)}
               placeholder="admin@email.com"
               className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#00D2AD] text-xs font-mono font-bold placeholder:text-gray-700" 
             />
          </div>
          <div className="flex-1 w-full bg-[#0f172a] rounded-xl border border-[#334155] border-l-4 border-l-[#00D2AD] p-0 overflow-hidden md:w-48 relative">
             <label className="text-gray-500 text-[10px] font-black uppercase block mb-1 px-4 pt-2">Senha Atualizada</label>
             <input 
               type="text" 
               value={password} 
               onChange={(e) => setPassword(e.target.value)}
               placeholder="senha_segura_123"
               className="w-full bg-transparent px-4 pb-2.5 pt-0 text-[#00D2AD] outline-none focus:border-[#00D2AD] text-xs font-mono font-bold placeholder:text-[#00D2AD]/30" 
             />
          </div>
          <button 
             onClick={handleSave} 
             disabled={loading || saving}
             className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(0,210,173,0.2)] hover:scale-105 transition-all whitespace-nowrap h-[45px] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0 w-full xs:w-auto"
          >
             {saving ? 'SALVANDO...' : saved ? 'SALVO ✔' : 'SALVAR DADOS'}
          </button>
       </div>
    </div>
  );
}
