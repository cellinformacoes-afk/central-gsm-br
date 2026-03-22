const { execSync } = require('child_process');
try {
    const content = execSync('git show d25685d:components/layout/ClientLayout.tsx', { encoding: 'utf8' });
    const lines = content.split('\n');
    console.log('---START 180-220---');
    console.log(lines.slice(179, 220).join('\n'));
    console.log('---END---');
} catch (e) {
    console.error(e);
}
