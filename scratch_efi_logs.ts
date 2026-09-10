import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEfiLogs() {
  const { data: logs, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('source', 'efibank_webhook')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching logs:", error);
    return;
  }

  let unmatched = 0;
  for (const log of logs) {
    const body = log.payload;
    if (body && body.pix && Array.isArray(body.pix)) {
      for (const p of body.pix) {
        const txid = p.txid;
        if (!txid) {
          console.log(`[${log.created_at}] Pix sem txid. EndToEndId: ${p.endToEndId}, Valor: ${p.valor}`);
          unmatched++;
        } else {
          // Check if txid exists in transactions
          const { data: tx } = await supabase
            .from('transactions')
            .select('id, status, user_id')
            .eq('external_id', txid)
            .single();
            
          if (!tx) {
            console.log(`[${log.created_at}] TXID não encontrado no banco: ${txid}, Valor: ${p.valor}`);
            unmatched++;
          }
        }
      }
    }
  }
  console.log(`Total logs checked: ${logs.length}. Unmatched/Issues found: ${unmatched}`);
}

checkEfiLogs();
