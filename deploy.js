const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('1. Lendo os arquivos locais atualizados...');
  const frpPath = path.join(__dirname, 'app/planos/dashboard/frp/page.tsx');
  const mdmPath = path.join(__dirname, 'app/planos/dashboard/mdm/page.tsx');
  
  const frpContent = fs.readFileSync(frpPath, 'utf8');
  const mdmContent = fs.readFileSync(mdmPath, 'utf8');
  
  console.log('2. Limpando conflitos anteriores...');
  try { execSync('git rebase --abort', { stdio: 'inherit' }); } catch(e) {}
  
  console.log('3. Removendo arquivos temporarios conflitantes...');
  const tsconfigBuildInfo = path.join(__dirname, 'tsconfig.tsbuildinfo');
  if (fs.existsSync(tsconfigBuildInfo)) {
    fs.unlinkSync(tsconfigBuildInfo);
  }
  const ajustarPath = path.join(__dirname, 'AJUSTAR.bat');
  if (fs.existsSync(ajustarPath)) {
    fs.unlinkSync(ajustarPath);
  }
  
  console.log('4. Guardando alteracoes locais temporariamente (git stash)...');
  try { execSync('git stash', { stdio: 'inherit' }); } catch(e) {}
  
  console.log('5. Alinhando com o servidor (git reset)...');
  execSync('git reset --hard origin/main', { stdio: 'inherit' });
  
  console.log('6. Baixando versao mais recente (git pull)...');
  execSync('git pull origin main', { stdio: 'inherit' });
  
  console.log('7. Restaurando arquivos atualizados das imagens clicaveis...');
  fs.writeFileSync(frpPath, frpContent, 'utf8');
  fs.writeFileSync(mdmPath, mdmContent, 'utf8');
  
  console.log('8. Devolvendo suas alteracoes locais...');
  try { execSync('git stash pop', { stdio: 'inherit' }); } catch(e) {}
  
  console.log('9. Adicionando arquivos para envio...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('10. Salvando atualizacao...');
  try { execSync('git commit -m "feat: Adicionar aba de Download Extra no painel e planos"', { stdio: 'inherit' }); } catch(e) {}
  
  console.log('11. Enviando para o site oficial (git push)...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\n=============================================');
  console.log('SUCESSO! O site foi atualizado com sucesso.');
  console.log('=============================================');
} catch (error) {
  console.error('\nOcorreu um erro durante a atualizacao:', error.message);
}
