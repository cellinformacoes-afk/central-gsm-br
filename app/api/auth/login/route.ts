import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    let data: any = null;
    let lastRes: Response | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ email, password }),
        });

        lastRes = res;
        const text = await res.text();
        try {
          data = JSON.parse(text);
          break;
        } catch {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
          return NextResponse.json(
            { error: 'Erro inesperado da API (Nao é JSON): ' + text.substring(0, 200) },
            { status: 503 }
          );
        }
      } catch (err: any) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1200));
          continue;
        }
        return NextResponse.json(
          { error: 'Serviço de autenticação indisponível no momento. Erro: ' + err.message },
          { status: 503 }
        );
      }
    }

    if (!lastRes?.ok || data.error) {
      const msg = data?.error_description || data?.error || 'Credenciais inválidas';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Bloqueio manual de golpistas (contestação indevida)
    const blockedUsers = [
      'cfef9d31-0685-44b6-95f1-9cbfe60ac558', // Bernardo
      '10ea5e2c-4828-4cc7-8f4e-02600c265bf2', // Wylliam / Mateus
      '082770a6-5b58-42f9-9072-ba74496acfc6', // Carlos Boccia
      '60a17e43-8d31-4c7d-ac32-d688059813c2'  // Marcos Antonio
    ];
    
    if (data.user && blockedUsers.includes(data.user.id)) {
      return NextResponse.json({ error: 'Sua conta foi bloqueada por violação dos termos (Contestação Indevida).' }, { status: 403 });
    }

    return NextResponse.json({
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      },
      user: data.user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}