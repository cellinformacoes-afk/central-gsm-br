"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminNoticiaPage() {
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchNotice();
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
    if (profile?.role !== 'admin') router.push('/');
  }

  async function fetchNotice() {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_notice')
      .select('message, enabled')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setMessage(data.message || '');
      setEnabled(data.enabled || false);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('site_notice')
      .upsert({ id: 1, message, enabled, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    setSaving(false);
    if (error) {
      alert("Erro ao salvar: " + error.message + "\n\nCertifique-se de executar o script setup_site_notice.sql no SQL Editor do Supabase.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <AdminNav />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">📢 Balão de Aviso</h1>
        <p className="text-gray-400 text-sm">
          Controle o balão de observação que aparece no site para avisar sobre instabilidade ou ferramentas offline.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 space-y-6">
          {/* Toggle Ligar/Desligar */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold">Ligar / Desligar balão</div>
              <div className="text-gray-400 text-sm">
                {enabled ? 'O balão está ATIVO e visível para os visitantes.' : 'O balão está DESLIGADO e não aparece no site.'}
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-16 h-8 rounded-full transition-colors shrink-0 ${enabled ? 'bg-[#00D2AD]' : 'bg-[#334155]'}`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${enabled ? 'left-9' : 'left-1'}`}
              />
            </button>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-white font-bold mb-2">Mensagem do aviso</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: O serviço de desbloqueio MDM está temporariamente indisponível. Estamos trabalhando para resolver o mais rápido possível."
              rows={5}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white text-sm focus:border-[#00D2AD] focus:outline-none resize-none"
            />
          </div>

          {/* Visualização */}
          {message && (
            <div className="border-t border-[#334155] pt-6">
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Pré-visualização</div>
              <div className="rounded-2xl border border-[#FFC107]/40 bg-[#0f172a] shadow-[0_10px_30px_rgba(0,0,0,0.4)] max-w-sm">
                <div className="flex items-start gap-3 p-4">
                  <span className="text-[#FFC107] text-lg leading-none mt-0.5">⚠️</span>
                  <p className="text-white text-sm leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] px-6 py-2.5 rounded-lg font-black uppercase text-xs tracking-widest disabled:opacity-50 transition-all"
            >
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
            {saved && <span className="text-[#00D2AD] text-sm font-bold">✓ Salvo com sucesso!</span>}
          </div>
        </div>
      )}
    </div>
  );
}
