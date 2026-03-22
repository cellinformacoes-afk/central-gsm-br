const { execSync } = require('child_process');
try {
    const content = execSync('git show 56c9465:components/layout/ClientLayout.tsx', { encoding: 'utf8' });
    const lines = content.split('\n');
    console.log('---START 100-150---');
    console.log(lines.slice(99, 150).join('\n'));
    console.log('---END---');
} catch (e) {
    console.error(e);
}
