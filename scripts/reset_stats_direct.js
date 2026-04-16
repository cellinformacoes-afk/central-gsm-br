const https = require('https');

const supabaseUrl = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emhjemd2ZnZmbG1jd21tdmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxMzIzNSwiZXhwIjoyMDg5Mjg5MjM1fQ.ZjWHhsx09d52PaCuhFjrHYm790te5yHhq_X3XWnsysY';

const today = new Date().toISOString().split('T')[0];

const options = {
  hostname: 'cvzhczgvfvflmcwmmvlh.supabase.co',
  path: `/rest/v1/transactions?type=eq.deposit&status=eq.success&created_at=gte.${today}`,
  method: 'DELETE',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Sucesso! Entradas hoje resetadas.');
    } else {
      console.error('Falha no reset.');
    }
  });
});

req.on('error', (e) => {
  console.error('Erro na requisição:', e.message);
});

req.end();
