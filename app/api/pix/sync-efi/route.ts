import { NextResponse } from 'next/server';
import { syncEfiPendingPayments } from '@/lib/syncEfiPending';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[SYNC-EFI] Iniciando verificação de PIX Efí pagos mas ainda pending...');
    const result = await syncEfiPendingPayments();
    console.log(`[SYNC-EFI] Verificadas ${result.checked}, creditadas ${result.credited}.`);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[SYNC-EFI] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}