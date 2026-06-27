
// Configuración de Supabase — Universidad Peruana los Andes
// IMPORTANTE: Asegúrate de reemplazar la constante SUPABASE_KEY con la clave "anon" (public) de tu panel de Supabase.

const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co"; // URL Base corregida (sin /rest/v1/)

// Reemplaza esta cadena con tu clave pública "anon / public" real desde el panel de Supabase -> Project Settings -> API
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbWdncXJhbmd5c3NtcGhieGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDU0MTMsImV4cCI6MjA5MTc4MTQxM30.ol2HlfOzHAd6_Z90OMPIi5pbKrOnGtOeNsaOizM5lCI"; 

// Inicializar el cliente global de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("✅ Supabase configurado correctamente con la URL Base.");
