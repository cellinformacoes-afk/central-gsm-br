-- DESATIVAR CRON DE 1 MINUTO (causa de CPU 100%)
-- O Vercel Cron (vercel.json) já executa /api/cron/check-expiration 1x/dia às 00:00
-- Rodar UMA VEZ para parar o loop de 1440 chamadas/dia que queimava a CPU.
SELECT cron.unschedule('check_expirations_every_minute');

-- Confirmar que foi removido
SELECT jobid, schedule, jobname FROM cron.job WHERE jobname = 'check_expirations_every_minute';