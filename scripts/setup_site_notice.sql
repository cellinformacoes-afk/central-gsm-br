-- Script para criar a tabela de notificação/aviso (balao de obs) no Supabase
-- Copie e cole este código no SQL Editor do seu dashboard Supabase.

-- 1. Criar tabela site_notice
CREATE TABLE IF NOT EXISTS public.site_notice (
    id BIGINT PRIMARY KEY DEFAULT 1,
    message TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garante que sempre exista apenas uma linha
INSERT INTO public.site_notice (id, message, enabled)
SELECT 1, '', false
WHERE NOT EXISTS (SELECT 1 FROM public.site_notice WHERE id = 1);

-- 2. Habilitar RLS
ALTER TABLE public.site_notice ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Segurança (Policies)
-- Permite leitura pública (todos os visitantes podem ver o aviso)
CREATE POLICY "Permitir leitura pública" ON public.site_notice
    FOR SELECT USING (true);

-- Permite gestão (UPDATE) apenas para admins
CREATE POLICY "Permitir gestão total para admins" ON public.site_notice
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
