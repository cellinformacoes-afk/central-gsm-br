-- Script para criar a tabela de tutoriais no Supabase
-- Copie e cole este código no SQL Editor do seu dashboard Supabase.

-- 1. Criar tabela tutorials
CREATE TABLE IF NOT EXISTS public.tutorials (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FRP', 'MDM')),
    video_url TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    files JSONB DEFAULT '[]'::jsonb,
    attention TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Segurança (Policies)
CREATE POLICY "Permitir leitura pública" ON public.tutorials
    FOR SELECT USING (true);

CREATE POLICY "Permitir gestão total para admins" ON public.tutorials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 4. Criar Bucket no Storage (Tutorials)
-- Nota: O bucket deve ser criado via Interface do Supabase (Storage > New Bucket > "tutorials")
-- No entanto, você pode habilitar o acesso público ao bucket com este SQL após criá-lo:
-- (Apenas se o bucket já existir)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tutorials', 'tutorials', true) ON CONFLICT (id) DO UPDATE SET public = true;
