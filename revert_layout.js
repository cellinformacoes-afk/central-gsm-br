const fs = require('fs');
const path = require('path');

const layoutPath = 'c:\\Users\\Usuario\\Documents\\sistema aluguel\\components\\layout\\ClientLayout.tsx';
const servicesPath = 'c:\\Users\\Usuario\\Documents\\sistema aluguel\\app\\admin\\servicos\\page.tsx';

// Revert ClientLayout.tsx
let layout = fs.readFileSync(layoutPath, 'utf8');

// Header cleanup (Logo, Extrato, Pulse) - In case they weren't reverted yet
layout = layout.replace('JACKSON & ISRAEL [V2]', 'JACKSON & ISRAEL');
layout = layout.replace('!!! VER EXTRATO !!!', 'Ver extrato');
layout = layout.replace('animate-pulse', '');

// Restore desktop admin link (single button)
if (!layout.includes('ADMIN')) {
    const desktopAdmin = `                 {profile?.role === 'admin' && (
                   <Link href="/admin/estoque" className="flex items-center gap-2 text-sm font-black text-[#FFC107] hover:text-white transition-all bg-[#FFC107]/10 px-3 py-1.5 rounded-lg border border-[#FFC107]/20 uppercase">
                     ADMIN
                     {pendingResets > 0 && (
                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white animate-bounce">
                         {pendingResets}
                       </span>
                     )}
                   </Link>
                 )}`;
    layout = layout.replace('<Link href="/suporte" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Suporte</Link>', '<Link href="/suporte" className="text-sm font-medium text-gray-300 hover:text-[#00D2AD] transition-colors">Suporte</Link>\n' + desktopAdmin);
}

// Restore mobile admin link (Painel Admin)
if (!layout.includes('Painel Admin')) {
    const mobileAdmin = `                  {profile?.role === 'admin' && (
                    <Link href="/admin/estoque" onClick={() => setIsMenuOpen(false)} className="text-base font-black text-[#FFC107] flex items-center justify-between p-2 rounded-lg hover:bg-[#0f172a] border border-[#FFC107]/20 uppercase">
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Painel Admin
                      </div>
                      {pendingResets > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] text-white">
                          {pendingResets}
                        </span>
                      )}
                    </Link>
                  )}`;
    layout = layout.replace('<Link href="/suporte" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">', '<Link href="/suporte" onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-gray-300 flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a]">\n' + mobileAdmin);
}

fs.writeFileSync(layoutPath, layout);

// Revert Admin Services page
if (fs.existsSync(servicesPath)) {
    let services = fs.readFileSync(servicesPath, 'utf8');
    services = services.replace('Duração do Aluguel (Horas) - [ATUALIZADO]', 'Duração do Aluguel (Horas)');
    fs.writeFileSync(servicesPath, services);
}

console.log('Layout reverted and ADMIN button restored successfully');
