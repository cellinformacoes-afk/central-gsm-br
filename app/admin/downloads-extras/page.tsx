"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

interface ExtraDownload {
  id?: string;
  name: string;
  description: string;
  url: string;
  brand: string;
  size: string;
}

export default function AdminDownloadsExtrasPage() {
  const [downloads, setDownloads] = useState<ExtraDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<ExtraDownload | null>(null);
  const [formData, setFormData] = useState<ExtraDownload>({
    name: '',
    description: '',
    url: '',
    brand: '',
    size: 'N/A'
  });
  
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchDownloads();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
    }
  }

  async function fetchDownloads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('extra_downloads')
      .select('*')
      .order('brand', { ascending: true })
      .order('name', { ascending: true });

    if (!error) setDownloads(data || []);
    setLoading(false);
  }

  const handleOpenModal = (download: ExtraDownload | null = null) => {
    if (download) {
      setEditingDownload(download);
      setFormData(download);
    } else {
      setEditingDownload(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        brand: '',
        size: 'N/A'
      });
    }
    setIsModalOpen(true);
  };

  async function handleSave() {
    if (saving) return;
    if (!formData.name || !formData.url || !formData.brand) {
      alert("Preencha o nome, link (URL) e a marca.");
      return;
    }
    
    setSaving(true);
    try {
      if (editingDownload?.id) {
        const { error } = await supabase
          .from('extra_downloads')
          .update(formData)
          .eq('id', editingDownload.id);
        if (error) throw error;
        alert("Download atualizado!");
      } else {
        const { error } = await supabase
          .from('extra_downloads')
          .insert([formData]);
        if (error) throw error;
        alert("Download adicionado!");
      }
      setIsModalOpen(false);
      fetchDownloads();
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message + "\n\nVocê já executou o arquivo SQL no Supabase para criar a tabela?");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este download permanentemente?")) return;
    const { error } = await supabase.from('extra_downloads').delete().eq('id', id);
    if (!error) {
      fetchDownloads();
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter text-glow-teal">GESTOR DE <span className="text-[#00D2AD]">DOWNLOADS</span> 💾</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Adicionar links para a aba Download Extra</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#00D2AD] hover:bg-[#00b293] text-[#0f172a] font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:scale-105 active:scale-95"
        >
          Novo Download
        </button>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Modelo</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Link</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold uppercase text-xs animate-pulse">Carregando downloads...</td></tr>
            ) : downloads.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum download cadastrado. Adicione um clicando no botão acima.</td></tr>
            ) : (
              downloads.map((d) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-black group-hover:text-[#00D2AD] transition-colors">{d.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{d.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-[#00D2AD]/20 text-[#00D2AD]">
                      {d.brand}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline max-w-[200px] truncate inline-block">
                      {d.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(d)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button onClick={() => handleDelete(d.id!)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <h2 className="text-2xl font-black text-white uppercase italic">
                {editingDownload ? 'Editar' : 'Novo'} <span className="text-[#00D2AD]">Download</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Marca / Categoria</label>
                  <input 
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                    placeholder="EX: SAMSUNG, MOTOROLA" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tamanho</label>
                  <input 
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                    placeholder="EX: 2.5 GB ou N/A" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome do Arquivo / Ferramenta</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                  placeholder="EX: Firmware Samsung S23" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Link de Download (URL)</label>
                <input 
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                  placeholder="EX: https://mega.nz/... ou Google Drive" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição Curta</label>
                <textarea 
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                  placeholder="Para que serve este arquivo..."
                  rows={2}
                />
              </div>

              <div className="pt-8 border-t border-white/5 flex gap-4">
                 <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase text-xs tracking-widest py-4 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-[2] font-black uppercase text-xs tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)] ${
                    saving 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none' 
                      : 'bg-[#00D2AD] hover:bg-[#00b293] text-[#0f172a]'
                  }`}
                >
                  {saving ? 'Gravando...' : 'Salvar Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
