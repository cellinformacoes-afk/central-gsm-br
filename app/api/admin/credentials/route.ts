import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('payload')
      .eq('provider', 'admin_credentials_store')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ email: '', password: '' });
    }
    
    return NextResponse.json(data.payload);
  } catch (err: any) {
    return NextResponse.json({ email: '', password: '' });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.userId && body.email && body.password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(body.userId, {
        email: body.email,
        password: body.password,
        email_confirm: true
      });
      if (authError) throw authError;
    }
    
    await supabaseAdmin.from('webhook_logs').insert({
      provider: 'admin_credentials_store',
      payload: { email: body.email || '', password: body.password || '' },
      status: 'saved'
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
