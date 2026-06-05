// Configuración de Supabase - UPLA Proyecto BD2
const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbWdncXJhbmd5c3NtcGhieGd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIwNTQxMywiZXhwIjoyMDkxNzgxNDEzfQ.gvPdY8q7QB16NEx-LyKBvLpSGRfKfNBles4kX3pgEOs";

// Inicializar el cliente de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Prueba de conexión (para verificar en consola)
console.log("✅ Supabase configurado");
console.log("URL:", SUPABASE_URL);
