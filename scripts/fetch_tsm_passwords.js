const https = require('https');

const supabaseUrl = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emhjemd2ZnZmbG1jd21tdmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxMzIzNSwiZXhwIjoyMDg5Mjg5MjM1fQ.ZjWHhsx09d52PaCuhFjrHYm790te5yHhq_X3XWnsysY';

const options = {
  hostname: 'cvzhczgvfvflmcwmmvlh.supabase.co',
  path: `/rest/v1/automation_tasks?select=payload&type=eq.password_reset&order=created_at.desc&limit=10`,
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const data = JSON.parse(body);
      data.forEach((task, i) => {
          if (task.payload?.service_title?.includes('TSM')) {
              console.log(`TSM Task ${i}:`, JSON.stringify(task.payload, null, 2));
          }
      });
    } else {
      console.error('Falha ao buscar dados:', res.statusCode, body);
    }
  });
});

req.on('error', (e) => console.error('Erro:', e.message));
req.end();
