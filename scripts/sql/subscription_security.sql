-- 1. Add expiration date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expiration_date TIMESTAMPTZ;

-- 2. Create Plan Purchase Requests table
CREATE TABLE IF NOT EXISTS public.plan_purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    plan_name TEXT NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.plan_purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own requests
CREATE POLICY "Users can view own plan requests" ON public.plan_purchase_requests
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Create RPC to REQUEST a plan
CREATE OR REPLACE FUNCTION public.create_plan_purchase_request(
    p_plan_name TEXT,
    p_cost DECIMAL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_balance DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    -- Get user data
    SELECT email, balance INTO v_user_email, v_balance 
    FROM public.profiles 
    WHERE id = v_user_id;

    -- Check balance
    IF v_balance < p_cost THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente para solicitar este plano.');
    END IF;

    -- Create request
    INSERT INTO public.plan_purchase_requests (user_id, user_email, plan_name, cost, status)
    VALUES (v_user_id, v_user_email, p_plan_name, p_cost, 'pending');

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC to APPROVE a plan (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.approve_plan_purchase_request(
    p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_plan_name TEXT;
    v_cost DECIMAL;
    v_balance DECIMAL;
    v_expiration TIMESTAMPTZ;
BEGIN
    -- 1. Get request details
    SELECT user_id, plan_name, cost INTO v_user_id, v_plan_name, v_cost
    FROM public.plan_purchase_requests
    WHERE id = p_request_id AND status = 'pending'
    FOR UPDATE; -- Lock the row

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou já processado.');
    END IF;

    -- 2. Check user balance again (race condition safety)
    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    
    IF v_balance < v_cost THEN
        UPDATE public.plan_purchase_requests 
        SET status = 'rejected', approved_at = now() 
        WHERE id = p_request_id;
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente no momento da aprovação.');
    END IF;

    -- 3. Deduct balance
    UPDATE public.profiles 
    SET balance = balance - v_cost,
        plan = v_plan_name,
        plan_expiration_date = now() + interval '30 days'
    WHERE id = v_user_id;

    -- 4. Update request status
    v_expiration := now() + interval '30 days';
    UPDATE public.plan_purchase_requests
    SET status = 'approved',
        approved_at = now(),
        expiration_date = v_expiration
    WHERE id = p_request_id;

    -- 5. Log transaction
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (v_user_id, v_cost, 'subscription', 'Assinatura do Plano ' || v_plan_name, 'success');

    RETURN json_build_object('success', true, 'expiration', v_expiration);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
