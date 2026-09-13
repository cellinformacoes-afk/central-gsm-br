import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, select = '*', filters = [], order, limit, single, rpc, rpcParams } = body;

    if (rpc) {
      const { data, error } = await supabaseAdmin.rpc(rpc, rpcParams || {});
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
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
