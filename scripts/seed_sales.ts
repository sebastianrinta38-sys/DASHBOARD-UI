import { createClient } from '@supabase/supabase-js';
import { INITIAL_SALES, EXCHANGE_RATES } from '../src/data/mockData';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pbckgpihujsfyvyaubro.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY2tncGlodWpzZnl2eWF1YnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDU1NjYsImV4cCI6MjA5OTk4MTU2Nn0.f4M1xRVwSrR429QyXSBbTjAzSj0OxrTXzsYvDHOP4Vs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSales() {
  console.log('Fetching entity IDs...');
  
  const { data: paises } = await supabase.from('paises').select('id, nombre');
  const { data: productos } = await supabase.from('productos').select('id, nombre');
  const { data: bots } = await supabase.from('bots_whatsapp').select('id, nombre');

  if (!paises || !productos || !bots) {
    console.error('Failed to load entity IDs from Supabase');
    process.exit(1);
  }

  const paisMap = new Map(paises.map(p => [p.nombre, p.id]));
  const prodMap = new Map(productos.map(p => [p.nombre, p.id]));
  const botMap = new Map(bots.map(b => [b.nombre, b.id]));

  console.log(`Found ${paises.length} paises, ${productos.length} productos, ${bots.length} bots.`);

  // Prepare sales data
  const salesToInsert = INITIAL_SALES.map(sale => {
    const paisId = paisMap.get(sale.country) || paises[0].id;
    const productoId = prodMap.get(sale.product) || productos[0].id;
    const botId = botMap.get(sale.bot) || bots[0].id;

    return {
      codigo_venta: sale.id,
      cliente_nombre: sale.customerName,
      cliente_telefono: sale.phone,
      producto_id: productoId,
      pais_id: paisId,
      bot_id: botId,
      monto_local: sale.amountLocal,
      monto_usd: sale.amountUsd,
      moneda: sale.currency,
      fecha: sale.date,
      estado: 'completada'
    };
  });

  console.log(`Inserting ${salesToInsert.length} sales into Supabase...`);

  // Insert in batches of 50 to avoid request size limits
  const batchSize = 50;
  for (let i = 0; i < salesToInsert.length; i += batchSize) {
    const batch = salesToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('ventas').upsert(batch, { onConflict: 'codigo_venta' });
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      console.log(`Batch ${i / batchSize + 1} inserted successfully.`);
    }
  }

  console.log('Seeding completed successfully!');
}

seedSales().catch(console.error);
