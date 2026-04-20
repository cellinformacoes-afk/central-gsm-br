const fs = require('fs');
const content = fs.readFileSync('c:/Users/Usuario/Documents/sistema aluguel/lib/mock-methods.ts', 'utf8');

// Use a more robust way to extract the array
const start = content.indexOf('mockMethods: DeviceMethod[] = [');
const end = content.lastIndexOf('];');

if (start !== -1 && end !== -1) {
    let arrayContent = content.substring(start + 'mockMethods: DeviceMethod[] = '.length, end + 1);
    // Rough cleanup to make it JSON-like (though it's TS code)
    // For a real migration, we can just eval it since we trust it, or better, use it as a JS module
    fs.writeFileSync('scripts/migrate_data.js', 'const data = ' + arrayContent + '; module.exports = data;');
    console.log('Dados extraídos para scripts/migrate_data.js');
} else {
    console.error('Não foi possível encontrar o array mockMethods.');
}
