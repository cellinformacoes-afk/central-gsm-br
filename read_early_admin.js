const { execSync } = require('child_process');
try {
    const content = execSync('git show d25685d:components/layout/ClientLayout.tsx', { encoding: 'utf8' });
    const lines = content.split('\n');
    console.log('---START 100-150---');
    console.log(lines.slice(99, 150).join('\n'));
    console.log('---END---');
} catch (e) {
    console.error(e);
}
