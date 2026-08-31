import https from 'https';
import fs from 'fs';
import path from 'path';

// Credenciais Efi Bank (Gerencianet)
const EFI_CLIENT_ID = process.env.EFI_CLIENT_ID || '';
const EFI_CLIENT_SECRET = process.env.EFI_CLIENT_SECRET || '';
const EFI_PIX_KEY = process.env.EFI_PIX_KEY || ''; // Chave pix (ex: CNPJ, email ou chave aleatória)
const EFI_CERT_BASE64 = process.env.EFI_CERT_BASE64 || ''; // Conteúdo do certificado p12 em base64

// Para produção o endpoint é sem mtls- sandbox etc, mas o PIX usa mTLS em pix.api.efipay.com.br
const EFI_API_URL = 'https://pix.api.efipay.com.br';

let agent: https.Agent | null = null;

function getHttpsAgent() {
  if (agent) return agent;
  
  const certPassword = process.env.EFI_PIX_CERT_PASSWORD || '';
  
  if (EFI_CERT_BASE64) {
    const certBuffer = Buffer.from(EFI_CERT_BASE64, 'base64');
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
      const auth = Buffer.from(`${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`).toString('base64');
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
  }
};
