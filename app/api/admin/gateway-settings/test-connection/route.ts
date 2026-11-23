import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import https from 'https';

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

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { gateway, asaas, efibank } = body;

    if (gateway === 'asaas') {
      const apiKey = (asaas?.api_key || '').trim();
      const env = asaas?.environment || 'production';
      const baseUrl = env === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

      if (!apiKey) {
        return NextResponse.json({ error: 'Chave API do Asaas não foi informada.' }, { status: 400 });
      }

      console.log(`[TEST-CONNECTION] Testando Asaas no ambiente ${env}...`);

      const resp = await fetch(`${baseUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const resText = await resp.text();
      let resJson: any = null;
      try { resJson = JSON.parse(resText); } catch {}

      if (resp.ok) {
        return NextResponse.json({
          success: true,
          gateway: 'asaas',
          message: `✅ Conexão com Asaas realizada com sucesso! Chave API válida e ativa no ambiente ${env.toUpperCase()}.`,
        });
      } else {
        const errorDesc = resJson?.errors?.[0]?.description || resJson?.message || `Status HTTP ${resp.status}`;
        return NextResponse.json({
          success: false,
          gateway: 'asaas',
          error: `Asaas recusou a chave: ${errorDesc}`,
        }, { status: 400 });
      }
    }

    if (gateway === 'efibank') {
      const clientId = (efibank?.client_id || '').trim();
      const clientSecret = (efibank?.client_secret || '').trim();
      const certBase64 = (efibank?.cert_base64 || '').trim();
      const env = efibank?.environment || 'production';

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Client ID e Client Secret da Efí são obrigatórios.' }, { status: 400 });
      }

      console.log(`[TEST-CONNECTION] Testando Efí Bank no ambiente ${env}...`);

      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const baseUrl = env === 'sandbox' ? 'https://pix-h.api.efipay.com.br' : 'https://pix.api.efipay.com.br';

      let agent: https.Agent | null = null;
      if (certBase64) {
        try {
          const certBuffer = Buffer.from(certBase64, 'base64');
          agent = new https.Agent({ pfx: certBuffer, passphrase: '' });
        } catch (e: any) {
          return NextResponse.json({ success: false, error: 'Certificado Base64 inválido: ' + e.message }, { status: 400 });
        }
      }

      return new Promise<NextResponse>((resolve) => {
        const url = new URL(`${baseUrl}/oauth/token`);
        const req = https.request({
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          agent: agent || undefined,
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode === 200 && parsed.access_token) {
                resolve(NextResponse.json({
                  success: true,
                  gateway: 'efibank',
                  message: `✅ Conexão com Efí Bank autenticada com sucesso! Token OAuth obtido no ambiente ${env.toUpperCase()}.`,
                }));
              } else {
                resolve(NextResponse.json({
                  success: false,
                  gateway: 'efibank',
                  error: parsed.error_description || parsed.message || `Erro HTTP ${res.statusCode}`,
                }, { status: 400 }));
              }
            } catch (e) {
              resolve(NextResponse.json({ success: false, error: `Falha ao interpretar resposta da Efí: ${data}` }, { status: 400 }));
            }
          });
        });

        req.on('error', (err) => {
          resolve(NextResponse.json({ success: false, error: `Falha de conexão com Efí Bank (mTLS): ${err.message}` }, { status: 400 }));
        });

        req.write(JSON.stringify({ grant_type: 'client_credentials' }));
        req.end();
      });
    }

    return NextResponse.json({ error: 'Gateway não reconhecido' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao testar conexão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
