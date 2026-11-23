"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminBancoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState<'asaas' | 'efibank' | null>(null);

  // Qual banco está recebendo pagamentos no site ('asaas' | 'efibank' | 'none')
  const [activeGateway, setActiveGateway] = useState<'asaas' | 'efibank' | 'none'>('asaas');

  // Dados Asaas
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [asaasWebhookToken, setAsaasWebhookToken] = useState('');
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showAsaasWebhookToken, setShowAsaasWebhookToken] = useState(false);

  // Dados Efí Bank
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
  const [testingBank, setTestingBank] = useState<'asaas' | 'efibank' | null>(null);
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

      // Buscar configurações atuais salvas
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

          // Asaas
          setAsaasApiKey(s.asaas?.api_key || '');
          setAsaasWebhookToken(s.asaas?.webhook_token || '');

          // Efí
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

  // Alterna o banco ativo para recebimento
  const handleToggleBank = (bank: 'asaas' | 'efibank') => {
    if (activeGateway === bank) {
      // Se já estava ativo, desativa
      setActiveGateway('none');
    } else {
      // Ativa o banco clicado e desativa o outro automaticamente
      setActiveGateway(bank);
    }
    setSaveMessage(null);
  };

  // Testar conexão com o banco
  const handleTestConnection = async (gateway: 'asaas' | 'efibank') => {
    setTestResult(null);
    setTestingBank(gateway);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const payload = gateway === 'asaas'
        ? { gateway: 'asaas', asaas: { api_key: asaasApiKey.trim(), environment: 'production' } }
        : { gateway: 'efibank', efibank: { client_id: efiClientId.trim(), client_secret: efiClientSecret.trim(), cert_base64: efiCertBase64.trim(), environment: 'production' } };

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
          message: result.error || 'Falha ao conectar com o banco.',
        });
      }
    } catch (err: any) {
      setTestResult({
        gateway,
        success: false,
        message: err.message || 'Erro inesperado ao testar conexão.',
      });
    } finally {
      setTestingBank(null);
    }
  };

  // Salvar configurações
  const handleSave = async (bankToSave?: 'asaas' | 'efibank') => {
    setSavingBank(bankToSave || 'asaas');
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const payload = {
        active_gateway: activeGateway,
        asaas: {
          enabled: activeGateway === 'asaas',
          environment: 'production',
          api_key: asaasApiKey.trim(),
          webhook_token: asaasWebhookToken.trim(),
        },
        efibank: {
          enabled: activeGateway === 'efibank',
          environment: 'production',
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
        const bancoNome = activeGateway === 'asaas' ? 'ASAAS' : activeGateway === 'efibank' ? 'EFÍ BANK' : 'NENHUM (PAUSADO)';
        setSaveMessage({
          type: 'success',
          text: `✅ Configurações salvas com sucesso! Banco ativo para pagamentos: ${bancoNome}.`,
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
      setSavingBank(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <AdminNav />
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#00D2AD] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Carregando dados dos bancos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <AdminNav />

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🏦</span> Bancos de Pagamento (PIX)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Escolha qual banco vai receber os pagamentos e configure as chaves seguindo o passo a passo.
          </p>
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
              className="text-xs text-gray-400 hover:text-white ml-4 underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Resultado do Teste de Conexão */}
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
                {testResult.success ? '✅ Conexão Aprovada!' : '❌ Falha ao Conectar com o Banco'}
              </p>
              <p className="text-xs mt-1 text-gray-300">{testResult.message}</p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-gray-400 hover:text-white underline shrink-0 ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* BARRA DE STATUS: Mostra qual banco está ligado */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                activeGateway !== 'none' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
              }`}
            ></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Banco que está recebendo pagamentos agora:</p>
              <p className="text-lg font-black text-white">
                {activeGateway === 'asaas' && <span className="text-[#00D2AD]">🔵 ASAAS (Ativo)</span>}
                {activeGateway === 'efibank' && <span className="text-orange-400">🟠 EFÍ BANK (Ativo)</span>}
                {activeGateway === 'none' && <span className="text-red-400">🔴 NENHUM BANCO ATIVO (PIX PAUSADO)</span>}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 max-w-xs sm:text-right">
            Apenas 1 banco fica ativo por vez para evitar qualquer confusão nas recargas.
          </p>
        </div>

        <div className="space-y-8">
          {/* ========================================================= */}
          {/* 1. CARD BANCO ASAAS */}
          {/* ========================================================= */}
          <div
            className={`bg-[#0f172a] border-2 rounded-2xl p-6 sm:p-8 transition-all ${
              activeGateway === 'asaas'
                ? 'border-[#00D2AD] shadow-xl shadow-[#00D2AD]/5'
                : 'border-[#334155]'
            }`}
          >
            {/* Topo do Card Asaas: Nome + Interruptor de Ativação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xl">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">Banco Asaas</h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Integração oficial via Chave API e Webhook instantâneo.
                  </p>
                </div>
              </div>

              {/* Botão Interruptor de Ativar/Desativar */}
              <button
                type="button"
                onClick={() => handleToggleBank('asaas')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  activeGateway === 'asaas'
                    ? 'bg-[#00D2AD] text-[#070b14] shadow-lg shadow-[#00D2AD]/20'
                    : 'bg-[#1e293b] text-gray-400 hover:text-white border border-[#334155]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    activeGateway === 'asaas' ? 'bg-[#070b14]' : 'bg-gray-500'
                  }`}
                ></div>
                {activeGateway === 'asaas' ? '● ATIVO NO SITE' : '○ ATIVAR ESTE BANCO'}
              </button>
            </div>

            {/* Passo a Passo Asaas */}
            <div className="pt-6 space-y-6">
              {/* PASSO 1: Chave de API */}
              <div className="bg-[#1e293b]/40 border border-[#334155] rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#00D2AD] flex items-center gap-1.5">
                    <span>1️⃣</span> Passo 1: Chave de API do Asaas
                  </span>
                  <a
                    href="https://www.asaas.com/customerApiAccessToken/index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Abrir tela de Chaves no Asaas ↗
                  </a>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  No Asaas, acesse <b>Integrações &gt; Chaves de API</b>, clique no botão azul <b>&quot;Gerar chave de API&quot;</b> e cole a chave abaixo:
                </p>

                <div className="relative">
                  <input
                    type={showAsaasKey ? 'text' : 'password'}
                    placeholder="Cole aqui a chave gerada (ex: $aact_YTU5YTE0M2M2N2I4...)"
                    value={asaasApiKey}
                    onChange={(e) => setAsaasApiKey(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3.5 pr-24 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00D2AD]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAsaasKey(!showAsaasKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1e293b] cursor-pointer"
                  >
                    {showAsaasKey ? '🙈 Ocultar' : '👁️ Mostrar'}
                  </button>
                </div>
              </div>

              {/* PASSO 2: Webhook */}
              <div className="bg-[#1e293b]/40 border border-[#334155] rounded-xl p-5">
                <span className="text-xs font-black uppercase tracking-wider text-[#00D2AD] flex items-center gap-1.5 mb-2">
                  <span>2️⃣</span> Passo 2: Webhook do Asaas (Notificação de Pagamento)
                </span>

                <p className="text-xs text-gray-400 mb-3">
                  No Asaas, vá na aba <b>Webhooks &gt; Adicionar Webhook</b> e cole esta URL:
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <div className="flex-1 bg-[#070b14] border border-[#334155] rounded-xl px-4 py-3 text-xs font-mono text-gray-300 break-all select-all">
                    {webhookUrls.asaas}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrls.asaas, 'asaas_webhook')}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#00D2AD]/10 hover:bg-[#00D2AD]/20 text-[#00D2AD] border border-[#00D2AD]/30 font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0 transition-all"
                  >
                    {copyFeedback === 'asaas_webhook' ? '✅ Copiado!' : '📋 Copiar Link'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#334155]/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-400">
                      Token de Autenticação do Webhook (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAsaasWebhookToken(!showAsaasWebhookToken)}
                      className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showAsaasWebhookToken ? '🙈 Ocultar' : '👁️ Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showAsaasWebhookToken ? 'text' : 'password'}
                    placeholder="Cole aqui apenas se você definiu um token no webhook do Asaas"
                    value={asaasWebhookToken}
                    onChange={(e) => setAsaasWebhookToken(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00D2AD]"
                  />
                </div>
              </div>

              {/* Botões do Card Asaas */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('asaas')}
                  disabled={testingBank === 'asaas' || !asaasApiKey}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  {testingBank === 'asaas' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      Testando Asaas...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Testar Conexão Asaas
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('asaas')}
                  disabled={savingBank === 'asaas'}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00D2AD] hover:bg-[#00bfa0] text-[#070b14] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00D2AD]/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingBank === 'asaas' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#070b14] border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Salvar Asaas
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CARD BANCO EFÍ BANK (GERENCIANET) */}
          {/* ========================================================= */}
          <div
            className={`bg-[#0f172a] border-2 rounded-2xl p-6 sm:p-8 transition-all ${
              activeGateway === 'efibank'
                ? 'border-orange-500 shadow-xl shadow-orange-500/5'
                : 'border-[#334155]'
            }`}
          >
            {/* Topo do Card Efí */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg">
                  Efí
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Efí Bank (Gerencianet)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PIX Oficial via credenciais Client ID/Secret e certificado digital.
                  </p>
                </div>
              </div>

              {/* Botão Interruptor */}
              <button
                type="button"
                onClick={() => handleToggleBank('efibank')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  activeGateway === 'efibank'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-[#1e293b] text-gray-400 hover:text-white border border-[#334155]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    activeGateway === 'efibank' ? 'bg-white' : 'bg-gray-500'
                  }`}
                ></div>
                {activeGateway === 'efibank' ? '● ATIVO NO SITE' : '○ ATIVAR ESTE BANCO'}
              </button>
            </div>

            {/* Conteúdo Efí */}
            <div className="pt-6 space-y-6">
              <div className="bg-[#1e293b]/40 border border-[#334155] rounded-xl p-5 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <span>1️⃣</span> Credenciais da API da Efí
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">
                      Client ID
                    </label>
                    <input
                      type="text"
                      placeholder="Client_Id_..."
                      value={efiClientId}
                      onChange={(e) => setEfiClientId(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-400">
                        Client Secret
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowEfiSecret(!showEfiSecret)}
                        className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
                      >
                        {showEfiSecret ? '🙈 Ocultar' : '👁️ Mostrar'}
                      </button>
                    </div>
                    <input
                      type={showEfiSecret ? 'text' : 'password'}
                      placeholder="Client_Secret_..."
                      value={efiClientSecret}
                      onChange={(e) => setEfiClientSecret(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    Chave PIX Cadastrada na Efí (CNPJ, CPF ou Aleatória)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 68634882000180"
                    value={efiPixKey}
                    onChange={(e) => setEfiPixKey(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Webhook Efí */}
              <div className="bg-[#1e293b]/40 border border-[#334155] rounded-xl p-5">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-2">
                  <span>2️⃣</span> Webhook da Efí Bank
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 bg-[#070b14] border border-[#334155] rounded-xl px-4 py-3 text-xs font-mono text-gray-300 break-all select-all">
                    {webhookUrls.efibank}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrls.efibank, 'efi_webhook')}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0 transition-all"
                  >
                    {copyFeedback === 'efi_webhook' ? '✅ Copiado!' : '📋 Copiar Link'}
                  </button>
                </div>
              </div>

              {/* Botões Efí */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('efibank')}
                  disabled={testingBank === 'efibank' || !efiClientId || !efiClientSecret}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  {testingBank === 'efibank' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                      Testando Efí...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Testar Conexão Efí
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('efibank')}
                  disabled={savingBank === 'efibank'}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingBank === 'efibank' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Salvar Efí Bank
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
