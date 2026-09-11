import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, accessToken, newPassword } = await request.json();
    if ((!code && !accessToken) || !newPassword) {
      return NextResponse.json({ error: 'Código (ou token) e nova senha são obrigatórios' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let user;

    if (code) {
      // Exchange the recovery code for tokens
      const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ auth_code: code }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        return NextResponse.json({ error: tokenData.error_description || 'Código inválido ou expirado' }, { status: 401 });
      }

      user = tokenData.user;
    } else if (accessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !data?.user) {
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
      }
      user = data.user;
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 401 });
    }



    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Senha redefinida com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
