-- 1. Create fraud_logs table
CREATE TABLE IF NOT EXISTS public.fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_cpf TEXT, -- ADDED THIS COLUMN
    amount DECIMAL(12,2) NOT NULL,
    payment_id TEXT,
    event_type TEXT NOT NULL, -- 'CHARGEBACK' or 'REFUND'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure column exists if table was already created
ALTER TABLE public.fraud_logs ADD COLUMN IF NOT EXISTS user_cpf TEXT;

-- 2. Create handle_payment_fraud RPC
CREATE OR REPLACE FUNCTION public.handle_payment_fraud(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_id TEXT,
    p_event_type TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
BEGIN
    INSERT INTO public.fraud_logs (user_id, user_email, user_cpf, amount, payment_id, event_type, details)
    VALUES (
        p_user_id, 
        (SELECT email FROM public.profiles WHERE id = p_user_id), 
        (SELECT cpf FROM public.profiles WHERE id = p_user_id), 
        p_amount, 
        p_payment_id, 
        p_event_type, 
        p_details
    );

    UPDATE public.profiles
    SET balance = balance - p_amount
    WHERE id = p_user_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill old entries with CPF
UPDATE public.fraud_logs SET user_cpf = '47612503808' WHERE user_email = 'gaga011@gmail.com';
UPDATE public.fraud_logs SET user_cpf = '60458740306' WHERE user_email = 'ericansdiogo@gmail.com';
