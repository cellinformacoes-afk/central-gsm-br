import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ session: null, profile: null });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
    
    if (authError || !user) {
      return NextResponse.json({ session: null, profile: null });
    }

    // Bloqueio manual de golpistas (contestação indevida)
    const blockedUsers = [
      'cfef9d31-0685-44b6-95f1-9cbfe60ac558', // Bernardo
      '10ea5e2c-4828-4cc7-8f4e-02600c265bf2', // Wylliam / Mateus
      '082770a6-5b58-42f9-9072-ba74496acfc6'  // Carlos Boccia
    ];
    
    if (blockedUsers.includes(user.id)) {
      return NextResponse.json({ session: null, profile: null, error: 'Sua conta foi bloqueada por violação dos termos (Contestação Indevida).' }, { status: 403 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      session: { user: { id: user.id, email: user.email } },
      profile: profile || null,
    });
  } catch (err: any) {
    return NextResponse.json({ session: null, profile: null });
  }
}
