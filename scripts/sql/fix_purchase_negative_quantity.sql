-- Script para corrigir a vulnerabilidade de quantidade negativa nas compras
-- Execute este código no SQL Editor do Supabase (Supabase Dashboard > SQL Editor > New Query)

-- 1. Tratar dados antigos de exploração para não quebrar a criação das constraints (mantendo para histórico de auditoria)
UPDATE public.orders 
SET 
    total_price = 0, 
    input_data = jsonb_set(input_data, '{quantity}', '0'::jsonb) 
WHERE total_price < 0 OR (input_data->>'quantity')::int < 0;

UPDATE public.transactions 
SET 
    amount = 0, 
    description = '[EXPLOIT REVERTIDO] ' || COALESCE(description, '') 
WHERE type = 'purchase' AND amount > 0;

-- 2. Adicionar restrição (constraint) na tabela de pedidos para impedir preços negativos
ALTER TABLE public.orders 
ADD CONSTRAINT chk_order_total_price 
CHECK (total_price >= 0);

-- 3. Adicionar restrição (constraint) na tabela de pedidos para impedir quantidades menores ou iguais a zero
ALTER TABLE public.orders 
ADD CONSTRAINT chk_order_quantity 
CHECK (
    input_data->>'quantity' IS NULL 
    OR (input_data->>'quantity')::int > 0
);

-- 4. Adicionar restrição (constraint) na tabela de transações para garantir que compras nunca adicionem saldo (valor deve ser <= 0)
ALTER TABLE public.transactions 
ADD CONSTRAINT chk_purchase_amount 
CHECK (
    type != 'purchase' 
    OR amount <= 0
);
