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
      '60a17e43-8d31-4c7d-ac32-d688059813c2', // Marcos Antonio
      '99979fb5-91d1-4aa9-9842-98f291fd564c', // Diego Daniel (diegodanielamericodesouza2002@gmail.com)
      'be247f8a-0f23-4d4a-84b8-20c4ae95471a', // Elite Importados (elitecell2027@gmail.com)
      '523eddd4-ec49-45cd-b3c2-d5ba3b1718e9', // Paulo Dir dos Santos Junior (ps2543569@gmail.com) - MED indevido 22/09/2026
      'a3591f78-6f27-4233-b783-349fb8318223', // Renato Abib Dutra Miguel (renatoadmiguel@yahoo.com.br) - MED indevido 22/09/2026
      '0adf7e01-756a-4d10-9adf-558ea01aef84', // Natanael Paulo / Miguel (natanael2025paulo@gmail.com) - MED indevido 30/09/2026
      '098af57c-0492-4ad2-b3df-3e6a517ae825', // Bryan Marques (menoor0209@gmail.com) - MED indevido 02/10/2026
      'f5123b97-d34d-4de3-bfef-f8302237b56f', // Diego Araujo da Silva (diegosilvacda2019@gmail.com) - MED indevido
      '6e4e26ad-7dda-41d6-a68b-20724ec9a8aa', // Jose Aparecido (japlf77@gmail.com) - MED indevido
      '35d0028d-3546-40b9-a632-7748a27be0a2', // Joao Victor Mendes Nogueira (victormendesnogueira@gmail.com) - MED indevido 30/09/2026
    ];

    if (data.user && blockedUsers.includes(data.user.id)) {
      return NextResponse.json({ error: 'Sua conta foi bloqueada por violação dos termos (Contestação Indevida).' }, { status: 403 });
    }

    // Verificar se o usuário está com role banned no banco
    if (data.user?.id) {
      try {
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${data.user.id}&select=role`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          }
        });
        if (profileRes.ok) {
          const profiles = await profileRes.json();
          if (profiles?.[0]?.role === 'banned') {
            return NextResponse.json({ error: 'Sua conta foi bloqueada por violação dos termos (Contestação Indevida).' }, { status: 403 });
          }
        }
      } catch (err) {
        console.error('Erro ao verificar role banned:', err);
      }
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