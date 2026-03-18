import './globals.css';
import { Metadata } from 'next';
import ClientLayout from '@/components/layout/ClientLayout';

export const metadata: Metadata = {
  title: 'JACKSON & ISRAEL GSM | Aluguel de Box Digital e Ferramentas Unlock',
  description: 'A melhor plataforma de aluguel de ferramentas GSM, UnlockTool, Chimera, Licenças e Créditos. Desbloqueio de IMEI e ativações rápidas e seguras.',
  keywords: ['GSM', 'UnlockTool', 'Chimera Tool', 'Aluguel de Box', 'Desbloqueio IMEI', 'Créditos GSM', 'Licenças de Software', 'Central GSM'],
  authors: [{ name: 'Jackson & Israel GSM' }],
  robots: 'index, follow',
  openGraph: {
    title: 'JACKSON & ISRAEL GSM | Aluguel de Ferramentas e Desbloqueio',
    description: 'Sua solução completa para desbloqueio e aluguel de ferramentas GSM online.',
    url: 'https://central-gsm.vercel.app', // Substitua pela URL final se souber
    siteName: 'Jackson & Israel GSM',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JACKSON & ISRAEL GSM | Aluguel de Ferramentas GSM',
    description: 'Aluguel de UnlockTool, Chimera e muito mais.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <ClientLayout>
        {children}
      </ClientLayout>
    </html>
  );
}
