
// Configuración de Supabase — Universidad Peruana los Andes
// IMPORTANTE: Asegúrate de reemplazar la constante SUPABASE_KEY con la clave "anon" (public) de tu panel de Supabase.

const SUPABASE_URL = "https://ckmggqrangyssmphbxgw.supabase.co"; // URL Base corregida (sin /rest/v1/)

// Reemplaza esta cadena con tu clave pública "anon / public" real desde el panel de Supabase -> Project Settings -> API
const SUPABASE_KEY = "sb_publishable_7pEztTLjZzkAZF68Vyy26Q_iqOD4gD5"; 

// Inicializar el cliente global de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("✅ Supabase configurado correctamente con la URL Base.");
