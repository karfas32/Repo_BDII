/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: supabase-config.js
   Descripción: Configuración de Supabase
   ============================================================ */

const SUPABASE_URL = "https://fbccgpgzizsejipuhgtc.supabase.co"; // URL Base corregida (sin /rest/v1/)

// Reemplaza esta cadena con tu clave pública "anon / public" real desde el panel de Supabase -> Project Settings -> API
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiY2NncGd6aXpzZWppcHVoZ3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTA2NTQsImV4cCI6MjA5ODEyNjY1NH0.9DltDRNPLht8EZdu2oi8ogZvJ1rz0KycPbJmaajGPcM"; 

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
