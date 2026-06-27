/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: login.js
   Descripción: Autenticación con Supabase (contraseña en texto plano)
   ============================================================ */

const SESSION_KEY = "upla_session";

document.addEventListener("DOMContentLoaded", function () {
  verificarSesionActiva();
  configurarEventos();
});

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

function configurarEventos() {
  const form     = document.getElementById("loginForm");
  const toggle   = document.getElementById("togglePass");
  const usuario  = document.getElementById("inputUsuario");
  const password = document.getElementById("inputPassword");

  if (form)     form.addEventListener("submit", manejarLogin);
  if (toggle)   toggle.addEventListener("click", alternarVisibilidadPassword);
  if (usuario)  usuario.addEventListener("input", ocultarError);
  if (password) password.addEventListener("input", ocultarError);
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
    if (!window.supabaseClient) throw new Error("Supabase no inicializado.");

    // Buscar usuario comparando contraseña en texto plano
    const { data, error } = await window.supabaseClient
      .from("usuarios")
      .select("id, nombre, usuario, rol, password_hash")
      .eq("usuario", usuario)
      .eq("password_hash", password)   // columna reutilizada para texto plano
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ Error Supabase:", error.message);
      mostrarError("Error de conexión. Intenta de nuevo.");
      mostrarCargando(false);
      return;
    }

    if (!data) {
      mostrarError("Usuario o contraseña incorrectos.");
      mostrarCargando(false);
      return;
    }

    guardarSesionYRedirigir(data);

  } catch (err) {
    console.error("❌ Error:", err);
    mostrarError("Error inesperado. Intenta de nuevo.");
    mostrarCargando(false);
  }
}

function guardarSesionYRedirigir(usuario) {
  const sesion = {
    id:      usuario.id,
    nombre:  usuario.nombre,
    usuario: usuario.usuario,
    rol:     usuario.rol
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  mostrarExito(sesion);
  setTimeout(() => redirigirPorRol(sesion.rol), 800);
}

// ── UI helpers ────────────────────────────────────────────────
function mostrarError(mensaje) {
  const alertEl = document.getElementById("alertError");
  const passEl  = document.getElementById("inputPassword");
  if (alertEl) {
    alertEl.textContent = mensaje;
    alertEl.className   = "alert alert-error";
    alertEl.classList.remove("hidden");
    alertEl.style.animation = "none";
    void alertEl.offsetWidth;
    alertEl.style.animation = "shakeX 0.4s ease";
  }
  if (passEl) passEl.style.borderColor = "var(--error)";
}

function ocultarError() {
  document.getElementById("alertError")?.classList.add("hidden");
  const passEl = document.getElementById("inputPassword");
  if (passEl) passEl.style.borderColor = "";
}

function mostrarExito(usuario) {
  const alertEl  = document.getElementById("alertError");
  const btnLogin = document.getElementById("btnLogin");
  if (alertEl) {
    alertEl.textContent = `✓ Bienvenido, ${escapeHtml(usuario.nombre)}. Redirigiendo...`;
    alertEl.className   = "alert alert-success";
    alertEl.classList.remove("hidden");
  }
  if (btnLogin) { btnLogin.textContent = "Accediendo..."; btnLogin.disabled = true; }
}

function mostrarCargando(estado) {
  const btn = document.getElementById("btnLogin");
  if (!btn) return;
  if (estado) {
    btn.innerHTML = '<span class="spinner"></span> Verificando...';
    btn.disabled  = true;
  } else {
    btn.textContent = "Iniciar Sesión";
    btn.disabled    = false;
  }
}

function alternarVisibilidadPassword() {
  const passEl   = document.getElementById("inputPassword");
  const toggleEl = document.getElementById("togglePass");
  if (!passEl || !toggleEl) return;
  const esPass       = passEl.type === "password";
  passEl.type        = esPass ? "text" : "password";
  toggleEl.textContent = esPass ? "🙈" : "👁️";
}

function redirigirPorRol(rol) {
  window.location.href = rol === "admin" ? "admin.html" : "index.html";
}

function escapeHtml(texto) {
  if (!texto) return "";
  return String(texto).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;
