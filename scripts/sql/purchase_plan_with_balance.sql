-- Script para criar a função de compra de plano automática com saldo
-- Copie e cole este código no SQL Editor do seu dashboard Supabase e execute.

CREATE OR REPLACE FUNCTION public.purchase_plan_with_balance(
    p_user_id UUID,
    p_plan_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_current_plan TEXT;
    v_current_exp TIMESTAMPTZ;
    v_cost NUMERIC;
    v_user_email TEXT;
BEGIN
    -- 1. Obter informações do perfil do usuário
    SELECT balance, plan, plan_expiration_date, email
    INTO v_balance, v_current_plan, v_current_exp, v_user_email
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
    END IF;

    -- 2. Validar plano selecionado
    IF p_plan_name NOT IN ('basico', 'premium') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plano inválido.');
    END IF;

    -- 3. Calcular o custo do plano
    IF p_plan_name = 'premium' AND v_current_plan = 'basico' AND (v_current_exp IS NULL OR v_current_exp > now()) THEN
        -- Upgrade de básico para premium cobra apenas a diferença
        v_cost := 70.00;
    ELSIF p_plan_name = 'basico' THEN
        v_cost := 129.99;
    ELSIF p_plan_name = 'premium' THEN
        v_cost := 199.99;
    END IF;

    -- 4. Verificar se o plano já está ativo e não expirado (evitar compra redundante)
    IF v_current_plan = p_plan_name AND (v_current_exp IS NULL OR v_current_exp > now()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você já possui este plano ativo.');
    END IF;

    -- 5. Verificar se possui saldo suficiente
    IF v_balance < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente. Adicione mais créditos para assinar este plano.');
    END IF;

    -- 6. Deduzir o saldo do perfil e atualizar o plano e validade
    UPDATE public.profiles
    SET 
        balance = balance - v_cost,
        plan = p_plan_name,
        plan_expiration_date = now() + INTERVAL '30 days',
        updated_at = now()
    WHERE id = p_user_id;

    -- 7. Registrar a transação financeira
    INSERT INTO public.transactions (
        user_id,
        amount,
        type,
        description,
        status,
        created_at
    ) VALUES (
        p_user_id,
        -v_cost,
        'purchase',
        'Assinatura do Plano ' || UPPER(p_plan_name) || ' (Automática com Saldo)',
        'success',
        now()
    );

    -- 8. Registrar a solicitação de plano como aprovada automaticamente
    INSERT INTO public.plan_purchase_requests (
        user_id,
        user_email,
        plan_name,
        cost,
        status,
        created_at,
        approved_at,
        expiration_date
    ) VALUES (
        p_user_id,
        v_user_email,
        p_plan_name,
        v_cost,
        'approved',
        now(),
        now(),
        now() + INTERVAL '30 days'
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Plano assinado com sucesso!', 
        'new_plan', p_plan_name, 
        'new_balance', v_balance - v_cost
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
