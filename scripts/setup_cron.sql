-- SETUP CRON FOR REAL-TIME EXPIRATION ALERTS
-- 1. Certificar que as extensões estão habilitadas (Já foram feitas via MCP)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Limpar cron jobs antigos se existirem
SELECT cron.unschedule('check_expirations_every_minute');

-- 3. Agendar o novo cron job para rodar a cada 1 minuto
-- O intervalo '1 minute' é o mínimo suportado pelo pg_cron
SELECT cron.schedule(
  'check_expirations_every_minute',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://centralgsm.com.br/api/cron/check-expiration',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- 4. Verificar se o cron job foi criado com sucesso
SELECT jobid, schedule, jobname FROM cron.job WHERE jobname = 'check_expirations_every_minute';
