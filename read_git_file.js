const { execSync } = require('child_process');
try {
    const content = execSync('git show 18a2a09:components/layout/ClientLayout.tsx', { encoding: 'utf8' });
    console.log('---START---');
    console.log(content);
    console.log('---END---');
} catch (e) {
    console.error(e);
}
