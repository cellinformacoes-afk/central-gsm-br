"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

interface Step {
  title: string;
  description: string;
  image_url?: string;
}

interface Tutorial {
  id?: string;
  brand: string;
  model: string;
  category: 'FRP' | 'MDM';
  video_url?: string;
  steps: Step[];
  files: { name: string; size: string; url?: string }[];
}

export default function AdminTutoriaisPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [formData, setFormData] = useState<Tutorial>({
    brand: '',
    model: '',
    category: 'FRP',
    steps: [{ title: '', description: '' }],
    files: []
  });
  const [uploading, setUploading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchTutorials();
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

  async function fetchTutorials() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .order('brand', { ascending: true })
      .order('model', { ascending: true });

    if (!error) setTutorials(data || []);
    setLoading(false);
  }

  const handleOpenModal = (tutorial: Tutorial | null = null) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setFormData(tutorial);
    } else {
      setEditingTutorial(null);
      setFormData({
        brand: '',
        model: '',
        category: 'FRP',
        steps: [{ title: '', description: '' }],
        files: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', description: '' }]
    });
  };

  const handleStepChange = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  async function handleSave() {
    try {
      if (editingTutorial?.id) {
        const { error } = await supabase
          .from('tutorials')
          .update(formData)
          .eq('id', editingTutorial.id);
        if (error) throw error;
        alert("Tutorial atualizado!");
      } else {
        const { error } = await supabase
          .from('tutorials')
          .insert([formData]);
        if (error) throw error;
        alert("Tutorial criado!");
      }
      setIsModalOpen(false);
      fetchTutorials();
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este tutorial permanentemente?")) return;
    const { error } = await supabase.from('tutorials').delete().eq('id', id);
    if (!error) {
      fetchTutorials();
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, stepIndex: number) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `steps/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tutorials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tutorials')
        .getPublicUrl(filePath);

      handleStepChange(stepIndex, 'image_url', publicUrl);
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <AdminNav />

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter text-glow-teal">GESTOR DE <span className="text-[#00D2AD]">TUTORIAIS</span> 📖</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 font-noto">Criação e edição de métodos FRP e MDM</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#00D2AD] hover:bg-[#00b293] text-[#0f172a] font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)] hover:scale-105 active:scale-95"
        >
          Novo Tutorial
        </button>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca / Modelo</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Passos</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold uppercase text-xs animate-pulse">Carregando tutoriais...</td></tr>
            ) : tutorials.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum tutorial cadastrado.</td></tr>
            ) : (
              tutorials.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-black group-hover:text-[#00D2AD] transition-colors">{t.model}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t.brand}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                      t.category === 'FRP' ? 'bg-[#00D2AD]/20 text-[#00D2AD]' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-gray-400 font-bold">
                    {t.steps.length} passos
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(t)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button onClick={() => handleDelete(t.id!)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
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

      {/* Modal - Adicionar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-8 custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <h2 className="text-2xl font-black text-white uppercase italic">
                {editingTutorial ? 'Editar' : 'Novo'} <span className="text-[#00D2AD]">Tutorial</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Marca</label>
                  <input 
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                    placeholder="EX: SAMSUNG, POCO" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Modelo</label>
                  <input 
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#00D2AD]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                    placeholder="EX: S23 Ultra, Poco X5" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                <div className="flex gap-2">
                  {['FRP', 'MDM'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({...formData, category: cat as any})}
                      className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        formData.category === cat 
                          ? 'bg-[#00D2AD] text-[#0f172a]' 
                          : 'bg-black/20 text-gray-500 border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passo a Passo</label>
                  <button onClick={handleAddStep} className="text-[#00D2AD] text-[10px] font-black uppercase tracking-widest hover:underline">+ Adicionar Passo</button>
                </div>
                
                <div className="space-y-4">
                  {formData.steps.map((step, idx) => (
                    <div key={idx} className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3 relative group">
                      <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase">
                        <span>Passo {idx + 1}</span>
                        {formData.steps.length > 1 && (
                          <button onClick={() => handleRemoveStep(idx)} className="text-red-500/50 hover:text-red-500 transition-colors">Remover</button>
                        )}
                      </div>
                      <input 
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        className="w-full bg-transparent border-b border-white/5 py-1 text-sm text-white focus:border-[#00D2AD]/50 outline-none font-bold"
                        placeholder="Título do passo"
                      />
                      <textarea 
                        value={step.description}
                        onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                        className="w-full bg-transparent text-xs text-gray-400 focus:text-white outline-none resize-none"
                        rows={2}
                        placeholder="Descrição detalhada..."
                      />
                      
                      <div className="flex items-center gap-3 pt-2">
                        {step.image_url ? (
                          <div className="w-full flex items-center justify-between bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                            <span className="text-[9px] text-green-400 font-bold truncate pr-2">Imagem enviada ✅</span>
                            <button onClick={() => handleStepChange(idx, 'image_url', '')} className="text-red-400 hover:text-red-500 px-2">
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, idx)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploading}
                            />
                            <div className="w-full py-2 border-2 border-dashed border-white/5 rounded-lg text-center text-[9px] font-black text-gray-500 uppercase group-hover:border-[#00D2AD]/30 transition-all">
                              {uploading ? 'Enviando...' : '+ Adicionar Imagem'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="flex-[2] bg-[#00D2AD] hover:bg-[#00b293] text-[#0f172a] font-black uppercase text-xs tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,210,173,0.3)]"
                >
                  Salvar Tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 210, 173, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 210, 173, 0.4);
        }
        .text-glow-teal {
          text-shadow: 0 0 15px rgba(0, 210, 173, 0.4);
        }
      `}</style>
    </div>
  );
}
