-- Tabela para armazenar as credenciais e o banco ativo de pagamento (Asaas e Efí Bank)
-- Pode ser executada no SQL Editor do Supabase se desejar criar a tabela nativa.

CREATE TABLE IF NOT EXISTS public.gateway_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    active_gateway TEXT NOT NULL DEFAULT 'asaas', -- 'asaas' ou 'efibank'
    asaas_enabled BOOLEAN NOT NULL DEFAULT true,
    asaas_environment TEXT NOT NULL DEFAULT 'production', -- 'production' ou 'sandbox'
    asaas_api_key TEXT NOT NULL DEFAULT '',
    asaas_webhook_token TEXT NOT NULL DEFAULT '',
    efibank_enabled BOOLEAN NOT NULL DEFAULT true,
    efibank_environment TEXT NOT NULL DEFAULT 'production',
    efibank_client_id TEXT NOT NULL DEFAULT '',
    efibank_client_secret TEXT NOT NULL DEFAULT '',
    efibank_pix_key TEXT NOT NULL DEFAULT '',
    efibank_cert_base64 TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir registro inicial caso não exista
INSERT INTO public.gateway_settings (id, active_gateway, asaas_enabled)
SELECT 1, 'asaas', true
WHERE NOT EXISTS (SELECT 1 FROM public.gateway_settings WHERE id = 1);

-- RLS
ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler ou alterar as configurações
CREATE POLICY "Apenas admins acessam gateway_settings" ON public.gateway_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
