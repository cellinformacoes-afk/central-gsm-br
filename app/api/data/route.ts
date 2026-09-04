import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  try {
    const { data: catData, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (catError) throw catError;

    const { data: servData, error: servError } = await supabaseAdmin
      .from('services')
      .select('*, categories(name, slug)')
      .eq('active', true);

    if (servError) throw servError;

    return NextResponse.json({
      categories: catData || [],
      services: servData || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
