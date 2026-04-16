const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

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

export const asaas = {
  async getOrCreateCustomer(email: string, name?: string, cpfCnpj?: string): Promise<string> {
    try {
      console.log(`Buscando cliente Asaas por email: ${email}`);
      console.log(`Usando URL: ${ASAAS_API_URL}`);
      console.log(`Tamanho da API Key: ${ASAAS_API_KEY.length}`);
      console.log(`Início da Key: ${ASAAS_API_KEY.substring(0, 5)}...`);
      console.log(`Fim da Key: ...${ASAAS_API_KEY.substring(ASAAS_API_KEY.length - 5)}`);

      // 1. Search for customer
      const searchResponse = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
          'Content-Type': 'application/json'
        }
      });

      const searchRawText = await searchResponse.text();
      console.log(`Resposta buscador Asaas: Status ${searchResponse.status}`);
      
      let searchData;
      try {
        searchData = JSON.parse(searchRawText);
      } catch (e) {
        throw new Error(`Erro ao converter resposta search Asaas para JSON. Status: ${searchResponse.status}`);
      }

      if (searchData.data && searchData.data.length > 0) {
        const customer = searchData.data[0];
        console.log(`Cliente encontrado: ${customer.id}`);
        
        // Se o cliente existe mas não tem CPF e nós temos um agora, vamos atualizar
        if (!customer.cpfCnpj && cpfCnpj) {
          console.log(`Atualizando CPF para o cliente ${customer.id}`);
          await fetch(`${ASAAS_API_URL}/customers/${customer.id}`, {
            method: 'POST',
            headers: {
              'access_token': ASAAS_API_KEY.trim(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpfCnpj })
          });
        }
        
        return customer.id;
      }

      console.log(`Cliente não encontrado, criando novo...`);

      // 2. Create customer if not found
      const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name || email.split('@')[0],
          email: email,
          cpfCnpj: cpfCnpj
        })
      });

      const createRawText = await createResponse.text();
      console.log(`Resposta criador Asaas: Status ${createResponse.status}`);
      
      let createData;
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
      const response = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // 1 day due date
          description: description,
          externalReference: userId
        })
      });
      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].description);
      }

      // Get Pix QR Code
      const qrResponse = await fetch(`${ASAAS_API_URL}/payments/${data.id}/pixQrCode`, {
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
          'Content-Type': 'application/json'
        }
      });
      const qrData = await qrResponse.json();

      return {
        id: data.id,
        invoiceUrl: data.invoiceUrl,
        qrCode: qrData.encodedImage, // Base64 image
        copyPaste: qrData.payload,   // Pix copy/paste payload
      };
    } catch (error: any) {
      console.error('Error in asaas.createPixPayment:', error);
      throw error;
    }
  },

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      console.log(`Verificando status do pagamento ${paymentId} no Asaas...`);
      const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log(`Status bruto recebido do Asaas para ${paymentId}: ${data.status}`);
      
      // Asaas status mapping to common status
      // RECEIVED, CONFIRMED -> approved
      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        return 'approved';
      }
      if (data.status === 'OVERDUE') return 'expired';
      if (data.status === 'REFUNDED') return 'refunded';
      
      return data.status.toLowerCase();
    } catch (error: any) {
      console.error('Error in asaas.getPaymentStatus:', error);
      throw error;
    }
  },

  async listUserPayments(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${ASAAS_API_URL}/payments?externalReference=${userId}`, {
        headers: {
          'access_token': ASAAS_API_KEY.trim(),
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
