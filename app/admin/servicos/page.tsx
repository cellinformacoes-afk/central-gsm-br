"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminServicosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'admin') router.push('/');
  }

  async function fetchData() {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*');
    setCategories(catData || []);

    const { data: servData, error } = await supabase
      .from('services')
      .select('*, categories(name)')
      .order('category_id', { ascending: true });

    if (!error) setServices(servData || []);
    setLoading(false);
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('services').update({ active: !currentStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza? Isso pode afetar pedidos antigos.")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) fetchData();
    else alert("Erro ao excluir: Verifique se existem pedidos vinculados.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const payload = {
      title: formData.get('title'),
      price: parseFloat(formData.get('price') as string),
      category_id: parseInt(formData.get('category_id') as string),
      description: formData.get('description'),
      time_estimate: formData.get('time_estimate'),
      letter: formData.get('letter'),
      logo_url: formData.get('logo_url'),
      icon_color: formData.get('icon_color'),
      is_rental: formData.get('is_rental') === 'on',
      duration_hours: parseFloat(formData.get('duration_hours') as string || '0'),
      download_url: formData.get('download_url'),
      active: true
    };

    if (editingService) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
      if (!error) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Erro ao atualizar serviço: " + error.message);
      }
    } else {
      const { error } = await supabase.from('services').insert(payload);
      if (!error) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Erro ao criar serviço: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Admin Nav */}
      <div className="flex gap-4 mb-10 border-b border-[#334155] pb-4 overflow-x-auto no-scrollbar">
         <Link href="/admin/pedidos" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">🛒 Pedidos</Link>
         <Link href="/admin/estoque" className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">📦 Gestão de Estoque</Link>
         <Link href="/admin/servicos" className="text-[#00D2AD] border-b-2 border-[#00D2AD] font-black uppercase text-xs tracking-widest px-4 py-2 whitespace-nowrap">🛠️ Gerenciar Serviços</Link>
      </div>

      {/* Credentials Info */}
      <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-all"></div>
         <div>
            <h2 className="text-[#00D2AD] font-black uppercase text-sm flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               Credenciais de Acesso Admin
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Caso esqueça, estes são os dados para entrar no painel.</p>
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
               <div className="text-gray-600 text-[9px] font-black uppercase mb-1">Login / Email</div>
               <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2 text-white text-xs font-mono font-bold select-all">admin@seu_email.com</div>
            </div>
            <div className="flex-1 md:flex-none">
               <div className="text-gray-600 text-[9px] font-black uppercase mb-1">Senha Atual</div>
               <div className="bg-[#0f172a] border border-[#00D2AD]/30 rounded-xl px-4 py-2 text-[#00D2AD] text-xs font-mono font-bold select-all">sua_senha_aqui</div>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">CATÁLOGO DE <span className="text-[#00D2AD]">SERVIÇOS</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Adicione ou remova itens das categorias</p>
        </div>
         <button 
           onClick={() => { setEditingService(null); setFormCategoryId(categories[0]?.id || null); setIsModalOpen(true); }}
           className="bg-[#00D2AD] text-[#0f172a] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:-translate-y-1 transition-all"
         >
           + ADICIONAR NOVO PROGRAMA
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse font-black uppercase tracking-widest">Carregando Serviços...</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="space-y-4 mb-8">
               <h2 className="text-xl font-black text-[#00D2AD] uppercase italic flex items-center gap-3">
                  <div className="w-2 h-6 bg-[#00D2AD] rounded-full"></div>
                  {cat.name}
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.filter(s => s.category_id === cat.id).map(service => (
                    <div key={service.id} className={`bg-[#1e293b] p-6 rounded-2xl border ${service.active ? 'border-[#334155]' : 'border-red-900/50 opacity-60'} group relative`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black overflow-hidden ${service.icon_color || 'bg-[#0f172a]'}`}>
                             {service.logo_url ? (
                               <img 
                                 src={service.logo_url} 
                                 alt="" 
                                 className="w-full h-full object-cover" 
                                 onError={(e) => {
                                   (e.target as HTMLImageElement).style.display = 'none';
                                   (e.target as HTMLImageElement).parentElement!.innerHTML = service.letter || 'S';
                                 }}
                               />
                             ) : (
                               service.letter || 'S'
                             )}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingService(service); setFormCategoryId(service.category_id); setIsModalOpen(true); }} className="p-2 bg-[#334155] rounded-md text-white hover:bg-[#00D2AD] hover:text-black">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                              </button>
                             <button onClick={() => handleDelete(service.id)} className="p-2 bg-[#334155] rounded-md text-white hover:bg-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                             </button>
                          </div>
                       </div>
                       <h4 className="text-white font-black uppercase text-sm mb-1">{service.title}</h4>
                       <p className="text-[#00D2AD] font-bold text-lg mb-4">R$ {service.price.toFixed(2)}</p>
                       
                       <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#334155]/50">
                          <span className="text-[9px] text-gray-500 uppercase font-black">{service.is_rental ? `⏳ ${service.duration_hours}H` : '⚡ ATIVAÇÃO'}</span>
                          <button 
                            onClick={() => handleToggleActive(service.id, service.active)}
                            className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${service.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                          >
                            {service.active ? 'ATIVO' : 'INATIVO'}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-md p-4">
           <div className="bg-[#1e293b] max-w-2xl w-full rounded-[40px] border border-[#00D2AD]/50 p-10 shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <h2 className="text-3xl font-black text-white uppercase italic mb-8">{editingService ? 'EDITAR' : 'NOVO'} <span className="text-[#00D2AD]">PROGRAMA</span></h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Nome do Serviço</label>
                       <input name="title" required defaultValue={editingService?.title} className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Preço (R$)</label>
                       <input name="price" type="number" step="0.01" required defaultValue={editingService?.price} className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]" />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Setor / Categoria</label>
                        <select 
                          name="category_id" 
                          required 
                          value={formCategoryId || ''} 
                          onChange={(e) => setFormCategoryId(parseInt(e.target.value))}
                          className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]"
                        >
                           {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Prazo Estimado</label>
                       <input name="time_estimate" placeholder="EX: 30 MINUTOS" defaultValue={editingService?.time_estimate} className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Descrição curta</label>
                    <textarea name="description" rows={3} defaultValue={editingService?.description} className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]" />
                 </div>

                 {/* Aluguel options (Hidden for Arquivos, Metodos, and Download de Programas) */}
                 {![5, 6, 9].includes(formCategoryId || 0) && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#0f172a] p-6 rounded-3xl border border-[#334155]">
                       <div className="flex items-center gap-4">
                          <input name="is_rental" type="checkbox" defaultChecked={editingService?.is_rental} className="w-6 h-6 rounded bg-[#1e293b] border-[#334155] text-[#00D2AD] focus:ring-[#00D2AD]" />
                          <div>
                             <label className="text-sm font-black text-white uppercase">É um Aluguel?</label>
                             <p className="text-[10px] text-gray-500">Ativa entrega automática e estoque</p>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Duração do Aluguel (Horas)</label>
                          <input name="duration_hours" type="number" step="0.01" min="0" defaultValue={editingService?.duration_hours} className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-white outline-none focus:border-[#00D2AD]" />
                          <p className="text-[9px] text-gray-500 font-bold italic mt-1 uppercase">DICA: 0.1 = 6 min | 0.5 = 30 min | 1.0 = 1 hora</p>
                       </div>
                   </div>
                 )}

                 {/* Download Link (Shown only for Arquivos, Metodos and Download de Programas) */}
                 {[5, 6, 9].includes(formCategoryId || 0) && (
                   <div className="space-y-2 bg-[#00D2AD]/5 p-6 rounded-3xl border border-[#00D2AD]/30 animate-in slide-in-from-top-2">
                      <label className="text-xs font-black text-[#00D2AD] uppercase tracking-widest">Link de Download ou Acesso Externo</label>
                      <input 
                        name="download_url" 
                        placeholder="https://mega.nz/..., https://mediafire.com/..., etc" 
                        defaultValue={editingService?.download_url} 
                        className="w-full bg-[#0f172a] border border-[#00D2AD]/30 rounded-2xl p-4 text-white outline-none focus:border-[#00D2AD]" 
                      />
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 italic">Este link será liberado para o cliente após o pagamento aprovado.</p>
                   </div>
                 )}

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase">URL do Logo (Imagem)</label>
                       <input name="logo_url" placeholder="https://exemplo.com/logo.png" defaultValue={editingService?.logo_url} className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white text-xs outline-none focus:border-[#00D2AD]" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Letra Ícone</label>
                       <input name="letter" maxLength={1} defaultValue={editingService?.letter || 'S'} className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white text-center font-black uppercase" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Cor Ícone (CSS)</label>
                       <input name="icon_color" placeholder="bg-blue-600" defaultValue={editingService?.icon_color} className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white text-xs" />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-[#334155] text-white py-5 rounded-2xl font-black uppercase text-sm hover:bg-[#475569] transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 bg-[#00D2AD] text-[#0f172a] py-5 rounded-2xl font-black uppercase text-sm hover:shadow-[0_0_30px_rgba(0,210,173,0.3)] transition-all">Salvar Programa</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
