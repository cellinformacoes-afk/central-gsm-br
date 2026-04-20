const { createClient } = require('@supabase/supabase-js');
const data = require('./migrate_data.js');

const supabaseUrl = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emhjemd2ZnZmbG1jd21tdmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxMzIzNSwiZXhwIjoyMDg5Mjg5MjM1fQ.ZjWHhsx09d52PaCuhFjrHYm790te5yHhq_X3XWnsysY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log(`Iniciando migração de ${data.length} registros...`);
    
    // Transforma os dados para o formato do banco
    const tutorialsToInsert = data.map(m => ({
        id: m.id,
        brand: m.brand,
        model: m.model,
        category: m.category,
        video_url: m.videoUrl || null,
        steps: m.steps,
        files: m.files || []
    }));

    // Insere em lotes para evitar erros de limite de dados
    const batchSize = 50;
    for (let i = 0; i < tutorialsToInsert.length; i += batchSize) {
        const batch = tutorialsToInsert.slice(i, i + batchSize);
        const { error } = await supabase
            .from('tutorials')
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`Erro no lote ${i / batchSize + 1}:`, error.message);
        } else {
            console.log(`Lote ${i / batchSize + 1} migrado.`);
        }
    }
    
    console.log('Migração concluída com sucesso!');
}

migrate();
