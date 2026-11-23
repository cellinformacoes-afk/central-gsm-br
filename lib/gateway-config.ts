import { supabaseAdmin } from '@/lib/supabase-admin';

export interface GatewaySettings {
  active_gateway: 'asaas' | 'efibank' | 'none';
  asaas: {
    enabled: boolean;
    environment: 'production' | 'sandbox';
    api_key: string;
    webhook_token: string;
  };
  efibank: {
    enabled: boolean;
    environment: 'production' | 'sandbox';
    client_id: string;
    client_secret: string;
    pix_key: string;
    cert_base64: string;
  };
  updated_at?: string;
}

const DEFAULT_SETTINGS: GatewaySettings = {
  active_gateway: 'asaas',
  asaas: {
    enabled: true,
    environment: 'production',
    api_key: process.env.ASAAS_API_KEY || '',
    webhook_token: process.env.ASAAS_WEBHOOK_TOKEN || '',
  },
  efibank: {
    enabled: true,
    environment: 'production',
    client_id: process.env.EFI_CLIENT_ID || '',
    client_secret: process.env.EFI_CLIENT_SECRET || '',
    pix_key: process.env.EFI_PIX_KEY || '',
    cert_base64: process.env.EFI_CERT_BASE64 || '',
  },
};

/**
 * Obtém as configurações de gateway do banco de dados (com cache/fallback).
 */
export async function getGatewaySettings(): Promise<GatewaySettings> {
  try {
    // 1. Tenta carregar da tabela nativa gateway_settings
    const { data: tableData, error: tableErr } = await supabaseAdmin
      .from('gateway_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!tableErr && tableData) {
      return {
        active_gateway: tableData.active_gateway || 'asaas',
        asaas: {
          enabled: tableData.asaas_enabled ?? true,
          environment: tableData.asaas_environment || 'production',
          api_key: tableData.asaas_api_key || process.env.ASAAS_API_KEY || '',
          webhook_token: tableData.asaas_webhook_token || process.env.ASAAS_WEBHOOK_TOKEN || '',
        },
        efibank: {
          enabled: tableData.efibank_enabled ?? true,
          environment: tableData.efibank_environment || 'production',
          client_id: tableData.efibank_client_id || process.env.EFI_CLIENT_ID || '',
          client_secret: tableData.efibank_client_secret || process.env.EFI_CLIENT_SECRET || '',
          pix_key: tableData.efibank_pix_key || process.env.EFI_PIX_KEY || '',
          cert_base64: tableData.efibank_cert_base64 || process.env.EFI_CERT_BASE64 || '',
        },
        updated_at: tableData.updated_at,
      };
    }

    // 2. Se tabela não existe, busca da tabela site_notice id=99 (persistência instantânea)
    const { data: noticeData, error: noticeErr } = await supabaseAdmin
      .from('site_notice')
      .select('message, updated_at')
      .eq('id', 99)
      .maybeSingle();

    if (!noticeErr && noticeData?.message) {
      try {
        const parsed = JSON.parse(noticeData.message);
        return {
          active_gateway: parsed.active_gateway || 'asaas',
          asaas: {
            enabled: parsed.asaas?.enabled ?? true,
            environment: parsed.asaas?.environment || 'production',
            api_key: parsed.asaas?.api_key || process.env.ASAAS_API_KEY || '',
            webhook_token: parsed.asaas?.webhook_token || process.env.ASAAS_WEBHOOK_TOKEN || '',
          },
          efibank: {
            enabled: parsed.efibank?.enabled ?? true,
            environment: parsed.efibank?.environment || 'production',
            client_id: parsed.efibank?.client_id || process.env.EFI_CLIENT_ID || '',
            client_secret: parsed.efibank?.client_secret || process.env.EFI_CLIENT_SECRET || '',
            pix_key: parsed.efibank?.pix_key || process.env.EFI_PIX_KEY || '',
            cert_base64: parsed.efibank?.cert_base64 || process.env.EFI_CERT_BASE64 || '',
          },
          updated_at: noticeData.updated_at,
        };
      } catch (e) {
        console.error('Erro ao converter JSON do site_notice id=99:', e);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar configurações de gateway:', err);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Salva as configurações de gateway no banco de dados.
 */
export async function saveGatewaySettings(settings: Partial<GatewaySettings>): Promise<boolean> {
  const current = await getGatewaySettings();
  const merged: GatewaySettings = {
    active_gateway: settings.active_gateway || current.active_gateway || 'asaas',
    asaas: {
      enabled: settings.asaas?.enabled ?? current.asaas.enabled,
      environment: settings.asaas?.environment || current.asaas.environment,
      api_key: settings.asaas?.api_key ?? current.asaas.api_key,
      webhook_token: settings.asaas?.webhook_token ?? current.asaas.webhook_token,
    },
    efibank: {
      enabled: settings.efibank?.enabled ?? current.efibank.enabled,
      environment: settings.efibank?.environment || current.efibank.environment,
      client_id: settings.efibank?.client_id ?? current.efibank.client_id,
      client_secret: settings.efibank?.client_secret ?? current.efibank.client_secret,
      pix_key: settings.efibank?.pix_key ?? current.efibank.pix_key,
      cert_base64: settings.efibank?.cert_base64 ?? current.efibank.cert_base64,
    },
    updated_at: new Date().toISOString(),
  };

  let saved = false;

  // 1. Tenta salvar no gateway_settings
  try {
    const { error } = await supabaseAdmin.from('gateway_settings').upsert({
      id: 1,
      active_gateway: merged.active_gateway,
      asaas_enabled: merged.asaas.enabled,
      asaas_environment: merged.asaas.environment,
      asaas_api_key: merged.asaas.api_key,
      asaas_webhook_token: merged.asaas.webhook_token,
      efibank_enabled: merged.efibank.enabled,
      efibank_environment: merged.efibank.environment,
      efibank_client_id: merged.efibank.client_id,
      efibank_client_secret: merged.efibank.client_secret,
      efibank_pix_key: merged.efibank.pix_key,
      efibank_cert_base64: merged.efibank.cert_base64,
      updated_at: merged.updated_at,
    });
    if (!error) saved = true;
  } catch (e) {
    // ignora se tabela não existir
  }

  // 2. Salva no site_notice id=99 como garantia/fallback
  try {
    const { error } = await supabaseAdmin.from('site_notice').upsert({
      id: 99,
      message: JSON.stringify(merged),
      enabled: true,
      updated_at: merged.updated_at,
    });
    if (!error) saved = true;
  } catch (e) {
    console.error('Erro ao salvar no site_notice id=99:', e);
  }

  return saved;
}
