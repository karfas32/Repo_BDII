/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: login.js
   Descripción: Autenticación con Supabase (tabla 'usuarios')
   ============================================================ */

const SESSION_KEY = "upla_session";

document.addEventListener("DOMContentLoaded", function () {
  verificarSesionActiva();
  configurarEventos();
});

// ── Redirección si ya hay sesión ─────────────────────────────
function verificarSesionActiva() {
  const sesion = obtenerSesion();
  if (sesion) redirigirPorRol(sesion.rol);
}

function obtenerSesion() {
  try {
    const datos = sessionStorage.getItem(SESSION_KEY);
    return datos ? JSON.parse(datos) : null;
  } catch (_) { return null; }
}

// ── Eventos del formulario ────────────────────────────────────
function configurarEventos() {
  const loginForm    = document.getElementById("loginForm");
  const togglePass   = document.getElementById("togglePass");
  const inputUsuario = document.getElementById("inputUsuario");
  const inputPassword = document.getElementById("inputPassword");

  if (loginForm)     loginForm.addEventListener("submit", manejarLogin);
  if (togglePass)    togglePass.addEventListener("click", alternarVisibilidadPassword);
  if (inputUsuario)  inputUsuario.addEventListener("input", ocultarError);
  if (inputPassword) inputPassword.addEventListener("input", ocultarError);
}

// ── Login principal ───────────────────────────────────────────
async function manejarLogin(e) {
  e.preventDefault();

  const usuario  = document.getElementById("inputUsuario").value.trim().toLowerCase();
  const password = document.getElementById("inputPassword").value;

  if (!usuario || !password) {
    mostrarError("Por favor, completa todos los campos.");
    return;
  }

  mostrarCargando(true);

  try {
    // Buscar usuario en Supabase (tabla 'usuarios')
    const { data, error } = await window.supabaseClient
      .from("usuarios")
      .select("id, nombre, usuario, rol, password_hash")
      .eq("usuario", usuario)
      .eq("activo", true)
      .single();

    // Si la tabla no existe aún, caer en credenciales locales de emergencia
    if (error && error.code === "PGRST116") {
      // No encontrado → error normal
      mostrarError("Usuario o contraseña incorrectos.");
      mostrarCargando(false);
      return;
    }

    if (error) {
      // Posible error de red/tabla — fallback local solo para desarrollo
      console.warn("⚠️ Sin conexión a tabla usuarios, usando fallback local:", error.message);
      const fallback = autenticarLocal(usuario, password);
      if (!fallback) { mostrarError("Usuario o contraseña incorrectos."); mostrarCargando(false); return; }
      guardarSesionYRedirigir(fallback);
      return;
    }

    // Verificar contraseña: comparamos contra hash SHA-256 almacenado
    // (si usas bcrypt en backend, cambia esto por un edge function)
    const hashIngresado = await sha256(password);
    if (!data || data.password_hash !== hashIngresado) {
      mostrarError("Usuario o contraseña incorrectos.");
      mostrarCargando(false);
      return;
    }

    guardarSesionYRedirigir({
      id:      data.id,
      nombre:  data.nombre,
      usuario: data.usuario,
      rol:     data.rol
    });

  } catch (err) {
    console.error("❌ Error de autenticación:", err);
    mostrarError("Error al conectar. Intenta de nuevo.");
    mostrarCargando(false);
  }
}

// ── SHA-256 nativo del navegador ──────────────────────────────
async function sha256(texto) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto)
  );
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Fallback local (solo si Supabase falla en desarrollo) ─────
function autenticarLocal(usuario, password) {
  const CREDS = [
    { usuario: "admin",      password: "upla2024", id: 1, nombre: "Admin",      rol: "admin"      },
    { usuario: "estudiante", password: "123456",   id: 2, nombre: "Estudiante", rol: "estudiante" }
  ];
  return CREDS.find(c => c.usuario === usuario && c.password === password) || null;
}

// ── Guardar sesión y redirigir ────────────────────────────────
function guardarSesionYRedirigir(usuario) {
  const sesion = { id: usuario.id, nombre: usuario.nombre, usuario: usuario.usuario, rol: usuario.rol };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));

  mostrarExito(sesion);
  setTimeout(() => redirigirPorRol(sesion.rol), 800);
}

// ── UI helpers ────────────────────────────────────────────────
function mostrarError(mensaje) {
  const alertError   = document.getElementById("alertError");
  const inputPassword = document.getElementById("inputPassword");
  if (alertError) {
    alertError.textContent = mensaje;
    alertError.className = "alert alert-error";
    alertError.classList.remove("hidden");
    alertError.style.animation = "none";
    void alertError.offsetWidth;
    alertError.style.animation = "shakeX 0.4s ease";
  }
  if (inputPassword) inputPassword.style.borderColor = "var(--error)";
}

function ocultarError() {
  const alertError   = document.getElementById("alertError");
  const inputPassword = document.getElementById("inputPassword");
  if (alertError) alertError.classList.add("hidden");
  if (inputPassword) inputPassword.style.borderColor = "";
}

function mostrarExito(usuario) {
  const alertError = document.getElementById("alertError");
  const btnLogin   = document.getElementById("btnLogin");
  if (alertError) {
    alertError.textContent = `✓ Bienvenido, ${escapeHtml(usuario.nombre)}. Redirigiendo...`;
    alertError.className = "alert alert-success";
    alertError.classList.remove("hidden");
  }
  if (btnLogin) { btnLogin.textContent = "Accediendo..."; btnLogin.disabled = true; }
}

function mostrarCargando(estado) {
  const btnLogin = document.getElementById("btnLogin");
  if (!btnLogin) return;
  if (estado) {
    btnLogin.innerHTML = '<span class="spinner"></span> Verificando...';
    btnLogin.disabled = true;
  } else {
    btnLogin.textContent = "Iniciar Sesión";
    btnLogin.disabled = false;
  }
}

function alternarVisibilidadPassword() {
  const inputPassword = document.getElementById("inputPassword");
  const togglePass    = document.getElementById("togglePass");
  if (!inputPassword || !togglePass) return;
  const esPassword = inputPassword.type === "password";
  inputPassword.type   = esPassword ? "text" : "password";
  togglePass.textContent = esPassword ? "🙈" : "👁️";
}

function redirigirPorRol(rol) {
  window.location.href = rol === "admin" ? "admin.html" : "index.html";
}

function escapeHtml(texto) {
  if (!texto) return "";
  return texto.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;
