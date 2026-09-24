function log(nivel, mensagem, extra = '') {
  const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icons = { INFO: '📋', OK: '✅', ERRO: '❌', AVISO: '⚠️', ROBO: '🤖' };
  const icon = icons[nivel] || '•';
  console.log(`[${hora}] ${icon} [${nivel}] ${mensagem}${extra ? ' | ' + extra : ''}`);
}

module.exports = { log };
