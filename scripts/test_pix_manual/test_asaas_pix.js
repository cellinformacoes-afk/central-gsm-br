import 'dotenv/config';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

async function fetchPixTransactions() {
  console.log('Fetching Asaas Pix Transactions...');
  try {
    const response = await fetch('https://api.asaas.com/v3/pix/transactions?limit=5', {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY.trim(),
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response Text:', text);
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
}

fetchPixTransactions();
