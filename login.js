/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: login.js
   Descripción: Autenticación con Supabase
   ============================================================ */

const SESSION_KEY = "upla_session";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔵 login.js cargado correctamente");
  verificarSesionActiva();
  configurarEventos();
});

async function verificarSesionActiva() {
  const sesion = obtenerSesion();
  if (sesion) {
    console.log("🔵 Sesión activa encontrada, redirigiendo...");
    redirigirPorRol(sesion.rol);
  }
}

function obtenerSesion() {
  const datos = sessionStorage.getItem(SESSION_KEY);
  return datos ? JSON.parse(datos) : null;
}

function configurarEventos() {
  const loginForm = document.getElementById("loginForm");
  const togglePass = document.getElementById("togglePass");
  const inputUsuario = document.getElementById("inputUsuario");
  const inputPassword = document.getElementById("inputPassword");

  if (loginForm) {
    loginForm.addEventListener("submit", manejarLogin);
    console.log("🔵 Evento submit configurado");
  } else {
    console.error("🔴 No se encontró el formulario loginForm");
  }

  if (togglePass) {
    togglePass.addEventListener("click", alternarVisibilidadPassword);
  }

  if (inputUsuario) inputUsuario.addEventListener("input", ocultarError);
  if (inputPassword) inputPassword.addEventListener("input", ocultarError);
}

async function manejarLogin(e) {
  e.preventDefault();
  console.log("🔵 Intentando iniciar sesión...");

  const usuario = document.getElementById("inputUsuario").value.trim();
  const password = document.getElementById("inputPassword").value;
  const btnLogin = document.getElementById("btnLogin");
  const alertError = document.getElementById("alertError");

  if (!usuario || !password) {
    mostrarError("Por favor, completa todos los campos.");
    return;
  }

  console.log(`🔵 Usuario ingresado: ${usuario}`);

  mostrarCargando(true);

  try {
    let usuarioEncontrado = null;

    // Verificación local (sin Supabase)
    if (usuario === "admin" && password === "upla2024") {
      usuarioEncontrado = { id: 1, nombre: "Admin", usuario: "admin", rol: "admin" };
    } else if (usuario === "estudiante" && password === "123456") {
      usuarioEncontrado = { id: 2, nombre: "Estudiante", usuario: "estudiante", rol: "estudiante" };
    }

    // Verificar si se encontró el usuario
    if (!usuarioEncontrado) {
      console.log("🔴 Usuario no encontrado o contraseña incorrecta:", usuario);
      mostrarError("Usuario o contraseña incorrectos.");
      mostrarCargando(false);
      return;
    }

    console.log("🔵 Usuario validado localmente:", usuarioEncontrado.usuario, "Rol:", usuarioEncontrado.rol);
    console.log("🔵 Autenticación exitosa!");

    // Guardar sesión
    const sesion = {
      id: usuarioEncontrado.id,
      nombre: usuarioEncontrado.nombre,
      usuario: usuarioEncontrado.usuario,
      rol: usuarioEncontrado.rol
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
    console.log("🔵 Sesión guardada:", sesion);

    mostrarExito(sesion);

    setTimeout(() => {
      console.log("🔵 Redirigiendo a:", sesion.rol === "admin" ? "admin.html" : "index.html");
      redirigirPorRol(sesion.rol);
    }, 800);

  } catch (error) {
    console.error("🔴 Error de autenticación:", error);
    mostrarError("Error en la verificación local.");
    mostrarCargando(false);
  }
}

function mostrarError(mensaje) {
  console.log("🔴 Mostrando error:", mensaje);
  const alertError = document.getElementById("alertError");
  const inputPassword = document.getElementById("inputPassword");
  if (alertError) {
    alertError.textContent = mensaje;
    alertError.classList.remove("hidden");
    alertError.style.animation = "shakeX 0.4s ease";
  }
  if (inputPassword) {
    inputPassword.style.borderColor = "var(--error)";
  }
}

function ocultarError() {
  const alertError = document.getElementById("alertError");
  const inputPassword = document.getElementById("inputPassword");
  if (alertError) alertError.classList.add("hidden");
  if (inputPassword) inputPassword.style.borderColor = "";
}

function mostrarExito(usuario) {
  console.log("🔵 Mostrando éxito para:", usuario.nombre);
  const alertError = document.getElementById("alertError");
  const btnLogin = document.getElementById("btnLogin");
  if (alertError) {
    alertError.textContent = `✓ Bienvenido, ${usuario.nombre}. Redirigiendo...`;
    alertError.className = "alert alert-success";
    alertError.classList.remove("hidden");
  }
  if (btnLogin) {
    btnLogin.textContent = "Accediendo...";
    btnLogin.disabled = true;
  }
}

function mostrarCargando(estado) {
  const btnLogin = document.getElementById("btnLogin");
  if (!btnLogin) return;
  if (estado) {
    btnLogin.innerHTML = '<span class="spinner"></span> Verificando...';
    btnLogin.disabled = true;
  } else {
    btnLogin.innerHTML = 'Iniciar Sesión';
    btnLogin.disabled = false;
  }
}

function alternarVisibilidadPassword() {
  const inputPassword = document.getElementById("inputPassword");
  const togglePass = document.getElementById("togglePass");
  if (!inputPassword || !togglePass) return;

  const esPassword = inputPassword.type === "password";
  inputPassword.type = esPassword ? "text" : "password";
  togglePass.textContent = esPassword ? "🙈" : "👁️";
}

function redirigirPorRol(rol) {
  if (rol === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "index.html";
  }
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;