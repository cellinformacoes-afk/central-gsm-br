import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { amount, description, userId, cpf, payerName } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    if (!payerName) {
      return NextResponse.json({ error: 'Nome do pagador não fornecido' }, { status: 400 });
    }

    console.log('--- Iniciando Geração de Pix Estático ---');
    console.log('User ID:', userId);
    console.log('Amount:', amount);
    console.log('Payer Name:', payerName);

    // Salvar transação pendente no banco de dados
    // Vamos embutir o nome no ID já que a coluna metadata não existe
    const safeName = payerName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    const pendingId = `STATIC_${Date.now()}_${safeName}`;

    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        status: 'pending',
        external_id: pendingId,
        type: 'pix'
      });

    if (dbError) {
      console.error('Erro ao salvar transação pendente:', dbError);
      return NextResponse.json({ error: `Erro BD: ${dbError.message}` }, { status: 500 });
    }

    // Função para calcular CRC16 do PIX
    function crc16(payload: string) {
      let crc = 0xFFFF;
      for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc = crc << 1;
          }
        }
      }
      return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    function formatStr(id: string, value: string) {
      const len = value.length.toString().padStart(2, '0');
      return `${id}${len}${value}`;
    }

    // Gerando o Pix com o VALOR exato para evitar erro no aplicativo do banco
    const gui = formatStr('00', 'br.gov.bcb.pix');
    const key = formatStr('01', '569ca170-dc32-4744-ab42-0d966b9db179');
    const merchantAccountInfo = formatStr('26', gui + key);
    const merchantCategoryCode = formatStr('52', '0000');
    const transactionCurrency = formatStr('53', '986');
    const transactionAmount = formatStr('54', parseFloat(amount).toFixed(2));
    const countryCode = formatStr('58', 'BR');
    
    let name = 'ISRAEL CANDIDO';
    const merchantName = formatStr('59', name);
    const merchantCity = formatStr('60', 'SAO PAULO');
    const txid = formatStr('05', '***');
    const additionalDataFieldTemplate = formatStr('62', txid);

    const payloadWithoutCrc = [
      formatStr('00', '01'),
      merchantAccountInfo,
      merchantCategoryCode,
      transactionCurrency,
      transactionAmount,
      countryCode,
      merchantName,
      merchantCity,
      additionalDataFieldTemplate,
      '6304'
    ].join('');

    const pixCopyPaste = payloadWithoutCrc + crc16(payloadWithoutCrc);

    return NextResponse.json({
      id: pendingId,
      qr_code: pixCopyPaste,
      // Passando uma URL pública para renderizar o QR Code no frontend
      qr_code_base64: null,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopyPaste)}`,
      copy_paste: pixCopyPaste,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix Estático:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
