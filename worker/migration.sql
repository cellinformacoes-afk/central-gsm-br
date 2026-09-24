-- ═══════════════════════════════════════════════════════
--  CENTRAL GSM — Migração para automação de renovação
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════

-- 1. Adicionar colunas de controle na automation_tasks
ALTER TABLE automation_tasks
  ADD COLUMN IF NOT EXISTS attempts      INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Adicionar controle de renovação na service_accounts
ALTER TABLE service_accounts
  ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew      BOOLEAN DEFAULT true;

-- 3. Índice para busca rápida de tarefas pendentes
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status_retry 
  ON automation_tasks(status, next_retry_at, created_at);

-- 4. Verifica o resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'automation_tasks'
ORDER BY ordinal_position;
