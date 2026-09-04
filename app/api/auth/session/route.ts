import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ session: null, profile: null });
    }

    let userId: string | null = null;
    try {
      const payload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
      userId = payload.sub;
    } catch {
      return NextResponse.json({ session: null, profile: null });
    }

    if (!userId) {
      return NextResponse.json({ session: null, profile: null });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !user) {
      return NextResponse.json({ session: null, profile: null });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      session: { user: { id: user.id, email: user.email } },
      profile: profile || null,
    });
  } catch (err: any) {
    return NextResponse.json({ session: null, profile: null });
  }
}
