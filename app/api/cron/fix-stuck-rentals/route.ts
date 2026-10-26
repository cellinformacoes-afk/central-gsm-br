import { NextResponse } from 'next/server';
import { syncStuckRentals } from '@/lib/syncRentals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint: GET /api/cron/fix-stuck-rentals
 * Detecta contas rented cujo aluguel já expirou e move para pending_reset.
 * Desativa também os aluguéis vencidos na tabela rentals.
 */
export async function GET() {
  const result = await syncStuckRentals();

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    fixed: result.fixedAccounts,
    deactivatedRentals: result.deactivatedRentals,
    accounts: result.fixedAccountIds,
    timestamp: new Date().toISOString()
  });
}
