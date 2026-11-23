import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getGatewaySettings, saveGatewaySettings, GatewaySettings } from '@/lib/gateway-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function checkAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return false;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

// GET: Retorna as configurações atuais
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const settings = await getGatewaySettings();

    // Retorna as configurações com a chave do webhook e a URL pronta com www oficial (evita redirect 307)
    let origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.centralgsm.com.br';
    if (!origin.includes('www.') && origin.includes('centralgsm.com.br')) {
      origin = origin.replace('https://centralgsm.com.br', 'https://www.centralgsm.com.br');
    }
    
    return NextResponse.json({
      success: true,
      settings,
      webhook_urls: {
        asaas: `${origin}/api/webhooks/asaas`,
        efibank: `${origin}/api/webhooks/efibank`,
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar gateway settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salva as novas configurações
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { active_gateway, asaas, efibank } = body;

    const success = await saveGatewaySettings({
      active_gateway,
      asaas,
      efibank,
    });

    if (!success) {
      return NextResponse.json({ error: 'Falha ao salvar configurações no banco' }, { status: 500 });
    }

    const updated = await getGatewaySettings();

    return NextResponse.json({
      success: true,
      message: 'Configurações de pagamento salvas com sucesso!',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Erro ao salvar gateway settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
