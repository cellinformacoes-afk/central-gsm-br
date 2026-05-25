const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('========================================================================');
console.log('ATENÇÃO: PARA IMPLEMENTAR A COMPRA DE PLANO AUTOMÁTICA COM SALDO,');
console.log('VOCÊ DEVE EXECUTAR O CONTEÚDO DO ARQUIVO ABAIXO NO SEU SUPABASE:');
console.log('------------------------------------------------------------------------');
console.log('Local do arquivo: scripts/sql/purchase_plan_with_balance.sql');
console.log('Abra o Supabase Dashboard > SQL Editor > New Query > Cole e Execute.');
console.log('========================================================================');
