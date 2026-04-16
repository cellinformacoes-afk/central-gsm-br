import { NextResponse } from 'next/server';
import { asaas } from '@/lib/asaas';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { amount, description, userId, cpf } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    console.log('--- Iniciando Geração de Pix Asaas ---');
    console.log('User ID:', userId);
    console.log('Amount:', amount);
    
    // Check if admin key is present
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('ERRO CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente!');
    } else {
      console.log('SUPABASE_SERVICE_ROLE_KEY detectada (tamanho:', process.env.SUPABASE_SERVICE_ROLE_KEY.length, ')');
    }

    // 1. Get user profile using Admin client to ensure access
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, username, asaas_customer_id, cpf')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Erro RLS ao buscar perfil:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 403 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    console.log('Perfil encontrado:', profile.email);
    let customerId = profile.asaas_customer_id;

    // 2. Ensure customer exists in Asaas and update profile
    // We call getOrCreateCustomer even if customerId exists to handle CPF updates/sync
    const newCustomerId = await asaas.getOrCreateCustomer(
      profile.email, 
      profile.username || profile.email.split('@')[0],
      cpf || profile.cpf
    );

    if (!customerId || customerId !== newCustomerId || (cpf && profile.cpf !== cpf)) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          asaas_customer_id: newCustomerId,
          cpf: cpf || profile.cpf
        })
        .eq('id', userId);
      customerId = newCustomerId;
    }

    // 3. Create Pix Payment in Asaas
    const result = await asaas.createPixPayment(
      customerId,
      parseFloat(amount),
      description || 'Recarga de Saldo - Central GSM',
      userId
    );

    return NextResponse.json({
      id: result.id,
      qr_code: result.copyPaste, // In asaas util, copyPaste is the payload
      qr_code_base64: result.qrCode, // In asaas util, qrCode is the base64 image
      copy_paste: result.copyPaste,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix no Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
