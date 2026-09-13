import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      supabase: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      supabase: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
