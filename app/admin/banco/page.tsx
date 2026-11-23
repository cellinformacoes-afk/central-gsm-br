"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminBancoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'asaas' | 'efibank'>('asaas');

  // Configurações
  const [activeGateway, setActiveGateway] = useState<'asaas' | 'efibank'>('asaas');
  
  // Asaas
  const [asaasEnabled, setAsaasEnabled] = useState(true);
  const [asaasEnv, setAsaasEnv] = useState<'production' | 'sandbox'>('production');
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [asaasWebhookToken, setAsaasWebhookToken] = useState('');
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showAsaasWebhookToken, setShowAsaasWebhookToken] = useState(false);

  // Efí Bank
  const [efiEnabled, setEfiEnabled] = useState(true);
  const [efiEnv, setEfiEnv] = useState<'production' | 'sandbox'>('production');
  const [efiClientId, setEfiClientId] = useState('');
  const [efiClientSecret, setEfiClientSecret] = useState('');
  const [efiPixKey, setEfiPixKey] = useState('');
  const [efiCertBase64, setEfiCertBase64] = useState('');
  const [showEfiSecret, setShowEfiSecret] = useState(false);

  // URLs de Webhook
  const [webhookUrls, setWebhookUrls] = useState({
    asaas: 'https://centralgsm.com.br/api/webhooks/asaas',
    efibank: 'https://centralgsm.com.br/api/webhooks/efibank',
  });

  // Feedbacks
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [testingEfi, setTestingEfi] = useState(false);
  const [testResult, setTestResult] = useState<{ gateway: string; success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    try {
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
        return;
      }

      // Buscar configurações atuais
      const res = await fetch('/api/admin/gateway-settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          setActiveGateway(s.active_gateway || 'asaas');
          setActiveTab(s.active_gateway || 'asaas');

          // Asaas
          setAsaasEnabled(s.asaas?.enabled ?? true);
          setAsaasEnv(s.asaas?.environment || 'production');
          setAsaasApiKey(s.asaas?.api_key || '');
          setAsaasWebhookToken(s.asaas?.webhook_token || '');

          // Efí
          setEfiEnabled(s.efibank?.enabled ?? true);
          setEfiEnv(s.efibank?.environment || 'production');
          setEfiClientId(s.efibank?.client_id || '');
          setEfiClientSecret(s.efibank?.client_secret || '');
          setEfiPixKey(s.efibank?.pix_key || '');
          setEfiCertBase64(s.efibank?.cert_base64 || '');
        }

        if (data.webhook_urls) {
          setWebhookUrls(data.webhook_urls);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleTestConnection = async (gateway: 'asaas' | 'efibank') => {
    setTestResult(null);
    if (gateway === 'asaas') setTestingAsaas(true);
    if (gateway === 'efibank') setTestingEfi(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const payload = gateway === 'asaas' 
        ? { gateway: 'asaas', asaas: { api_key: asaasApiKey, environment: asaasEnv } }
        : { gateway: 'efibank', efibank: { client_id: efiClientId, client_secret: efiClientSecret, cert_base64: efiCertBase64, environment: efiEnv } };

      const res = await fetch('/api/admin/gateway-settings/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setTestResult({
          gateway,
          success: true,
          message: result.message || 'Conexão testada e aprovada com sucesso!',
        });
      } else {
        setTestResult({
          gateway,
          success: false,
          message: result.error || 'Falha ao conectar.',
        });
      }
    } catch (err: any) {
      setTestResult({
        gateway,
        success: false,
        message: err.message || 'Erro inesperado ao testar conexão.',
      });
    } finally {
      setTestingAsaas(false);
      setTestingEfi(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const payload = {
        active_gateway: activeGateway,
        asaas: {
          enabled: asaasEnabled,
          environment: asaasEnv,
          api_key: asaasApiKey.trim(),
          webhook_token: asaasWebhookToken.trim(),
        },
        efibank: {
          enabled: efiEnabled,
          environment: efiEnv,
          client_id: efiClientId.trim(),
          client_secret: efiClientSecret.trim(),
          pix_key: efiPixKey.trim(),
          cert_base64: efiCertBase64.trim(),
        },
      };

      const res = await fetch('/api/admin/gateway-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSaveMessage({
          type: 'success',
          text: `✅ Configurações salvas! Banco ativo: ${activeGateway === 'asaas' ? 'ASAAS' : 'EFÍ BANK'}. O site já está usando essas configurações.`,
        });
      } else {
        setSaveMessage({
          type: 'error',
          text: `❌ Erro ao salvar: ${result.error || 'Erro desconhecido'}`,
        });
      }
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: `❌ Falha: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <AdminNav />
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#00D2AD] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Carregando configurações de pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <AdminNav />

        {/* Título & Descrição */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏦</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Configuração de Bancos (PIX)
              </h1>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Configure suas chaves de API e Webhook do Asaas ou Efí Bank sem precisar de suporte ou mexer em código.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#00D2AD] hover:bg-[#00bfa0] text-[#070b14] font-black uppercase text-xs tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-[#00D2AD]/20 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#070b14] border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <span>💾</span> Salvar Configurações
              </>
            )}
          </button>
        </div>

        {/* Notificação de Sucesso/Erro */}
        {saveMessage && (
          <div
            className={`p-4 rounded-xl mb-6 border text-sm font-medium flex items-center justify-between ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span>{saveMessage.text}</span>
            <button
              onClick={() => setSaveMessage(null)}
              className="text-xs text-gray-400 hover:text-white ml-4 underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 1. SELETOR DE BANCO ATIVO (1 CLIQUE) */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>🎯</span> Banco Ativo no Site
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Escolha qual banco vai gerar os Pix para recargas e pagamentos dos clientes agora.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#00D2AD]/10 text-[#00D2AD] border border-[#00D2AD]/20 font-bold uppercase tracking-wider">
              Ativo: {activeGateway === 'asaas' ? 'ASAAS' : 'EFÍ BANK'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cartão Asaas */}
            <div
              onClick={() => setActiveGateway('asaas')}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                activeGateway === 'asaas'
                  ? 'border-[#00D2AD] bg-[#00D2AD]/5 shadow-lg shadow-[#00D2AD]/10'
                  : 'border-[#334155] bg-[#1e293b]/40 hover:border-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  activeGateway === 'asaas'
                    ? 'border-[#00D2AD] bg-[#00D2AD]'
                    : 'border-gray-500'
                }`}
              >
                {activeGateway === 'asaas' && <div className="w-2 h-2 rounded-full bg-[#070b14]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span className="text-blue-400 font-black">A</span> Asaas (Recomendado)
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Chave API + Webhook
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Ativação rápida e fácil. Basta colar a chave de API e o token de webhook para emitir Pix na hora.
                </p>
              </div>
            </div>

            {/* Cartão Efí Bank */}
            <div
              onClick={() => setActiveGateway('efibank')}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                activeGateway === 'efibank'
                  ? 'border-[#f97316] bg-[#f97316]/5 shadow-lg shadow-[#f97316]/10'
                  : 'border-[#334155] bg-[#1e293b]/40 hover:border-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  activeGateway === 'efibank'
                    ? 'border-[#f97316] bg-[#f97316]'
                    : 'border-gray-500'
                }`}
              >
                {activeGateway === 'efibank' && <div className="w-2 h-2 rounded-full bg-[#070b14]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span className="text-orange-400 font-black">Efí</span> Efí Bank (Gerencianet)
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                    Certificado mTLS
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  PIX Oficial bancário via credenciais OAuth Client ID/Secret e certificado de segurança.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ABAS DE CONFIGURAÇÃO INDIVIDUAL DOS BANCOS */}
        <div className="flex border-b border-[#334155] gap-2 mb-6">
          <button
            onClick={() => setActiveTab('asaas')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'asaas'
                ? 'bg-[#1e293b] text-[#00D2AD] border-t-2 border-[#00D2AD]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏦</span> Banco Asaas
            {activeGateway === 'asaas' && (
              <span className="w-2 h-2 rounded-full bg-[#00D2AD]" title="Banco em uso"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('efibank')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'efibank'
                ? 'bg-[#1e293b] text-orange-400 border-t-2 border-orange-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🛡️</span> Efí Bank (Gerencianet)
            {activeGateway === 'efibank' && (
              <span className="w-2 h-2 rounded-full bg-orange-400" title="Banco em uso"></span>
            )}
          </button>
        </div>

        {/* RESULTADO DO TESTE DE CONEXÃO */}
        {testResult && (
          <div
            className={`p-4 rounded-xl mb-6 border text-sm font-medium flex items-start justify-between ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div>
              <p className="font-bold">
                {testResult.success ? '✅ Teste de Conexão Bem-Sucedido!' : '❌ Falha no Teste de Conexão'}
              </p>
              <p className="text-xs mt-1 text-gray-300">{testResult.message}</p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-gray-400 hover:text-white underline shrink-0 ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ── PAINEL ASAAS ── */}
        {activeTab === 'asaas' && (
          <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="text-blue-400">🔹</span> Credenciais do Banco Asaas
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Obtenha suas chaves em: <b>Asaas &gt; Configurações &gt; Integrações &gt; Chaves de API</b>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://www.asaas.com/customerApiAccessToken/index"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1"
                >
                  Abrir tela de chaves do Asaas ↗
                </a>
              </div>
            </div>

            {/* Ambiente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ambiente Asaas
                </label>
                <select
                  value={asaasEnv}
                  onChange={(e: any) => setAsaasEnv(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D2AD]"
                >
                  <option value="production">🚀 Produção (Contas e Dinheiro Real)</option>
                  <option value="sandbox">🧪 Sandbox (Ambiente de Testes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Status da Integração Asaas
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="asaasEnabled"
                    checked={asaasEnabled}
                    onChange={(e) => setAsaasEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#00D2AD] rounded cursor-pointer"
                  />
                  <label htmlFor="asaasEnabled" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Habilitar Asaas no sistema
                  </label>
                </div>
              </div>
            </div>

            {/* Chave API */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Chave API do Asaas (Access Token) <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAsaasKey(!showAsaasKey)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  {showAsaasKey ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={showAsaasKey ? 'text' : 'password'}
                placeholder="$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAw..."
                value={asaasApiKey}
                onChange={(e) => setAsaasApiKey(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00D2AD]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Gere essa chave no botão azul <b>&quot;Gerar chave de API&quot;</b> dentro do painel do Asaas.
              </p>
            </div>

            {/* URL DO WEBHOOK PARA COPIAR */}
            <div className="bg-[#1e293b]/60 border border-[#334155] rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#00D2AD]">
                  🔗 URL do Webhook do Asaas (Copie e cole no Asaas)
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrls.asaas, 'asaas_webhook')}
                  className="text-xs font-bold text-[#00D2AD] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copyFeedback === 'asaas_webhook' ? '✅ Copiado!' : '📋 Copiar Link'}
                </button>
              </div>
              <div className="bg-[#070b14] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-gray-300 break-all select-all">
                {webhookUrls.asaas}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                <b>Passo a Passo no Asaas:</b> Vá em <b>Integrações &gt; Webhooks &gt; Adicionar Webhook</b>, cole a URL acima e selecione os eventos de cobrança (<i>Pagamento recebido</i> e <i>Pagamento confirmado</i>).
              </p>
            </div>

            {/* Token do Webhook */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Token de Autenticação do Webhook (Opcional, para segurança extra)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAsaasWebhookToken(!showAsaasWebhookToken)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  {showAsaasWebhookToken ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={showAsaasWebhookToken ? 'text' : 'password'}
                placeholder="Ex: seu_token_secreto_webhook_asaas"
                value={asaasWebhookToken}
                onChange={(e) => setAsaasWebhookToken(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00D2AD]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Se você preencher um token no campo &quot;Token de autenticação&quot; na criação do Webhook no Asaas, cole o mesmo aqui.
              </p>
            </div>

            {/* Botão Testar Conexão Asaas */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => handleTestConnection('asaas')}
                disabled={testingAsaas || !asaasApiKey}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {testingAsaas ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Testando conexão Asaas...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Testar Conexão Asaas
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center sm:text-right">
                Lembre-se de clicar em <b>Salvar Configurações</b> no topo após alterar.
              </p>
            </div>
          </div>
        )}

        {/* ── PAINEL EFÍ BANK ── */}
        {activeTab === 'efibank' && (
          <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="text-orange-400">🔸</span> Credenciais Efí Bank (Gerencianet)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Obtenha em: <b>Efí &gt; API &gt; Minhas Aplicações &gt; Chaves</b>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://app.sejaefi.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-400 hover:text-orange-300 underline font-medium flex items-center gap-1"
                >
                  Abrir painel da Efí ↗
                </a>
              </div>
            </div>

            {/* Ambiente e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ambiente Efí Bank
                </label>
                <select
                  value={efiEnv}
                  onChange={(e: any) => setEfiEnv(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="production">🚀 Produção (Contas Reais)</option>
                  <option value="sandbox">🧪 Homologação (Testes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Status da Integração Efí
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="efiEnabled"
                    checked={efiEnabled}
                    onChange={(e) => setEfiEnabled(e.target.checked)}
                    className="w-5 h-5 accent-orange-400 rounded cursor-pointer"
                  />
                  <label htmlFor="efiEnabled" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Habilitar Efí Bank no sistema
                  </label>
                </div>
              </div>
            </div>

            {/* Client ID e Secret */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Client ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Client_Id_..."
                  value={efiClientId}
                  onChange={(e) => setEfiClientId(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Client Secret <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEfiSecret(!showEfiSecret)}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showEfiSecret ? '🙈 Ocultar' : '👁️ Mostrar'}
                  </button>
                </div>
                <input
                  type={showEfiSecret ? 'text' : 'password'}
                  placeholder="Client_Secret_..."
                  value={efiClientSecret}
                  onChange={(e) => setEfiClientSecret(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* Chave Pix */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Chave PIX Cadastrada na Efí (CNPJ, CPF ou Aleatória) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 68634882000180 ou chave-aleatoria-uuid"
                value={efiPixKey}
                onChange={(e) => setEfiPixKey(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Certificado Base64 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Certificado Digital (.p12 em Base64)
              </label>
              <textarea
                rows={3}
                placeholder="MIIKXQIBAzCCCiMGCSqGSIb3DQEHAaCCChQEggoQMIIKDDCCBMMG..."
                value={efiCertBase64}
                onChange={(e) => setEfiCertBase64(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Certificado de autenticação mTLS fornecido pela Efí. Já existe um certificado padrão configurado no sistema.
              </p>
            </div>

            {/* URL DO WEBHOOK EFÍ */}
            <div className="bg-[#1e293b]/60 border border-[#334155] rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-orange-400">
                  🔗 URL do Webhook da Efí Bank
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrls.efibank, 'efi_webhook')}
                  className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copyFeedback === 'efi_webhook' ? '✅ Copiado!' : '📋 Copiar Link'}
                </button>
              </div>
              <div className="bg-[#070b14] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-gray-300 break-all select-all">
                {webhookUrls.efibank}
              </div>
            </div>

            {/* Botão Testar Conexão Efí */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => handleTestConnection('efibank')}
                disabled={testingEfi || !efiClientId || !efiClientSecret}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {testingEfi ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    Testando conexão Efí...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Testar Conexão Efí
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center sm:text-right">
                Lembre-se de clicar em <b>Salvar Configurações</b> no topo após alterar.
              </p>
            </div>
          </div>
        )}

        {/* Botão Salvar no Rodapé também */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#00D2AD] hover:bg-[#00bfa0] text-[#070b14] font-black uppercase text-xs tracking-wider px-8 py-4 rounded-xl shadow-lg shadow-[#00D2AD]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
