/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: login.js
   Descripción: Lógica de autenticación y manejo de sesión.
                Simula un sistema de login con usuarios predefinidos
                y gestión de roles mediante sessionStorage.
   ============================================================ */

/* ── 1. BASE DE DATOS DE USUARIOS (simulada) ─────────────────
   En un proyecto real, esta validación ocurriría en el servidor.
   Para propósitos académicos, los datos están en el cliente.
   ─────────────────────────────────────────────────────────── */
const USUARIOS = [
  {
    id: 1,
    usuario:  "admin",
    password: "upla2024",
    nombre:   "Administrador UPLA",
    rol:      "admin",
    email:    "admin@upla.edu.pe"
  },
  {
    id: 2,
    usuario:  "estudiante",
    password: "123456",
    nombre:   "Juan Pérez",
    rol:      "usuario",
    email:    "jperez@upla.edu.pe"
  },
  {
    id: 3,
    usuario:  "maria",
    password: "maria123",
    nombre:   "María García",
    rol:      "usuario",
    email:    "mgarcia@upla.edu.pe"
  }
];

/* ── 2. CLAVE DE SESIÓN en sessionStorage ────────────────────
   Usamos sessionStorage para que la sesión expire al cerrar
   el navegador (más seguro que localStorage para credenciales).
   ─────────────────────────────────────────────────────────── */
const SESSION_KEY = "upla_session";

/* ── 3. REFERENCIAS A ELEMENTOS DEL DOM ──────────────────────
   Guardamos referencias para no buscarlos repetidamente.
   ─────────────────────────────────────────────────────────── */
const loginForm     = document.getElementById("loginForm");
const inputUsuario  = document.getElementById("inputUsuario");
const inputPassword = document.getElementById("inputPassword");
const btnLogin      = document.getElementById("btnLogin");
const alertError    = document.getElementById("alertError");
const togglePass    = document.getElementById("togglePass");

/* ── 4. INICIALIZACIÓN ───────────────────────────────────────
   Al cargar la página, verificamos si ya hay sesión activa.
   Si el usuario ya está autenticado, lo redirigimos.
   ─────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  verificarSesionActiva();
  configurarEventos();
});

/**
 * verificarSesionActiva
 * Si ya hay una sesión guardada, redirige automáticamente
 * al panel correspondiente según el rol.
 */
function verificarSesionActiva() {
  const sesion = obtenerSesion();
  if (sesion) {
    redirigirPorRol(sesion.rol);
  }
}

/* ── 5. CONFIGURAR EVENTOS ───────────────────────────────────*/

/**
 * configurarEventos
 * Asigna los listeners a los elementos interactivos del formulario.
 */
function configurarEventos() {

  // Evento: envío del formulario de login
  if (loginForm) {
    loginForm.addEventListener("submit", manejarLogin);
  }

  // Evento: mostrar/ocultar contraseña
  if (togglePass) {
    togglePass.addEventListener("click", alternarVisibilidadPassword);
  }

  // Evento: limpiar errores al escribir
  if (inputUsuario)  inputUsuario.addEventListener("input", ocultarError);
  if (inputPassword) inputPassword.addEventListener("input", ocultarError);
}

/* ── 6. MANEJO DEL LOGIN ──────────────────────────────────── */

/**
 * manejarLogin
 * Función principal que procesa el formulario de inicio de sesión.
 * @param {Event} e - Evento submit del formulario
 */
function manejarLogin(e) {
  // Prevenimos el comportamiento por defecto (recarga de página)
  e.preventDefault();

  // Obtenemos y limpiamos los valores ingresados
  const usuario  = inputUsuario.value.trim().toLowerCase();
  const password = inputPassword.value;

  // Validamos que los campos no estén vacíos
  if (!usuario || !password) {
    mostrarError("Por favor, completa todos los campos.");
    return;
  }

  // Simulamos un pequeño delay como si fuera una petición al servidor
  mostrarCargando(true);

  setTimeout(function () {
    const resultado = autenticar(usuario, password);
    mostrarCargando(false);

    if (resultado.exito) {
      // Guardamos la sesión y redirigimos
      guardarSesion(resultado.usuario);
      mostrarExito(resultado.usuario);

      // Pequeña pausa antes de redirigir (para que el usuario vea el mensaje)
      setTimeout(function () {
        redirigirPorRol(resultado.usuario.rol);
      }, 800);

    } else {
      mostrarError(resultado.mensaje);
    }
  }, 600);
}

/**
 * autenticar
 * Valida las credenciales contra la base de datos de usuarios.
 * @param {string} usuario  - Nombre de usuario ingresado
 * @param {string} password - Contraseña ingresada
 * @returns {Object} { exito: boolean, usuario?: Object, mensaje?: string }
 */
function autenticar(usuario, password) {
  // Buscamos el usuario en el arreglo de usuarios registrados
  const encontrado = USUARIOS.find(function (u) {
    return u.usuario === usuario && u.password === password;
  });

  if (encontrado) {
    // Devolvemos solo los datos necesarios (sin contraseña)
    return {
      exito: true,
      usuario: {
        id:     encontrado.id,
        nombre: encontrado.nombre,
        usuario: encontrado.usuario,
        rol:    encontrado.rol,
        email:  encontrado.email
      }
    };
  }

  return {
    exito:   false,
    mensaje: "Usuario o contraseña incorrectos. Verifica tus credenciales."
  };
}

/* ── 7. GESTIÓN DE SESIÓN ────────────────────────────────────*/

/**
 * guardarSesion
 * Almacena los datos del usuario autenticado en sessionStorage.
 * @param {Object} usuario - Datos del usuario a guardar
 */
function guardarSesion(usuario) {
  const datosSesion = {
    ...usuario,
    fechaLogin: new Date().toISOString()
  };
  // JSON.stringify convierte el objeto a texto para almacenarlo
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(datosSesion));
}

/**
 * obtenerSesion
 * Recupera los datos de sesión del sessionStorage.
 * @returns {Object|null} Datos de sesión o null si no hay sesión
 */
function obtenerSesion() {
  const datos = sessionStorage.getItem(SESSION_KEY);
  // JSON.parse convierte el texto de vuelta a objeto
  return datos ? JSON.parse(datos) : null;
}

/**
 * cerrarSesion
 * Elimina la sesión activa y redirige al login.
 * Se exporta como global para poder usarla desde otros archivos.
 */
function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// Hacemos cerrarSesion global para usarla en HTML o admin.js
window.cerrarSesion = cerrarSesion;

/* ── 8. REDIRECCIÓN POR ROL ──────────────────────────────── */

/**
 * redirigirPorRol
 * Envía al usuario a la página correcta según su rol.
 * @param {string} rol - "admin" o "usuario"
 */
function redirigirPorRol(rol) {
  if (rol === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "index.html";
  }
}

/* ── 9. FUNCIONES DE UI ───────────────────────────────────── */

/**
 * mostrarError
 * Muestra un mensaje de error en la interfaz.
 * @param {string} mensaje - Texto del error a mostrar
 */
function mostrarError(mensaje) {
  if (alertError) {
    alertError.textContent = mensaje;
    alertError.classList.remove("hidden");
    // Animación de shake para llamar la atención
    alertError.style.animation = "none";
    alertError.offsetHeight; // reflow para reiniciar animación
    alertError.style.animation = "shakeX 0.4s ease";
  }
  // Marcamos el campo de contraseña como erróneo
  if (inputPassword) {
    inputPassword.style.borderColor = "var(--error)";
  }
}

/**
 * ocultarError
 * Limpia el mensaje de error.
 */
function ocultarError() {
  if (alertError) {
    alertError.classList.add("hidden");
  }
  if (inputPassword) {
    inputPassword.style.borderColor = "";
  }
}

/**
 * mostrarExito
 * Muestra mensaje de bienvenida al autenticar correctamente.
 * @param {Object} usuario - Datos del usuario autenticado
 */
function mostrarExito(usuario) {
  if (alertError) {
    alertError.textContent  = `✓ Bienvenido, ${usuario.nombre}. Redirigiendo...`;
    alertError.className    = "alert alert-success";
    alertError.classList.remove("hidden");
  }
  if (btnLogin) {
    btnLogin.textContent = "Accediendo...";
    btnLogin.disabled    = true;
  }
}

/**
 * mostrarCargando
 * Activa o desactiva el estado de carga del botón.
 * @param {boolean} estado - true para activar carga
 */
function mostrarCargando(estado) {
  if (!btnLogin) return;
  if (estado) {
    btnLogin.innerHTML  = '<span class="spinner"></span> Verificando...';
    btnLogin.disabled   = true;
  } else {
    btnLogin.innerHTML  = 'Iniciar Sesión';
    btnLogin.disabled   = false;
  }
}

/**
 * alternarVisibilidadPassword
 * Muestra u oculta la contraseña en el input.
 */
function alternarVisibilidadPassword() {
  if (!inputPassword || !togglePass) return;

  const esPassword = inputPassword.type === "password";
  inputPassword.type = esPassword ? "text" : "password";
  togglePass.textContent = esPassword ? "🙈" : "👁️";
}
