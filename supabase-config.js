// Configuración de Supabase - UPLA Proyecto BD2
const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbWdncXJhbmd5c3NtcGhieGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDU0MTMsImV4cCI6MjA5MTc4MTQxM30.ol2HlfOzHAd6_Z90OMPIi5pbKrOnGtOeNsaOizM5lCI";

// Inicializar el cliente de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Prueba de conexión (para verificar en consola)
console.log("✅ Supabase configurado");
console.log("URL:", SUPABASE_URL);