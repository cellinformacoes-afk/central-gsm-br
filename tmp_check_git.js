const { execSync } = require('child_process');
try {
  const status = execSync('git status', { encoding: 'utf8' });
  console.log(status);
} catch (e) {
  console.log(e.stdout || e.message);
}
