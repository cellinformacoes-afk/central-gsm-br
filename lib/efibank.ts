import https from 'https';
import fs from 'fs';
import path from 'path';

// Credenciais Efi Bank (Gerencianet)
const EFI_CLIENT_ID = process.env.EFI_CLIENT_ID || 'Client_Id_d92cb16bfe267f6063066d31b79e263991156aa2';
const EFI_CLIENT_SECRET = process.env.EFI_CLIENT_SECRET || 'Client_Secret_ded86dd2a6285da51ac0d90a692e6a8361dd7006';
const EFI_PIX_KEY = process.env.EFI_PIX_KEY || '68.634.882/0001-80';
// Certificado embutido diretamente no código como fallback (gerado pelo setup_efi.js)
const EFI_CERT_BASE64_EMBEDDED = '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';
const EFI_CERT_BASE64 = process.env.EFI_CERT_BASE64 || EFI_CERT_BASE64_EMBEDDED;

// Para produção o endpoint é sem mtls- sandbox etc, mas o PIX usa mTLS em pix.api.efipay.com.br
const EFI_API_URL = 'https://pix.api.efipay.com.br';

let agent: https.Agent | null = null;

function getHttpsAgent() {
  if (agent) return agent;
  
  const certPassword = process.env.EFI_PIX_CERT_PASSWORD || '';
  
  if (EFI_CERT_BASE64) {
    const certBuffer = Buffer.from(EFI_CERT_BASE64.trim(), 'base64');
    agent = new https.Agent({
      pfx: certBuffer,
      passphrase: certPassword
    });
  } else {
    // Busca certificado na raiz do projeto
    try {
      const certPath = path.resolve(process.cwd(), 'certificado.p12');
      const certBuffer = fs.readFileSync(certPath);
      agent = new https.Agent({
        pfx: certBuffer,
        passphrase: certPassword
      });
    } catch (e) {
      console.warn('Certificado EFI não encontrado. O PIX não funcionará. Adicione o EFI_CERT_BASE64 no .env ou coloque certificado.p12 na pasta raiz.');
    }
  }
  return agent;
}

function efiRequest(endpoint: string, method: string, data?: any, token?: string) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${EFI_API_URL}${endpoint}`);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      agent: getHttpsAgent(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CentralGSM-App/1.0 (Node.js)'
      }
    };

    if (token) {
      options.headers!['Authorization'] = `Bearer ${token}`;
    } else {
      const auth = Buffer.from(`${EFI_CLIENT_ID.trim()}:${EFI_CLIENT_SECRET.trim()}`).toString('base64');
      options.headers!['Authorization'] = `Basic ${auth}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`EfiBank API Error: ${res.statusCode} - ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

export const efibank = {
  async getAuthToken(): Promise<string> {
    const response = await efiRequest('/oauth/token', 'POST', { grant_type: 'client_credentials' }) as any;
    return response.access_token;
  },

  async createPixPayment(amount: number, description: string, userId: string, cpf?: string, name?: string) {
    try {
      console.log(`Gerando PIX EfiBank para o usuário: ${userId}, valor: ${amount}`);
      const token = await this.getAuthToken();
      
      const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
      
      const cobData = {
        calendario: { expiracao: 86400 }, // 1 dia
        valor: { original: amount.toFixed(2) },
        chave: EFI_PIX_KEY,
        solicitacaoPagador: description,
        infoAdicionais: [
          { nome: 'Referencia', valor: userId }
        ]
      } as any;

      // Adiciona devedor se tiver CPF (A Efí exige CPF válido)
      if (cpfLimpo && cpfLimpo.length === 11 && name) {
        cobData.devedor = {
          cpf: cpfLimpo,
          nome: name
        };
      } else if (cpfLimpo && cpfLimpo.length === 14 && name) {
        cobData.devedor = {
          cnpj: cpfLimpo,
          nome: name
        };
      }

      // Cria a cobrança
      const cobResponse = await efiRequest('/v2/cob', 'POST', cobData, token) as any;
      
      // Gera o QR Code para a loc gerada
      const qrResponse = await efiRequest(`/v2/loc/${cobResponse.loc.id}/qrcode`, 'GET', undefined, token) as any;
      
      return {
        id: cobResponse.txid, // Usa o txid como referência externa
        qrCode: qrResponse.imagemQrcode,
        copyPaste: qrResponse.qrcode,
        locId: cobResponse.loc.id
      };
    } catch (error) {
      console.error('Erro no efibank.createPixPayment:', error);
      throw error;
    }
  },

  async configurarWebhook(webhookUrl: string) {
    try {
      const token = await this.getAuthToken();
      const pixKey = process.env.EFI_PIX_KEY || '';
      console.log(`Configurando webhook para a chave ${pixKey} com URL ${webhookUrl}`);
      
      // O efiRequest que criamos vai cuidar do HTTPS e do certificado
      const response = await efiRequest(`/v2/webhook/${encodeURIComponent(pixKey)}`, 'PUT', { webhookUrl }, token);
      return response;
    } catch (error) {
      console.error('Erro no efibank.configurarWebhook:', error);
      throw error;
    }
  }
};
