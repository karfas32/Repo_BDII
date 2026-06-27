/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: main.js
   Descripción: Lógica del portal del estudiante (index.html).
                Maneja la visualización progresiva de semanas,
                detalle de contenido y verificación de sesión.
   ============================================================ */

/* ── 1. CONSTANTES Y CONFIGURACIÓN ──────────────────────────*/
const SESSION_KEY    = "upla_session";
const STORAGE_KEY    = "upla_semanas";    // Clave en localStorage donde vive el contenido
const SEMANAS_TOTAL  = 16;               // Total de semanas del curso

/* ── 2. ESTADO DE LA APLICACIÓN ──────────────────────────── */
// Objeto que mantiene el estado actual de la vista
const estado = {
  sesion:        null,    // Datos del usuario activo
  semanas:       [],      // Arreglo de las 16 semanas
  semanaActiva:  null,    // Semana seleccionada para ver detalle
  vistaActual:   "grid"  // "grid" | "detalle"
};

/* ── 3. INICIALIZACIÓN ────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  inicializar();
});

/**
 * inicializar
 * Punto de entrada: carga sesión, datos y renderiza la UI.
 */
function inicializar() {
  cargarSesion();
  cargarSemanas();
  renderizarNavbar();
  renderizarEstadisticas();
  renderizarGrillaSemanas();
  configurarEventos();
}

/* ── 4. GESTIÓN DE SESIÓN ────────────────────────────────── */

/**
 * cargarSesion
 * Obtiene los datos de sesión del sessionStorage.
 * El portal es accesible sin login, pero muestra info si hay sesión.
 */
function cargarSesion() {
  const datos = sessionStorage.getItem(SESSION_KEY);
  estado.sesion = datos ? JSON.parse(datos) : null;
}

/* ── 5. CARGA DE DATOS DE SEMANAS ────────────────────────── */

/**
 * cargarSemanas
 * Lee las semanas desde localStorage (donde el admin las guarda).
 * Si no hay datos, genera una estructura vacía de 16 semanas.
 */
function cargarSemanas() {
  const guardado = localStorage.getItem(STORAGE_KEY);

  if (guardado) {
    // Datos existentes: parsear y usar
    estado.semanas = JSON.parse(guardado);
  } else {
    // Primera vez: inicializar 16 semanas vacías
    estado.semanas = generarSemanasVacias();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado.semanas));
  }
}

/**
 * generarSemanasVacias
 * Crea el arreglo base de 16 semanas sin contenido.
 * @returns {Array} Arreglo de 16 objetos semana
 */
function generarSemanasVacias() {
  const semanas = [];
  for (let i = 1; i <= SEMANAS_TOTAL; i++) {
    semanas.push({
      numero:      i,
      titulo:      "",
      descripcion: "",
      contenido:   "",
      publicada:   false,        // false = bloqueada para el estudiante
      fechaActualizacion: null
    });
  }
  return semanas;
}

/* ── 6. RENDERIZADO DE NAVBAR ─────────────────────────────── */

/**
 * renderizarNavbar
 * Actualiza el área de usuario en la barra de navegación.
 */
function renderizarNavbar() {
  const navUser = document.getElementById("navUser");
  if (!navUser) return;

  if (estado.sesion) {
    // Hay sesión activa: mostrar nombre y botón de salir
    const inicial = estado.sesion.nombre.charAt(0).toUpperCase();
    navUser.innerHTML = `
      <div class="navbar-user">
        <div class="navbar-avatar">${inicial}</div>
        <span>${estado.sesion.nombre}</span>
        ${estado.sesion.rol === "admin"
          ? `<a href="admin.html" class="btn btn-secondary btn-sm">Panel Admin</a>`
          : ""}
        <button onclick="cerrarSesion()" class="btn btn-secondary btn-sm">Salir</button>
      </div>
    `;
  } else {
    // Sin sesión: mostrar botón de login
    navUser.innerHTML = `
      <a href="login.html" class="btn btn-primary btn-sm">Iniciar Sesión</a>
    `;
  }
}

/* ── 7. ESTADÍSTICAS ─────────────────────────────────────── */

/**
 * renderizarEstadisticas
 * Muestra métricas en la sección hero (semanas publicadas, etc.)
 */
function renderizarEstadisticas() {
  const publicadas = estado.semanas.filter(s => s.publicada).length;

  const elPublicadas = document.getElementById("statPublicadas");
  const elTotal      = document.getElementById("statTotal");

  if (elPublicadas) elPublicadas.textContent = publicadas;
  if (elTotal)      elTotal.textContent      = SEMANAS_TOTAL;
}

/* ── 8. GRILLA DE SEMANAS ────────────────────────────────── */

/**
 * renderizarGrillaSemanas
 * Genera y renderiza las 16 tarjetas de semanas en el DOM.
 */
function renderizarGrillaSemanas() {
  const contenedor = document.getElementById("semanasGrid");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  estado.semanas.forEach(function (semana, indice) {
    const tarjeta = crearTarjetaSemana(semana);
    // Animación escalonada: cada tarjeta aparece con un pequeño delay
    tarjeta.style.animationDelay = (indice * 0.05) + "s";
    contenedor.appendChild(tarjeta);
  });
}

/**
 * crearTarjetaSemana
 * Construye el elemento HTML de una tarjeta de semana.
 * @param {Object} semana - Datos de la semana
 * @returns {HTMLElement} Elemento div de la tarjeta
 */
function crearTarjetaSemana(semana) {
  const div = document.createElement("div");
  div.className = "week-card" + (semana.publicada ? "" : " locked");
  div.dataset.semana = semana.numero;

  if (semana.publicada) {
    // Semana con contenido disponible
    div.innerHTML = `
      <div class="week-number">Semana ${semana.numero}</div>
      <div class="week-title">${semana.titulo || "Sin título"}</div>
      <div class="week-description">${semana.descripcion || "Sin descripción disponible."}</div>
      <div class="week-footer">
        <span class="badge badge-success">✓ Disponible</span>
        <span style="font-size:0.82rem; color:var(--text-accent);">Ver contenido →</span>
      </div>
    `;
    // Evento click: abrir detalle
    div.addEventListener("click", function () {
      mostrarDetalleSemana(semana.numero);
    });
  } else {
    // Semana bloqueada (sin publicar)
    div.innerHTML = `
      <div class="week-number">Semana ${semana.numero}</div>
      <div class="week-title" style="color:var(--text-muted)">
        ${semana.titulo || "Próximamente..."}
      </div>
      <div class="week-description" style="color:var(--text-muted)">
        Esta semana aún no ha sido publicada por el docente.
      </div>
      <div class="week-footer">
        <span class="badge badge-muted">🔒 No disponible</span>
      </div>
    `;
  }

  return div;
}

/* ── 9. VISTA DE DETALLE DE SEMANA ───────────────────────── */

/**
 * mostrarDetalleSemana
 * Cambia la vista de grilla a la vista de detalle de una semana.
 * @param {number} numero - Número de la semana a mostrar
 */
function mostrarDetalleSemana(numero) {
  const semana = estado.semanas.find(s => s.numero === numero);
  if (!semana || !semana.publicada) return;

  estado.semanaActiva = semana;
  estado.vistaActual  = "detalle";

  // Ocultar grilla, mostrar detalle
  const grilla  = document.getElementById("vistaGrid");
  const detalle = document.getElementById("vistaDetalle");

  if (grilla)  grilla.classList.add("hidden");
  if (detalle) {
    detalle.classList.remove("hidden");
    renderizarDetalle(semana);
    // Scroll al inicio para que el usuario vea el contenido
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * renderizarDetalle
 * Llena el área de detalle con el contenido de la semana seleccionada.
 * @param {Object} semana - Datos de la semana
 */
function renderizarDetalle(semana) {
  const titulo      = document.getElementById("detalleTitulo");
  const subtitulo   = document.getElementById("detalleSubtitulo");
  const contenido   = document.getElementById("detalleContenido");
  const fecha       = document.getElementById("detalleFecha");

  if (titulo)    titulo.textContent    = semana.titulo;
  if (subtitulo) subtitulo.textContent = `Semana ${semana.numero} — ${semana.descripcion}`;
  if (contenido) contenido.textContent = semana.contenido || "No hay contenido disponible aún.";

  if (fecha && semana.fechaActualizacion) {
    const fechaFormato = new Date(semana.fechaActualizacion).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric"
    });
    fecha.textContent = "Última actualización: " + fechaFormato;
  }
}

/**
 * volverAGrilla
 * Regresa a la vista de grilla desde el detalle.
 * Se usa en el botón "← Volver".
 */
function volverAGrilla() {
  estado.semanaActiva = null;
  estado.vistaActual  = "grid";

  const grilla  = document.getElementById("vistaGrid");
  const detalle = document.getElementById("vistaDetalle");

  if (grilla)  grilla.classList.remove("hidden");
  if (detalle) detalle.classList.add("hidden");

  // Refresca la grilla por si cambió algún dato
  renderizarGrillaSemanas();
  renderizarEstadisticas();
}

// Hacer la función global para usarla desde el HTML
window.volverAGrilla = volverAGrilla;

/* ── 10. CERRAR SESIÓN (global) ─────────────────────────── */
function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

/* ── 11. CONFIGURAR EVENTOS ADICIONALES ──────────────────── */

/**
 * configurarEventos
 * Configura listeners que no van directo en el HTML.
 */
function configurarEventos() {
  // Escuchar cambios en localStorage por si el admin actualiza desde otra pestaña
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) {
      cargarSemanas();
      if (estado.vistaActual === "grid") {
        renderizarGrillaSemanas();
        renderizarEstadisticas();
      }
    }
  });
}
