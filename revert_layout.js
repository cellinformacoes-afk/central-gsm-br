const fs = require('fs');
const path = require('path');

const layoutPath = 'c:\\Users\\Usuario\\Documents\\sistema aluguel\\components\\layout\\ClientLayout.tsx';
const servicesPath = 'c:\\Users\\Usuario\\Documents\\sistema aluguel\\app\\admin\\servicos\\page.tsx';

// Revert ClientLayout.tsx
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace('JACKSON & ISRAEL [V2]', 'JACKSON & ISRAEL');
layout = layout.replace('!!! VER EXTRATO !!!', 'Ver extrato');
layout = layout.replace('animate-pulse', '');
// Remove administrative sections in desktop header
layout = layout.replace(/\{profile\?\.role === 'admin' && \([\s\S]*?<div className="flex items-center gap-2">[\s\S]*?<\/div>\s*?\)\}/, '');
// Remove administrative sections in mobile header
layout = layout.replace(/\{profile\?\.role === 'admin' && \([\s\S]*?<div className="flex flex-col gap-2">[\s\S]*?<\/div>\s*?\)\}/, '');

fs.writeFileSync(layoutPath, layout);

// Revert Admin Services page
let services = fs.readFileSync(servicesPath, 'utf8');
services = services.replace('Duração do Aluguel (Horas) - [ATUALIZADO]', 'Duração do Aluguel (Horas)');
fs.writeFileSync(servicesPath, services);

console.log('Layout reverted successfully');
