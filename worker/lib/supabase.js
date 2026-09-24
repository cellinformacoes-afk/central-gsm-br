const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// Node.js nao tem WebSocket nativo — passamos ws como transport para o realtime-js
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false },
    realtime: {
      transport: ws,
      params: { eventsPerSecond: 10 }
    },
    db: { schema: 'public' }
  }
);

module.exports = supabase;
