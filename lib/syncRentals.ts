import { supabaseAdmin } from './supabase-admin';

export interface SyncRentalsResult {
  success: boolean;
  deactivatedRentals: number;
  fixedAccounts: number;
  fixedAccountIds: string[];
  error?: string;
}

/**
 * Sincroniza aluguéis expirados e contas presas.
 * 1. Marca aluguéis com expires_at < agora como is_active = false.
 * 2. Identifica contas com status='rented' que não têm nenhum aluguel ativo válido.
 * 3. Move essas contas presas para 'pending_reset' (liberando para reset pelo robô ou admin).
 */
export async function syncStuckRentals(): Promise<SyncRentalsResult> {
  try {
    const now = new Date().toISOString();

    // 1. Desativar aluguéis expirados que ainda constam como is_active = true
    const { data: expiredRentals, error: expErr } = await supabaseAdmin
      .from('rentals')
      .update({ is_active: false })
      .lte('expires_at', now)
      .eq('is_active', true)
      .select('id');

    if (expErr) {
      console.error('[SYNC-RENTALS] Erro ao desativar aluguéis expirados:', expErr);
    }
    const deactivatedCount = expiredRentals?.length || 0;

    // 2. Buscar todos os aluguéis que ainda estão realmente ativos e dentro do prazo
    const { data: activeRentals, error: activeErr } = await supabaseAdmin
      .from('rentals')
      .select('credentials, expires_at')
      .eq('is_active', true)
      .gt('expires_at', now);

    if (activeErr) {
      console.error('[SYNC-RENTALS] Erro ao buscar aluguéis ativos:', activeErr);
      throw activeErr;
    }

    const activeEmails = new Set<string>();
    (activeRentals || []).forEach((r: any) => {
      const email = r.credentials?.email?.trim().toLowerCase();
      if (email) activeEmails.add(email);
    });

    // 3. Buscar todas as contas que estão marcadas como 'rented'
    const { data: rentedAccounts, error: rentedErr } = await supabaseAdmin
      .from('service_accounts')
      .select('id, credentials')
      .eq('status', 'rented');

    if (rentedErr) {
      console.error('[SYNC-RENTALS] Erro ao buscar contas rented:', rentedErr);
      throw rentedErr;
    }

    // 4. Identificar contas presas (sem nenhum aluguel ativo correspondente)
    const stuckIds: string[] = [];
    for (const acc of (rentedAccounts as any[]) || []) {
      const email = acc.credentials?.email?.trim().toLowerCase();
      if (!email || !activeEmails.has(email)) {
        stuckIds.push(acc.id);
      }
    }

    // 5. Mover contas presas para 'pending_reset'
    if (stuckIds.length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from('service_accounts')
        .update({ status: 'pending_reset' })
        .in('id', stuckIds);

      if (updateErr) {
        console.error('[SYNC-RENTALS] Erro ao atualizar status das contas:', updateErr);
        throw updateErr;
      }
    }

    console.log(`[SYNC-RENTALS] Sucesso: ${deactivatedCount} alugueis desativados, ${stuckIds.length} contas movidas para pending_reset.`);

    return {
      success: true,
      deactivatedRentals: deactivatedCount,
      fixedAccounts: stuckIds.length,
      fixedAccountIds: stuckIds
    };
  } catch (error: any) {
    console.error('[SYNC-RENTALS ERROR]', error);
    return {
      success: false,
      deactivatedRentals: 0,
      fixedAccounts: 0,
      fixedAccountIds: [],
      error: error.message
    };
  }
}
