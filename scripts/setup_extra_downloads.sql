CREATE TABLE IF NOT EXISTS public.extra_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT DEFAULT 'N/A',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.extra_downloads ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Permitir leitura pública" ON public.extra_downloads
    FOR SELECT USING (true);

CREATE POLICY "Permitir gestão total para admins" ON public.extra_downloads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
