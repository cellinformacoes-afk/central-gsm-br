import { getGatewaySettings } from '@/lib/gateway-config';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasPayment {
  id: string;
  invoiceUrl: string;
  pixQrCode: string;
  pixCopyPaste: string;
}

export async function getAsaasCredentials() {
  const settings = await getGatewaySettings();
  const apiKey = (settings.asaas?.api_key || process.env.ASAAS_API_KEY || '').trim();
  const env = settings.asaas?.environment || 'production';
  const apiUrl = env === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : (process.env.ASAAS_API_URL || 'https://api.asaas.com/v3');
  return { apiKey, apiUrl };
}

export const asaas = {
  async getOrCreateCustomer(email: string, name?: string, cpfCnpj?: string): Promise<string> {
    try {
      const { apiKey, apiUrl } = await getAsaasCredentials();
      if (!apiKey) throw new Error('Chave API do Asaas não configurada. Configure na aba de Bancos no painel.');

      console.log(`Buscando cliente Asaas por email: ${email} na URL: ${apiUrl}`);

      // 1. Buscar cliente por email
      const searchResponse = await fetch(`${apiUrl}/customers?email=${encodeURIComponent(email)}`, {
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const searchRawText = await searchResponse.text();
      let searchData: any;
      try {
        searchData = JSON.parse(searchRawText);
      } catch (e) {
        throw new Error(`Erro ao converter resposta search Asaas para JSON. Status: ${searchResponse.status}`);
      }

      if (searchData.data && searchData.data.length > 0) {
        const customer = searchData.data[0];
        console.log(`Cliente encontrado: ${customer.id}`);

        const update: any = { notificationDisabled: true };
        if (cpfCnpj) update.cpfCnpj = cpfCnpj.replace(/\D/g, '');
        if (name) update.name = name;

        await fetch(`${apiUrl}/customers/${customer.id}`, {
          method: 'POST',
          headers: {
            'access_token': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });

        return customer.id;
      }

      console.log(`Cliente não encontrado, criando novo...`);

      // 2. Criar cliente caso não exista
      const createResponse = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name || email.split('@')[0],
          email: email,
          cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : undefined,
          notificationDisabled: true
        })
      });

      const createRawText = await createResponse.text();
      let createData: any;
      try {
        createData = JSON.parse(createRawText);
      } catch (e) {
        throw new Error(`Erro ao converter resposta create Asaas para JSON. Status: ${createResponse.status}`);
      }

      if (createData.errors) {
        throw new Error(createData.errors[0].description);
      }

      return createData.id;
    } catch (error: any) {
      console.error('Error in asaas.getOrCreateCustomer:', error);
      throw error;
    }
  },

  async createPixPayment(customerId: string, amount: number, description: string, userId: string): Promise<any> {
    try {
      const { apiKey, apiUrl } = await getAsaasCredentials();
      if (!apiKey) throw new Error('Chave API do Asaas não configurada.');

      const response = await fetch(`${apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
          description: description,
          externalReference: userId
        })
      });
      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].description);
      }

      // Buscar QR Code e Copia e Cola do Pix
      const qrResponse = await fetch(`${apiUrl}/payments/${data.id}/pixQrCode`, {
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const qrData = await qrResponse.json();

      return {
        id: data.id,
        invoiceUrl: data.invoiceUrl,
        qrCode: qrData.encodedImage, // Imagem Base64
        copyPaste: qrData.payload,   // String Copia e Cola
      };
    } catch (error: any) {
      console.error('Error in asaas.createPixPayment:', error);
      throw error;
    }
  },

  async createCardPayment(customerId: string, amount: number, description: string, userId: string): Promise<any> {
    try {
      const { apiKey, apiUrl } = await getAsaasCredentials();
      if (!apiKey) throw new Error('Chave API do Asaas não configurada.');

      const response = await fetch(`${apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'UNDEFINED',
          value: amount,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
          description: description,
          externalReference: userId
        })
      });
      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].description);
      }

      return {
        id: data.id,
        invoiceUrl: data.invoiceUrl,
      };
    } catch (error: any) {
      console.error('Error in asaas.createCardPayment:', error);
      throw error;
    }
  },

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const { apiKey, apiUrl } = await getAsaasCredentials();
      if (!apiKey) return 'pending';

      const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        return 'approved';
      }
      if (data.status === 'OVERDUE') return 'expired';
      if (data.status === 'REFUNDED') return 'refunded';

      return data.status ? data.status.toLowerCase() : 'pending';
    } catch (error: any) {
      console.error('Error in asaas.getPaymentStatus:', error);
      return 'pending';
    }
  },

  async listUserPayments(userId: string): Promise<any[]> {
    try {
      const { apiKey, apiUrl } = await getAsaasCredentials();
      if (!apiKey) return [];

      const response = await fetch(`${apiUrl}/payments?externalReference=${userId}`, {
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error('Error in asaas.listUserPayments:', error);
      throw error;
    }
  }
};
