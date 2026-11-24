import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Lista explícita de RPCs públicas que não requerem autenticação (se houver alguma)
const PUBLIC_RPCS: string[] = [];

// Tabelas que usuários anônimos podem consultar somente leitura
const PUBLIC_READ_TABLES = ['services', 'categories', 'tutorials', 'site_notice', 'extra_downloads'];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let authenticatedUser: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        authenticatedUser = user;
      }
    }

    const body = await request.json();
    const { table, select = '*', filters = [], order, limit, single, rpc, rpcParams } = body;

    // Se for execução de RPC
    if (rpc) {
      if (!PUBLIC_RPCS.includes(rpc)) {
        if (!authenticatedUser) {
          return NextResponse.json({ error: 'Não autorizado: faça login para continuar.' }, { status: 401 });
        }

        // Se a RPC exigir p_user_id, garantir que o usuário autenticado não esteja forjando outro ID nem passando null
        if (rpcParams && 'p_user_id' in rpcParams) {
          if (!rpcParams.p_user_id || rpcParams.p_user_id !== authenticatedUser.id) {
            return NextResponse.json({ error: 'Operação inválida: ID de usuário incorreto.' }, { status: 403 });
          }
        }
      }

      // create_plan_purchase_request usa auth.uid() no banco, que fica NULL com a service role.
      // Por isso a solicitação é criada aqui, usando o usuário autenticado verificado acima.
      if (rpc === 'create_plan_purchase_request') {
        const planName = rpcParams?.p_plan_name;
        const cost = Number(rpcParams?.p_cost);
        if (!['basico', 'premium'].includes(planName) || ![129.99, 199.99, 70].includes(cost)) {
          return NextResponse.json({ error: 'Plano ou valor inválido.' }, { status: 400 });
        }

        const { data: prof, error: profErr } = await supabaseAdmin
          .from('profiles')
          .select('email, balance')
          .eq('id', authenticatedUser.id)
          .single();
        if (profErr) throw profErr;

        if (Number(prof?.balance || 0) < cost) {
          return NextResponse.json({ data: { success: false, error: 'Saldo insuficiente para solicitar este plano. Adicione saldo e tente novamente.' } });
        }

        const { data: pend } = await supabaseAdmin
          .from('plan_purchase_requests')
          .select('id')
          .eq('user_id', authenticatedUser.id)
          .eq('status', 'pending')
          .limit(1);
        if (pend && pend.length > 0) {
          return NextResponse.json({ data: { success: false, error: 'Você já possui uma solicitação pendente. Aguarde a aprovação.' } });
        }

        const { error: insErr } = await supabaseAdmin.from('plan_purchase_requests').insert({
          user_id: authenticatedUser.id,
          user_email: prof?.email || authenticatedUser.email,
          plan_name: planName,
          cost,
          status: 'pending',
        });
        if (insErr) throw insErr;
        return NextResponse.json({ data: { success: true } });
      }

      const { data, error } = await supabaseAdmin.rpc(rpc, rpcParams || {});
      if (error) throw error;
      return NextResponse.json({ data });
    }

    // Se for consulta a tabelas
    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }

    // Se não estiver logado e tentar ler tabela que não seja pública
    if (!authenticatedUser && !PUBLIC_READ_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Não autorizado para acessar esta tabela.' }, { status: 401 });
    }

    let query = supabaseAdmin.from(table).select(select);

    for (const f of filters) {
      if (f.op === 'eq') query = query.eq(f.column, f.value);
      else if (f.op === 'neq') query = query.neq(f.column, f.value);
      else if (f.op === 'in') query = query.in(f.column, f.value);
      else if (f.op === 'lte') query = query.lte(f.column, f.value);
      else if (f.op === 'gte') query = query.gte(f.column, f.value);
      else if (f.op === 'like') query = query.like(f.column, f.value);
      else if (f.op === 'ilike') query = query.ilike(f.column, f.value);
      else if (f.op === 'is') query = query.is(f.column, f.value);
    }

    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (single) {
      const { data, error } = await query.single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
