-- Execute este script no SQL Editor do seu Painel do Supabase
-- para adicionar as colunas de aceite de termos na tabela profiles.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted_version TEXT;

-- Adiciona comentário para documentação das colunas
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Data e hora em que o usuário aceitou os Termos de Uso e Responsabilidade';
COMMENT ON COLUMN public.profiles.terms_accepted_ip IS 'Endereço de IP do usuário no momento do aceite dos termos';
COMMENT ON COLUMN public.profiles.terms_accepted_version IS 'Versão dos termos aceitos pelo usuário';
