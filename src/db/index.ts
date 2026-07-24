import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pbckgpihujsfyvyaubro.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MHRTClHjiJZ6LEhY1SVB7g_GyvWtYg_';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.warn('\n⚠️ [SUPABASE WARNING]: SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local!');
  console.warn('⚠️ Las escrituras a Supabase fallarán por RLS hasta que pegues tu service_role key en .env.local.\n');
} else {
  console.log('✅ [SUPABASE SERVER]: SUPABASE_SERVICE_ROLE_KEY cargada correctamente en el servidor.');
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// CLIENTE 1: Cliente Público (Publishable / Anon Key)
export const supabasePublic = createClient(supabaseUrl, anonKey, clientOptions);

// CLIENTE 2: Cliente Admin de Servidor (Service Role Key para bypass de RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, clientOptions);

export const supabaseServer = supabaseAdmin;
export { schema };
