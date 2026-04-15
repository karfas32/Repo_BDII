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
async function cargarSemanas() {
    const { data, error } = await window.supabaseClient
        .from('semanas')
        .select('*')
        .eq('publicado', true) // Solo lo que el admin aprobó
        .order('numero_semana', { ascending: true });

    if (error) {
        console.error("Error de conexión");
        return;
    }

    estado.semanas = data;
    renderizarGrillaSemanas();
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

/* ── 8. RENDERIZADO POR UNIDADES ─────────────────────────── */

/**
 * DEFINICIÓN DE LAS 4 UNIDADES
 * Cada unidad agrupa 4 semanas consecutivas.
 * Los números de semana corresponden al campo "numero" de cada semana.
 */
const UNIDADES = [
  {
    numero:      1,
    nombre:      "Unidad I",
    descripcion: "Fundamentos y Modelo Relacional",
    semanas:     [1, 2, 3, 4]
  },
  {
    numero:      2,
    nombre:      "Unidad II",
    descripcion: "Diseño Avanzado de Bases de Datos",
    semanas:     [5, 6, 7, 8]
  },
  {
    numero:      3,
    nombre:      "Unidad III",
    descripcion: "Programación en Base de Datos",
    semanas:     [9, 10, 11, 12]
  },
  {
    numero:      4,
    nombre:      "Unidad IV",
    descripcion: "Administración y Seguridad",
    semanas:     [13, 14, 15, 16]
  }
];

/**
 * renderizarGrillaSemanas
 * Genera los 4 bloques de unidad, cada uno con su grilla de 4 semanas.
 * Reemplaza el antiguo renderizado plano de 16 tarjetas.
 */
function renderizarGrillaSemanas() {
  const contenedor = document.getElementById("semanasGrid");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  // Contador global para la animación escalonada entre todas las tarjetas
  let indiceGlobal = 0;

  UNIDADES.forEach(function (unidad) {
    // ── Bloque contenedor de la unidad ──
    const bloque = document.createElement("div");
    bloque.className = "unidad-bloque";
    bloque.setAttribute("role", "group");
    bloque.setAttribute("aria-label", unidad.nombre);

    // Encabezado de la unidad
    bloque.innerHTML = `
      <div class="unidad-header">
        <div class="unidad-numero-badge">Unidad ${unidad.numero}</div>
        <div class="unidad-info">
          <h3 class="unidad-titulo">${unidad.nombre}</h3>
          <p class="unidad-descripcion">${unidad.descripcion}</p>
        </div>
        <div class="unidad-progress">
          <span id="progreso-unidad-${unidad.numero}" class="badge badge-muted">0 / 4</span>
        </div>
      </div>
    `;

    // Grilla de las 4 semanas de esta unidad
    const grilla = document.createElement("div");
    grilla.className = "weeks-grid";

    unidad.semanas.forEach(function (numSemana) {
      const semana  = estado.semanas.find(s => s.numero === numSemana);
      if (!semana) return;

      const tarjeta = crearTarjetaSemana(semana);
      tarjeta.style.animationDelay = (indiceGlobal * 0.05) + "s";
      indiceGlobal++;
      grilla.appendChild(tarjeta);
    });

    bloque.appendChild(grilla);
    contenedor.appendChild(bloque);

    // Actualizar el badge de progreso de la unidad
    actualizarProgresoUnidad(unidad);
  });
}

/**
 * actualizarProgresoUnidad
 * Actualiza el badge "X / 4" de semanas publicadas por unidad.
 * @param {Object} unidad - Objeto de la unidad
 */
function actualizarProgresoUnidad(unidad) {
  const publicadasEnUnidad = unidad.semanas.filter(function (numSemana) {
    const semana = estado.semanas.find(s => s.numero === numSemana);
    return semana && semana.publicada;
  }).length;

  const badge = document.getElementById("progreso-unidad-" + unidad.numero);
  if (!badge) return;

  badge.textContent = publicadasEnUnidad + " / 4";

  // Cambiar color del badge según el progreso
  badge.className = "badge";
  if (publicadasEnUnidad === 0)  badge.classList.add("badge-muted");
  else if (publicadasEnUnidad < 4) badge.classList.add("badge-warning");
  else                             badge.classList.add("badge-success");
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
 * Llena el área de detalle con el contenido y los PDFs adjuntos.
 * @param {Object} semana - Datos de la semana
 */
function renderizarDetalle(semana) {
  const titulo    = document.getElementById("detalleTitulo");
  const subtitulo = document.getElementById("detalleSubtitulo");
  const contenido = document.getElementById("detalleContenido");
  const fecha     = document.getElementById("detalleFecha");

  // Determinar a qué unidad pertenece esta semana
  const unidad = UNIDADES.find(function (u) {
    return u.semanas.includes(semana.numero);
  });
  const etiquetaUnidad = unidad ? unidad.nombre + " — " + unidad.descripcion : "";

  if (titulo)    titulo.textContent    = semana.titulo;
  if (subtitulo) subtitulo.textContent =
    `${etiquetaUnidad} · Semana ${semana.numero} · ${semana.descripcion}`;
  if (contenido) contenido.textContent = semana.contenido || "No hay contenido disponible aún.";

  if (fecha && semana.fechaActualizacion) {
    const fechaFormato = new Date(semana.fechaActualizacion).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric"
    });
    fecha.textContent = "Última actualización: " + fechaFormato;
  }

  // Renderizar la sección de PDFs
  renderizarPdfsDetalle(semana.pdfs || []);
}

/* ── 10. VISOR DE PDFs (vista estudiante) ────────────────── */

/**
 * renderizarPdfsDetalle
 * Muestra u oculta la sección de PDFs y genera la lista de archivos
 * con sus botones de "Ver" y "Descargar".
 * @param {Array} pdfs - Arreglo de objetos {nombre, tamaño, base64}
 */
function renderizarPdfsDetalle(pdfs) {
  const seccion = document.getElementById("detallePdfSection");
  const lista   = document.getElementById("detallePdfLista");
  if (!seccion || !lista) return;

  // Si no hay PDFs, ocultar la sección completa
  if (!pdfs || pdfs.length === 0) {
    seccion.classList.add("hidden");
    return;
  }

  seccion.classList.remove("hidden");
  lista.innerHTML = "";

  // Asegurarnos de que el visor empiece cerrado
  cerrarVisorPdf();

  pdfs.forEach(function (pdf, indice) {
    const item = document.createElement("div");
    item.className = "pdf-item-usuario";
    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">📄</span>
        <div>
          <div class="pdf-item-nombre">${pdf.nombre}</div>
          <div class="pdf-item-tamaño">${formatearBytesUsuario(pdf.tamaño)}</div>
        </div>
      </div>
      <div class="pdf-item-acciones">
        <button
          onclick="abrirVisorPdf(${indice})"
          class="btn btn-primary btn-sm"
          aria-label="Ver el PDF ${pdf.nombre}"
        >👁️ Ver</button>
        <a
          href="${pdf.base64}"
          download="${pdf.nombre}"
          class="btn btn-secondary btn-sm"
          aria-label="Descargar el PDF ${pdf.nombre}"
        >⬇️ Descargar</a>
      </div>
    `;
    lista.appendChild(item);
  });
}

/**
 * abrirVisorPdf
 * Carga el PDF seleccionado en el iframe embebido.
 * @param {number} indice - Índice del PDF en el arreglo de la semana activa
 */
function abrirVisorPdf(indice) {
  const semana = estado.semanaActiva;
  if (!semana || !semana.pdfs || !semana.pdfs[indice]) return;

  const pdf    = semana.pdfs[indice];
  const frame  = document.getElementById("pdfVisorFrame");
  const wrapper = document.getElementById("pdfViewerWrapper");
  const nombre  = document.getElementById("pdfViewerNombre");
  const descBtn = document.getElementById("pdfDescargarBtn");

  if (!frame || !wrapper) return;

  // Cargar el base64 en el iframe
  frame.src = pdf.base64;

  // Configurar el botón de descarga
  if (descBtn) {
    descBtn.href     = pdf.base64;
    descBtn.download = pdf.nombre;
  }

  // Mostrar el nombre del archivo
  if (nombre) nombre.textContent = pdf.nombre;

  // Mostrar el visor con animación
  wrapper.classList.remove("hidden");

  // Hacer scroll suave al visor
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}
window.abrirVisorPdf = abrirVisorPdf;

/**
 * cerrarVisorPdf
 * Cierra el iframe del visor y limpia su contenido.
 */
function cerrarVisorPdf() {
  const wrapper = document.getElementById("pdfViewerWrapper");
  const frame   = document.getElementById("pdfVisorFrame");
  if (wrapper) wrapper.classList.add("hidden");
  if (frame)   frame.src = "";
}
window.cerrarVisorPdf = cerrarVisorPdf;

/**
 * formatearBytesUsuario
 * Convierte bytes a KB / MB legible para el estudiante.
 * @param {number} bytes
 * @returns {string}
 */
function formatearBytesUsuario(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ── 11. REGRESAR A GRILLA ───────────────────────────────── */
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

/* ── 12. CERRAR SESIÓN (global) ─────────────────────────── */
function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

/* ── 13. CONFIGURAR EVENTOS ADICIONALES ──────────────────── */

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
