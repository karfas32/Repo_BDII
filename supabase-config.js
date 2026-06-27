/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: supabase-config.js
   Descripción: Configuración de Supabase (nuevo formato 2025)
   ============================================================ */

const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co";

// PUBLISHABLE KEY = anon key pública (segura para el frontend)
// SECRET KEY      = nunca va aquí, solo en servidores/edge functions
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7pEztTLjZzkAZF68Vyy26Q_iqOD4gD5";

try {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log("✅ Supabase inicializado correctamente");
} catch (err) {
  console.error("❌ Error iniciando Supabase:", err);
}
