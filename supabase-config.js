
// Configuración de Supabase — Universidad Peruana los Andes
// IMPORTANTE: Asegúrate de reemplazar la constante SUPABASE_KEY con la clave "anon" (public) de tu panel de Supabase.

const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co"; // URL Base corregida (sin /rest/v1/)

// Reemplaza esta cadena con tu clave pública "anon / public" real desde el panel de Supabase -> Project Settings -> API
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbWdncXJhbmd5c3NtcGhieGd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIwNTQxMywiZXhwIjoyMDkxNzgxNDEzfQ.gvPdY8q7QB16NEx-LyKBvLpSGRfKfNBles4kX3pgEOs"; 

// Inicializar el cliente global de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log("✅ Supabase configurado correctamente con la URL Base.");
