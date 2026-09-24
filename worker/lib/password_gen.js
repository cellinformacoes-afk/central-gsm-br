/**
 * Gera uma senha segura de 12 caracteres
 * Letras maiúsculas + minúsculas + números
 */
function gerarSenha() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let senha = '';
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

module.exports = { gerarSenha };
