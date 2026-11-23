import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const listBanned = searchParams.get('list_banned') === 'true';

    // Se solicitar a lista de todos os bloqueados
    if (listBanned) {
      const { data: blacklist, error: blErr } = await supabaseAdmin
        .from('cpf_blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (blErr) throw blErr;
      return NextResponse.json({ success: true, blacklist: blacklist || [] });
    }

    if (!query) {
      return NextResponse.json({ error: 'Informe um e-mail ou CPF para pesquisar.' }, { status: 400 });
    }

    const cleanCpf = query.replace(/\D/g, '');
    const cleanEmail = query.toLowerCase();

    // 1. Tentar encontrar o perfil
    let profile: any = null;

    // Se tem @, pesquisa por e-mail
    if (query.includes('@')) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, email, cpf, balance, role, created_at')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && data) profile = data;
    } else if (cleanCpf.length >= 8) {
      // Pesquisa por CPF
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, email, cpf, balance, role, created_at')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (!error && data) profile = data;
    }

    // Se não achou ainda, tenta por busca parcial no email ou username
    if (!profile) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, email, cpf, balance, role, created_at')
        .or(`email.ilike.%${query}%,cpf.eq.${cleanCpf || '99999999999'}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) profile = data;
    }

    // Se ainda não achou em profiles, tenta achar no auth.users
    if (!profile && query.includes('@')) {
      const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (!authErr && users) {
        const foundAuth = users.find(u => u.email?.toLowerCase() === cleanEmail);
        if (foundAuth) {
          const { data: pById } = await supabaseAdmin
            .from('profiles')
            .select('id, username, email, cpf, balance, role, created_at')
            .eq('id', foundAuth.id)
            .maybeSingle();

          if (pById) {
            profile = pById;
          } else {
            profile = {
              id: foundAuth.id,
              username: foundAuth.user_metadata?.full_name || 'Usuário Sem Perfil',
              email: foundAuth.email,
              cpf: foundAuth.user_metadata?.cpf || null,
              balance: 0,
              role: 'user',
              created_at: foundAuth.created_at,
            };
          }
        }
      }
    }

    // 2. Verificar se está na Blacklist (por CPF ou E-mail)
    const checks: string[] = [];
    if (cleanCpf) checks.push(cleanCpf);
    if (cleanEmail) checks.push(cleanEmail);
    if (profile?.cpf) checks.push(String(profile.cpf).replace(/\D/g, ''));
    if (profile?.email) checks.push(String(profile.email).toLowerCase().trim());

    const uniqueChecks = Array.from(new Set(checks.filter(Boolean)));

    let blacklistEntries: any[] = [];
    if (uniqueChecks.length > 0) {
      const { data: blData } = await supabaseAdmin
        .from('cpf_blacklist')
        .select('*')
        .in('cpf', uniqueChecks);

      blacklistEntries = blData || [];
    }

    const isBanned = blacklistEntries.length > 0 || profile?.role === 'banned';

    // 3. Buscar pedidos recentes se tiver profile
    let recentOrders: any[] = [];
    if (profile?.id) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, service_title, total_price, status, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      recentOrders = orders || [];
    }

    return NextResponse.json({
      success: true,
      found: !!profile,
      user: profile,
      isBanned,
      blacklistEntries,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Erro na busca de anti-fraude:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar consulta' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, email, cpf, reason, amount } = body;

    const cleanCpf = cpf ? String(cpf).replace(/\D/g, '') : '';
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const banReason = reason?.trim() || 'Bloqueio manual via Painel ADM (Contestação/Fraude)';

    // ==========================================
    // AÇÃO 1: BANIR E BLOQUEAR TOTALMENTE
    // ==========================================
    if (action === 'ban') {
      let previousBalance = 0;

      // 1. Zerar saldo e mudar role para banned
      if (userId) {
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .maybeSingle();

        previousBalance = currentProfile?.balance || 0;

        await supabaseAdmin
          .from('profiles')
          .update({
            balance: 0,
            role: 'banned',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Registrar no log de fraudes
        await supabaseAdmin.from('fraud_logs').insert({
          user_id: userId,
          user_email: cleanEmail || 'sem-email',
          user_cpf: cleanCpf || null,
          amount: previousBalance,
          payment_id: `MANUAL_BAN_${Date.now()}`,
          event_type: 'MANUAL_BAN',
          details: {
            reason: banReason,
            deducted_balance: previousBalance,
            banned_at: new Date().toISOString()
          }
        });
      }

      // 2. Inserir CPF na Blacklist
      if (cleanCpf && cleanCpf.length >= 8) {
        await supabaseAdmin.from('cpf_blacklist').upsert({
          cpf: cleanCpf,
          reason: banReason
        }, { onConflict: 'cpf' });
      }

      // 3. Inserir E-mail na Blacklist
      if (cleanEmail && cleanEmail.includes('@')) {
        await supabaseAdmin.from('cpf_blacklist').upsert({
          cpf: cleanEmail,
          reason: banReason
        }, { onConflict: 'cpf' });
      }

      // 4. Deletar do auth.users para deslogar imediatamente de todas as sessões
      if (userId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (delErr) {
          console.warn('Erro ao deletar auth user (pode já estar deletado):', delErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Usuário bloqueado com sucesso! Saldo anterior (R$ ${previousBalance.toFixed(2)}) foi zerado, e o CPF e E-mail foram colocados na Blacklist permanentemente.`
      });
    }

    // ==========================================
    // AÇÃO 2: DESBLOQUEAR USUÁRIO
    // ==========================================
    if (action === 'unban') {
      if (cleanCpf) {
        await supabaseAdmin.from('cpf_blacklist').delete().eq('cpf', cleanCpf);
      }
      if (cleanEmail) {
        await supabaseAdmin.from('cpf_blacklist').delete().eq('cpf', cleanEmail);
      }
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'user', updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      return NextResponse.json({
        success: true,
        message: 'Bloqueio removido com sucesso do CPF e E-mail.'
      });
    }

    // ==========================================
    // AÇÃO 3: ZERAR OU REMOVER SALDO ESPECÍFICO
    // ==========================================
    if (action === 'clear_balance' || action === 'remove_balance') {
      if (!userId) {
        return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
      }

      const { data: currentProfile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (pErr || !currentProfile) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      const currentBalance = currentProfile.balance || 0;
      let newBalance = 0;
      let deductedAmount = currentBalance;

      if (action === 'remove_balance') {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
          return NextResponse.json({ error: 'Valor a remover inválido.' }, { status: 400 });
        }
        deductedAmount = val;
        newBalance = Math.max(0, currentBalance - val);
      }

      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);

      // Registrar transação de ajuste manual
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: -deductedAmount,
        type: 'refund',
        status: 'manual_deduction',
        description: `Remoção de saldo administrativa (Motivo: ${banReason})`,
        external_id: `DEDUCT_${Date.now()}`
      });

      return NextResponse.json({
        success: true,
        message: `Saldo atualizado com sucesso! Foi removido R$ ${deductedAmount.toFixed(2)}. Novo saldo do cliente: R$ ${newBalance.toFixed(2)}.`
      });
    }

    // ==========================================
    // AÇÃO 4: ADICIONAR DIRETO NA BLACKLIST (CPF OU EMAIL AVULSO)
    // ==========================================
    if (action === 'add_blacklist_direct') {
      const target = body.target?.trim();
      if (!target) {
        return NextResponse.json({ error: 'Informe o CPF ou E-mail para bloquear.' }, { status: 400 });
      }

      const valueToBlock = target.includes('@') ? target.toLowerCase() : target.replace(/\D/g, '');

      await supabaseAdmin.from('cpf_blacklist').upsert({
        cpf: valueToBlock,
        reason: banReason
      }, { onConflict: 'cpf' });

      return NextResponse.json({
        success: true,
        message: `${target} foi adicionado à Blacklist com sucesso.`
      });
    }

    // ==========================================
    // AÇÃO 5: REMOVER ITEM DA BLACKLIST PELO ID
    // ==========================================
    if (action === 'remove_blacklist_item') {
      const itemId = body.id;
      if (!itemId) {
        return NextResponse.json({ error: 'ID do registro não informado.' }, { status: 400 });
      }

      await supabaseAdmin.from('cpf_blacklist').delete().eq('id', itemId);

      return NextResponse.json({
        success: true,
        message: 'Item removido da Blacklist com sucesso.'
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na rota de ação anti-fraude:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar ação' }, { status: 500 });
  }
}
