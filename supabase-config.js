/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: supabase-config.js
   Descripción: Configuración de Supabase
   ============================================================ */

const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co"; // URL Base corregida (sin /rest/v1/)

// Reemplaza esta cadena con tu clave pública "anon / public" real desde el panel de Supabase -> Project Settings -> API
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbWdncXJhbmd5c3NtcGhieGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDU0MTMsImV4cCI6MjA5MTc4MTQxM30.ol2HlfOzHAd6_Z90OMPIi5pbKrOnGtOeNsaOizM5lCI"; 

try {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,   // Mantener sesión activa
      autoRefreshToken: true  // Refrescar tokens automáticamente
    }
  });
  console.log("✅ Supabase inicializado correctamente");
} catch (err) {
  console.error("❌ Error iniciando Supabase:", err);
}
