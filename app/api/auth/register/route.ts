import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name, cpf } = await req.json();

    if (!email || !password || !name || !cpf) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cleanCpf = cpf.replace(/\D/g, "");

    // 0. Check if CPF is blacklisted
    const { data: blacklisted, error: blacklistError } = await supabaseAdmin
      .from('cpf_blacklist')
      .select('cpf')
      .eq('cpf', cleanCpf)
      .maybeSingle();

    if (blacklistError && blacklistError.code !== 'PGRST116') {
      console.error('Blacklist Check Error:', blacklistError);
    }

    if (blacklisted) {
      return NextResponse.json({ error: 'Este CPF está bloqueado por questões de segurança.' }, { status: 403 });
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now as per current site behavior
      user_metadata: { full_name: name, cpf: cpf }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Upsert the profile with CPF
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        username: name,
        cpf: cpf.replace(/\D/g, ""),
        role: 'user'
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile Error:', profileError);
      // If profile fails, we might want to cleanup the auth user, but usually it's better to log it
      if (profileError.code === '23505' && profileError.message.includes('cpf')) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return NextResponse.json({ error: 'Este CPF já está cadastrado em outra conta.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Conta criada com sucesso!' }, { status: 200 });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
