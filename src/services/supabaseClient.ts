/**
 * Supabase-Client-Singleton
 *
 * Credentials kommen aus Umgebungsvariablen (Vite: VITE_*).
 * Lokal: .env-Datei anlegen (siehe .env.example).
 * Netlify: Environment Variables im Dashboard setzen.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt.\n' +
    'Live-Sessions sind deaktiviert. Lege eine .env-Datei an (siehe .env.example).'
  );
}

/** Gibt false zurück wenn Supabase nicht konfiguriert ist */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;
