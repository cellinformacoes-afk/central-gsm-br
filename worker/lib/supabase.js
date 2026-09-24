const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// Node.js nao tem WebSocket global — necessario para @supabase/realtime-js
if (!global.WebSocket) {
  global.WebSocket = ws;
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);

module.exports = supabase;
