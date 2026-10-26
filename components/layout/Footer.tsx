import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020617] border-t border-[#334155]/60 text-gray-400 text-xs mt-20 relative overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-[#00D2AD]/5 blur-[90px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          
          {/* Coluna 1: Sobre & Marca */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black text-white italic tracking-tighter uppercase">
                CENTRAL <span className="text-[#00D2AD]">GSM</span>
              </span>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed">
              Plataforma líder em aluguel de licenças digitais, box virtuais e créditos para assistência técnica e reparação de celulares no Brasil.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#00D2AD] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00D2AD] animate-pulse"></span>
              Servidores Operacionais 24/7
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-[#00D2AD] transition-colors">Início</Link>
              </li>
              <li>
                <Link href="/planos" className="hover:text-[#00D2AD] transition-colors">Planos & Assinaturas</Link>
              </li>
              <li>
                <Link href="/desbloqueios" className="hover:text-[#00D2AD] transition-colors">Serviços de Desbloqueio</Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-[#00D2AD] transition-colors">Meus Pedidos & Acessos</Link>
              </li>
              <li>
                <Link href="/saldo" className="hover:text-[#00D2AD] transition-colors">Recarregar Saldo</Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Ferramentas Populares (SEO booster) */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Ferramentas Disponíveis</h4>
            <ul className="space-y-2 text-gray-400">
              <li>UnlockTool (Aluguel 6h / 12h / 24h)</li>
              <li>Chimera Tool Pro</li>
              <li>Android Multi Tool (AMT)</li>
              <li>TSM Tool Server</li>
              <li>DFT Tool Pro</li>
              <li>Desbloqueio Xiaomi & FRP Samsung</li>
            </ul>
          </div>

          {/* Coluna 4: Legal & Suporte (Obrigatório Google Ads / LGPD) */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Segurança & Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/politica-de-privacidade" 
                  className="text-gray-300 hover:text-[#00D2AD] font-bold transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#00D2AD]">🛡️</span> Política de Privacidade
                </Link>
              </li>
              <li>
                <Link 
                  href="/termos" 
                  className="text-gray-300 hover:text-[#00D2AD] font-bold transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#FFC107]">⚖️</span> Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/suporte" className="hover:text-[#00D2AD] transition-colors">
                  Central de Ajuda & Suporte
                </Link>
              </li>
              <li>
                <a 
                  href="https://wa.me/5511966959666?text=Ola,%20preciso%20de%20ajuda%20na%20Central%20GSM" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#25D366] hover:underline font-bold"
                >
                  WhatsApp: (11) 96695-9666
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Divisória */}
        <div className="pt-8 border-t border-[#334155]/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © {currentYear} Central GSM. Todos os direitos reservados. Israel & Jackson GSM.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-[#25D366]">🔒</span> Criptografia SSL 256-Bit
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="text-[#00D2AD]">⚡</span> Pix Instantâneo Seguro
            </span>
            <span>•</span>
            <Link href="/politica-de-privacidade" className="hover:text-white underline">
              LGPD
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
