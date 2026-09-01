import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Mostra os primeiros e últimos 4 caracteres de cada variável (sem expor tudo)
  const mask = (val: string | undefined) => {
    if (!val) return '❌ NÃO ENCONTRADA';
    if (val.length <= 8) return '✅ EXISTE (muito curta: ' + val.length + ' chars)';
    return `✅ EXISTE (${val.length} chars): ${val.substring(0, 10)}...${val.slice(-4)}`;
  };

  return NextResponse.json({
    EFI_CLIENT_ID: mask(process.env.EFI_CLIENT_ID),
    EFI_CLIENT_SECRET: mask(process.env.EFI_CLIENT_SECRET),
    EFI_PIX_KEY: mask(process.env.EFI_PIX_KEY),
    EFI_CERT_BASE64: mask(process.env.EFI_CERT_BASE64),
    EFI_PIX_CERT_PASSWORD: mask(process.env.EFI_PIX_CERT_PASSWORD),
  });
}
