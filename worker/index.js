/**
 * =========================================================
 *  CENTRAL GSM — WORKER DE RENOVAÇÃO AUTOMÁTICA DE CONTAS
 *  Roda 24h na nuvem (Railway). Não depende do seu PC.
 * =========================================================
 *
 * Fluxo a cada 5 minutos:
 *  1. Busca tarefas pendentes em automation_tasks
 *  2. Identifica a ferramenta (Unlock Tool, TSM, etc.)
 *  3. Executa o adaptador correspondente
 *  4. Sucesso → atualiza service_accounts + marca task como done
 *  5. Falha → agenda retry (até 4 tentativas)
 *  6. Após 4 falhas ou CAPTCHA → alerta WhatsApp
 */

require('dotenv').config();

const supabase      = require('./lib/supabase');
const { log }       = require('./lib/logger');
const { gerarSenha }= require('./lib/password_gen');
const { alertarAdmin } = require('./lib/whatsapp');

// Adaptadores por ferramenta
const unlockTool    = require('./adapters/unlock_tool');

// ── Configurações ─────────────────────────────────────────
const INTERVALO_MS  = 5 * 60 * 1000;  // 5 minutos
const MAX_TENTATIVAS = 4;

// Mapa de palavras-chave → adaptador
const ADAPTADORES = {
  'unlock tool':  unlockTool,
  'unlocktool':   unlockTool,
  'unlock':       unlockTool,
  // Futuras ferramentas serão adicionadas aqui:
  // 'tsm tool': tsmTool,
  // 'android multi tool': amtTool,
};

// ── Funções auxiliares ────────────────────────────────────

function identificarAdaptador(serviceTitle = '') {
  const titulo = serviceTitle.toLowerCase();
  for (const [chave, adaptador] of Object.entries(ADAPTADORES)) {
    if (titulo.includes(chave)) return adaptador;
  }
  return null;
}

async function marcarRodando(taskId) {
  await supabase
    .from('automation_tasks')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', taskId);
}

async function marcarSucesso(taskId) {
  await supabase
    .from('automation_tasks')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('id', taskId);
}

async function marcarFalha(task, motivo, intervencao = false) {
  const tentativas = (task.attempts || 0) + 1;
  const novoStatus = (tentativas >= MAX_TENTATIVAS || intervencao)
    ? 'intervention_needed'
    : 'pending';

  // Agendamento de retry progressivo
  let proximaTentativa = null;
  if (novoStatus === 'pending') {
    const delays = [5, 15, 60]; // minutos
    const delayMin = delays[tentativas - 1] || 60;
    proximaTentativa = new Date(Date.now() + delayMin * 60 * 1000).toISOString();
    log('AVISO', `Task ${task.id} → retry em ${delayMin}min (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
  }

  await supabase
    .from('automation_tasks')
    .update({
      status: novoStatus,
      error_message: motivo,
      attempts: tentativas,
      next_retry_at: proximaTentativa,
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id);

  if (novoStatus === 'intervention_needed') {
    log('AVISO', `⚠️ INTERVENÇÃO NECESSÁRIA: ${task.service_title} — ${motivo}`);
    await alertarAdmin(
      `⚠️ *Central GSM — Worker*\n\n` +
      `Preciso de ajuda! Não consegui renovar automaticamente:\n\n` +
      `🔧 *Ferramenta:* ${task.service_title}\n` +
      `📧 *Conta:* ${task.payload?.email || 'N/A'}\n` +
      `❌ *Motivo:* ${motivo}\n` +
      `🔁 *Tentativas:* ${tentativas}/${MAX_TENTATIVAS}\n\n` +
      `Por favor, troque a senha manualmente e marque como resolvido no painel.`
    );
  }
}

async function atualizarContaNoSupabase(accountId, senhaNova, emailConta) {
  const { error } = await supabase
    .from('service_accounts')
    .update({
      status: 'available',
      credentials: { email: emailConta, password: senhaNova },
      last_assigned_at: new Date().toISOString()
    })
    .eq('id', accountId);

  return !error;
}


// ── Loop principal ────────────────────────────────────────

async function processarTarefas() {
  log('INFO', '🔍 Verificando fila de tarefas pendentes...');

  const agora = new Date().toISOString();

  // Busca tarefas pendentes (respeita next_retry_at)
  const { data: tarefas, error } = await supabase
    .from('automation_tasks')
    .select('*')
    .eq('type', 'password_reset')
    .or(`status.eq.pending,status.eq.running`)
    .or(`next_retry_at.is.null,next_retry_at.lte.${agora}`)
    .order('created_at', { ascending: true })
    .limit(3);

  if (error) {
    log('ERRO', 'Erro ao buscar tarefas:', error.message);
    return;
  }

  if (!tarefas || tarefas.length === 0) {
    log('INFO', 'Nenhuma tarefa pendente. Dormindo até próximo ciclo...');
    return;
  }

  log('INFO', `🚨 ${tarefas.length} tarefa(s) encontrada(s)!`);

  for (const task of tarefas) {
    log('ROBO', `Processando: ${task.service_title} | Conta: ${task.payload?.email}`);

    // Identifica o adaptador correto
    const adaptador = identificarAdaptador(task.service_title);
    if (!adaptador) {
      log('AVISO', `Ferramenta "${task.service_title}" ainda não tem adaptador. Pulando...`);
      await marcarFalha(task, `Adaptador não implementado para: ${task.service_title}`, true);
      continue;
    }

    await marcarRodando(task.id);

    // ⚠️ SEGURANÇA: Verifica se a conta está pending_reset antes de mexer
    if (task.account_id) {
      const { data: conta } = await supabase
        .from('service_accounts')
        .select('status')
        .eq('id', task.account_id)
        .single();

      if (!conta || conta.status === 'rented') {
        const motivo = !conta ? 'Conta não encontrada' : 'Conta ainda ALUGADA para cliente';
        log('AVISO', `⛔ ${motivo} — ${task.payload?.email}. Pulando sem resetar!`);
        await supabase.from('automation_tasks')
          .update({ status: 'skipped', error_message: motivo, updated_at: new Date().toISOString() })
          .eq('id', task.id);
        continue;
      }

      if (conta.status !== 'pending_reset') {
        log('AVISO', `Conta ${task.payload?.email} status="${conta.status}" — não precisa reset. Pulando...`);
        await supabase.from('automation_tasks')
          .update({ status: 'skipped', error_message: `Status: ${conta.status}`, updated_at: new Date().toISOString() })
          .eq('id', task.id);
        continue;
      }
    }

    const senhaNova = task.payload?.new_password || gerarSenha();
    const emailConta = task.payload?.email;
    const senhaAntiga = task.payload?.old_password;

    // Executa a troca de senha no site da ferramenta
    const resultado = await adaptador.resetarSenha({
      username: emailConta,
      senhaAntiga: senhaAntiga,
      senhaNova: senhaNova
    });

    if (resultado.ok) {
      // Sucesso: atualiza a conta no Supabase
      const atualizado = await atualizarContaNoSupabase(task.account_id, senhaNova, emailConta);

      if (atualizado) {
        await marcarSucesso(task.id);
        log('OK', `✅ Conta renovada com sucesso: ${emailConta} | Ferramenta: ${task.service_title}`);
      } else {
        await marcarFalha(task, 'Senha trocada no site mas falhou ao salvar no Supabase', false);
        log('ERRO', `Falha ao atualizar Supabase para ${emailConta}`);
      }
    } else {
      await marcarFalha(task, resultado.motivo, resultado.intervencao);
      log('ERRO', `Falha na renovação: ${resultado.motivo}`);
    }

    // Pequena pausa entre tarefas para não sobrecarregar
    await new Promise(r => setTimeout(r, 3000));
  }
}

// ── Inicialização ─────────────────────────────────────────

async function iniciar() {
  log('INFO', '═══════════════════════════════════════════════════════');
  log('INFO', '🤖 CENTRAL GSM — WORKER DE RENOVAÇÃO INICIADO');
  log('INFO', '🌐 Rodando na nuvem — sem depender do seu PC!');
  log('INFO', `⏱️  Verificando fila a cada ${INTERVALO_MS / 60000} minutos`);
  log('INFO', '═══════════════════════════════════════════════════════');

  // Roda imediatamente ao iniciar
  await processarTarefas();

  // Depois fica em loop
  setInterval(processarTarefas, INTERVALO_MS);
}

iniciar().catch(err => {
  log('ERRO', 'Falha crítica ao iniciar Worker:', err.message);
  process.exit(1);
});
