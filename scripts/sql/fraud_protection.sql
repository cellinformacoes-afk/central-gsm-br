-- 1. Create fraud_logs table
CREATE TABLE IF NOT EXISTS public.fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    amount DECIMAL(12,2) NOT NULL,
    payment_id TEXT,
    event_type TEXT NOT NULL, -- 'CHARGEBACK' or 'REFUND'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (though we use service_role)
ALTER TABLE public.fraud_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create handle_payment_fraud RPC
CREATE OR REPLACE FUNCTION public.handle_payment_fraud(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_id TEXT,
    p_event_type TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Get user email BEFORE potentially deleting or for logging
    SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;

    -- 1. Log the fraud event
    INSERT INTO public.fraud_logs (user_id, user_email, amount, payment_id, event_type, details)
    VALUES (p_user_id, v_user_email, p_amount, p_payment_id, p_event_type, p_details);

    -- 2. Deduct balance (allowing negative)
    UPDATE public.profiles
    SET balance = balance - p_amount
    WHERE id = p_user_id;

    -- Return success
    RETURN json_build_object(
        'success', true,
        'email', v_user_email,
        'deducted', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
