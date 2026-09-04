import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

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

    return NextResponse.json(
      {
        categories: catData || [],
        services: servData || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
