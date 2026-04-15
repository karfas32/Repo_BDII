/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: admin.js
   Descripción: Lógica del panel de administración.
                Gestión completa (CRUD) de las 16 semanas:
                crear, editar, publicar y eliminar contenido.
   ============================================================ */

/* ── 1. CONSTANTES ───────────────────────────────────────── */
const SESSION_KEY   = "upla_session";
const STORAGE_KEY   = "upla_semanas";
const SEMANAS_TOTAL = 16;

/* ── 2. ESTADO DEL ADMINISTRADOR ─────────────────────────── */
const estadoAdmin = {
  sesion:          null,    // Datos del admin activo
  semanas:         [],      // Lista de las 16 semanas
  semanaEditando:  null,    // Número de semana en edición
  pdfsEditando:    [],      // PDFs en el editor actual (arreglo temporal)
  vistaActual:     "dashboard"  // "dashboard" | "semanas" | "editor"
};

/* ── 3. INICIALIZACIÓN ────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  inicializarAdmin();
});

/**
 * inicializarAdmin
 * Verifica que sea admin, carga datos y renderiza.
 */
function inicializarAdmin() {
  // Primero: verificar que el usuario sea administrador
  if (!verificarAccesoAdmin()) return;

  cargarSemanas();
  renderizarInfoAdmin();
  mostrarVista("dashboard");
}

/* ── 4. VERIFICACIÓN DE ACCESO ────────────────────────────── */

/**
 * verificarAccesoAdmin
 * Comprueba que haya sesión activa con rol "admin".
 * Si no, redirige al login para proteger el panel.
 * @returns {boolean} true si el acceso es válido
 */
function verificarAccesoAdmin() {
  const datos = sessionStorage.getItem(SESSION_KEY);

  if (!datos) {
    // No hay sesión: redirigir al login
    window.location.href = "login.html";
    return false;
  }

  const sesion = JSON.parse(datos);

  if (sesion.rol !== "admin") {
    // Tiene sesión pero no es admin: redirigir al portal
    window.location.href = "index.html";
    return false;
  }

  estadoAdmin.sesion = sesion;
  return true;
}

/* ── 5. CARGA DE SEMANAS ─────────────────────────────────── */

/**
 * DEFINICIÓN DE LAS 4 UNIDADES
 * Mismo arreglo que en main.js — mantiene coherencia entre admin y portal.
 */
const UNIDADES = [
  { numero: 1, nombre: "Unidad I",   descripcion: "Fundamentos y Modelo Relacional",    semanas: [1,  2,  3,  4]  },
  { numero: 2, nombre: "Unidad II",  descripcion: "Diseño Avanzado de Bases de Datos",  semanas: [5,  6,  7,  8]  },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos",       semanas: [9,  10, 11, 12] },
  { numero: 4, nombre: "Unidad IV",  descripcion: "Administración y Seguridad",          semanas: [13, 14, 15, 16] }
];

/**
 * obtenerUnidadDeSemana
 * Devuelve el objeto Unidad al que pertenece un número de semana.
 * @param {number} numero - Número de semana (1-16)
 * @returns {Object|null}
 */
function obtenerUnidadDeSemana(numero) {
  return UNIDADES.find(u => u.semanas.includes(numero)) || null;
}

/**
 * cargarSemanas
 * Lee las semanas desde localStorage.
 * Las mismas que verá el estudiante en index.html.
 */
async function cargarSemanas() {
    const { data, error } = await window.supabaseClient
        .from('semanas')
        .select('*')
        .order('numero_semana', { ascending: true });

    if (error) {
        mostrarToast("Error al conectar con Supabase", "error");
        console.error(error);
        return;
    }
    
    estadoAdmin.semanas = data;
    renderizarListaSemanas(); // Esta función se encarga de dibujar la tabla
}

/**
 * crearSemanasIniciales
 * @returns {Array} 16 semanas vacías con estructura base
 */
function crearSemanasIniciales() {
  const semanas = [];
  for (let i = 1; i <= SEMANAS_TOTAL; i++) {
    semanas.push({
      numero:             i,
      titulo:             "",
      descripcion:        "",
      contenido:          "",
      publicada:          false,
      fechaActualizacion: null
    });
  }
  return semanas;
}

/**
 * guardarSemanas
 * Persiste el estado actual de semanas en localStorage.
 * Esto actualiza automáticamente la vista del estudiante.
 */
function guardarSemanas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAdmin.semanas));
}

/* ── 6. RENDERIZADO DE INFO DEL ADMIN ───────────────────── */

/**
 * renderizarInfoAdmin
 * Muestra el nombre del admin en la barra de navegación.
 */
function renderizarInfoAdmin() {
  const navAdminNombre = document.getElementById("adminNombre");
  const navAdminRol    = document.getElementById("adminRol");

  if (navAdminNombre && estadoAdmin.sesion) {
    navAdminNombre.textContent = estadoAdmin.sesion.nombre;
  }
  if (navAdminRol) {
    navAdminRol.textContent = "Administrador";
  }
}

/* ── 7. NAVEGACIÓN ENTRE VISTAS ─────────────────────────── */

/**
 * mostrarVista
 * Controla qué sección del panel admin es visible.
 * @param {string} vista - "dashboard" | "semanas" | "editor"
 */
function mostrarVista(vista) {
  estadoAdmin.vistaActual = vista;

  // Ocultar todas las vistas
  const vistas = ["vistaDashboard", "vistaSemanas", "vistaEditor"];
  vistas.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Mostrar la vista solicitada
  const vistaActiva = document.getElementById("vista" + capitalizar(vista));
  if (vistaActiva) vistaActiva.classList.remove("hidden");

  // Marcar el ítem activo en el sidebar
  actualizarSidebar(vista);

  // Renderizar el contenido de la vista
  switch (vista) {
    case "dashboard": renderizarDashboard(); break;
    case "semanas":   renderizarTablaSemanas(); break;
    // "editor" se renderiza al llamar editarSemana()
  }
}

/**
 * actualizarSidebar
 * Marca visualmente el ítem activo en la barra lateral.
 * @param {string} vista - Vista actualmente activa
 */
function actualizarSidebar(vista) {
  document.querySelectorAll(".sidebar-item").forEach(function (item) {
    item.classList.remove("active");
    if (item.dataset.vista === vista) {
      item.classList.add("active");
    }
  });
}

// Exposición global para los onclick del HTML
window.mostrarVista = mostrarVista;

/* ── 8. DASHBOARD ────────────────────────────────────────── */

/**
 * renderizarDashboard
 * Calcula y muestra las métricas del panel principal.
 */
function renderizarDashboard() {
  const publicadas   = estadoAdmin.semanas.filter(s => s.publicada).length;
  const conContenido = estadoAdmin.semanas.filter(s => s.titulo !== "").length;
  const pendientes   = SEMANAS_TOTAL - publicadas;

  // Actualizar KPI cards
  actualizarTexto("kpiPublicadas",   publicadas);
  actualizarTexto("kpiContenido",    conContenido);
  actualizarTexto("kpiPendientes",   pendientes);
  actualizarTexto("kpiTotal",        SEMANAS_TOTAL);

  // Renderizar lista de semanas recientes en el dashboard
  renderizarResumenSemanas();
}

/**
 * renderizarResumenSemanas
 * Muestra un resumen visual de las últimas semanas en el dashboard.
 */
function renderizarResumenSemanas() {
  const contenedor = document.getElementById("resumenSemanas");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  // Mostrar las primeras 8 semanas como resumen
  estadoAdmin.semanas.slice(0, 8).forEach(function (semana) {
    const item = document.createElement("div");
    item.className = "resumen-item";
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      margin-bottom: 6px;
      font-size: 0.86rem;
    `;
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-family:var(--font-mono); color:var(--text-muted); font-size:0.75rem; min-width:26px;">S${String(semana.numero).padStart(2,"0")}</span>
        <span style="color:var(--text-primary);">${semana.titulo || "Sin título"}</span>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <span class="badge ${semana.publicada ? "badge-success" : "badge-muted"}">
          ${semana.publicada ? "Publicada" : "Borrador"}
        </span>
        <button onclick="editarSemana(${semana.numero})" class="btn btn-secondary btn-sm">Editar</button>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

/* ── 9. TABLA DE GESTIÓN DE SEMANAS ─────────────────────── */

/**
 * renderizarTablaSemanas
 * Llena la tabla con todas las 16 semanas agrupadas por unidad.
 */
function renderizarTablaSemanas() {
  const tbody = document.getElementById("tablaSemanasCuerpo");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Iterar por unidades para agrupar visualmente las filas
  UNIDADES.forEach(function (unidad) {

    // Fila separadora de unidad
    const filaUnidad = document.createElement("tr");
    filaUnidad.innerHTML = `
      <td colspan="5" style="
        padding: 10px 16px;
        background: rgba(21,101,192,0.08);
        border-top: 1px solid var(--border-active);
        border-bottom: 1px solid var(--border-color);
      ">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="
            font-family:var(--font-mono);
            font-size:0.7rem;
            font-weight:700;
            color:var(--upla-blue-bright);
            background:rgba(21,101,192,0.15);
            border:1px solid rgba(21,101,192,0.3);
            padding:3px 10px;
            border-radius:20px;
            letter-spacing:0.1em;
          ">${unidad.nombre}</span>
          <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">
            ${unidad.descripcion}
          </span>
        </div>
      </td>
    `;
    tbody.appendChild(filaUnidad);

    // Filas de semanas de esta unidad
    unidad.semanas.forEach(function (numSemana) {
      const semana = estadoAdmin.semanas.find(s => s.numero === numSemana);
      if (!semana) return;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td style="font-family:var(--font-mono); color:var(--text-muted); padding-left:28px;">
          S${String(semana.numero).padStart(2, "0")}
        </td>
        <td>
          <span class="badge badge-blue" style="font-size:0.68rem;">${unidad.nombre}</span>
        </td>
        <td style="color:var(--text-primary); font-weight:500;">
          ${semana.titulo || "<span style='color:var(--text-muted);font-style:italic;'>Sin título</span>"}
        </td>
        <td>
          <span class="badge ${semana.publicada ? "badge-success" : "badge-muted"}">
            ${semana.publicada ? "✓ Publicada" : "○ Borrador"}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button onclick="editarSemana(${semana.numero})" class="btn btn-secondary btn-sm">✏️ Editar</button>
            <button onclick="togglePublicar(${semana.numero})" class="btn btn-sm ${semana.publicada ? "btn-danger" : "btn-primary"}">
              ${semana.publicada ? "Despublicar" : "Publicar"}
            </button>
            <button onclick="limpiarSemana(${semana.numero})" class="btn btn-secondary btn-sm" title="Limpiar contenido">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(fila);
    });
  });
}

/* ── 10. EDITOR DE SEMANA ────────────────────────────────── */

/**
 * editarSemana
 * Abre el editor con los datos de la semana indicada.
 * @param {number} numero - Número de semana a editar
 */
function editarSemana(numero) {
  const semana = estadoAdmin.semanas.find(s => s.numero === numero);
  if (!semana) return;

  estadoAdmin.semanaEditando = numero;

  // Obtener la unidad a la que pertenece esta semana
  const unidad = obtenerUnidadDeSemana(numero);
  const etiqueta = unidad
    ? `${unidad.nombre} · Semana ${numero}`
    : `Semana ${numero}`;

  // Rellenar el formulario con los datos actuales
  actualizarValor("editorNumero",      etiqueta);
  actualizarValor("editorTitulo",      semana.titulo);
  actualizarValor("editorDescripcion", semana.descripcion);
  actualizarValor("editorContenido",   semana.contenido);

  // Mostrar el nombre de la unidad debajo del título del editor
  const subtituloEditor = document.getElementById("editorSubtitulo");
  if (subtituloEditor && unidad) {
    subtituloEditor.textContent = unidad.descripcion;
  }

  // Actualizar el checkbox de publicación
  const checkPublicar = document.getElementById("editorPublicar");
  if (checkPublicar) checkPublicar.checked = semana.publicada;

  // Inicializar la sección de PDFs con los archivos ya guardados
  inicializarEditorPdf(semana);

  // Mostrar el editor
  mostrarVista("editor");
}

// Exposición global
window.editarSemana = editarSemana;

/**
 * guardarEditor
 * Lee los datos del formulario editor y los guarda en localStorage.
 * Valida que los campos obligatorios estén completos.
 */
async function guardarEditor() {
    const num = estadoAdmin.semanaEditando;
    const updateData = {
        titulo: document.getElementById('editorTitulo').value,
        descripcion: document.getElementById('editorDesc').value,
        contenido_html: document.getElementById('editorContenido').value,
        publicado: document.getElementById('editorPublicar').checked,
        archivos_pdf: estadoAdmin.pdfsEditando,
        ultima_modificacion: new Date().toISOString()
    };

    const { error } = await window.supabaseClient
        .from('semanas')
        .update(updateData)
        .eq('numero_semana', num);

    if (error) {
        mostrarToast("No se pudo guardar en la base de datos", "error");
    } else {
        mostrarToast(`¡Semana ${num} actualizada correctamente!`, "success");
        await cargarSemanas(); // Recargar datos
        mostrarVista("semanas");
    }
}

window.guardarEditor = guardarEditor;

/**
 * cancelarEditor
 * Vuelve a la tabla sin guardar cambios.
 */
function cancelarEditor() {
  estadoAdmin.semanaEditando = null;
  mostrarVista("semanas");
}
window.cancelarEditor = cancelarEditor;

/* ── 11. ACCIONES DE SEMANAS ─────────────────────────────── */

/**
 * togglePublicar
 * Alterna el estado de publicación de una semana.
 * @param {number} numero - Número de semana
 */
function togglePublicar(numero) {
  const semana = estadoAdmin.semanas.find(s => s.numero === numero);
  if (!semana) return;

  // No permitir publicar si no tiene contenido mínimo
  if (!semana.publicada && !semana.titulo) {
    mostrarToast("Agrega un título antes de publicar la semana.", "error");
    return;
  }

  semana.publicada          = !semana.publicada;
  semana.fechaActualizacion = new Date().toISOString();

  guardarSemanas();

  const accion = semana.publicada ? "publicada" : "despublicada";
  mostrarToast(`Semana ${numero} ${accion} correctamente.`, semana.publicada ? "success" : "info");

  // Refrescar la tabla
  renderizarTablaSemanas();
}

window.togglePublicar = togglePublicar;

/**
 * limpiarSemana
 * Borra el contenido de una semana tras confirmación.
 * @param {number} numero - Número de semana
 */
function limpiarSemana(numero) {
  // Confirmación antes de borrar
  if (!confirm(`¿Seguro que deseas limpiar el contenido de la Semana ${numero}? Esta acción no se puede deshacer.`)) {
    return;
  }

  const indice = estadoAdmin.semanas.findIndex(s => s.numero === numero);
  if (indice !== -1) {
    estadoAdmin.semanas[indice] = {
      numero,
      titulo:             "",
      descripcion:        "",
      contenido:          "",
      publicada:          false,
      fechaActualizacion: null
    };

    guardarSemanas();
    mostrarToast(`Contenido de Semana ${numero} eliminado.`, "info");
    renderizarTablaSemanas();
  }
}

window.limpiarSemana = limpiarSemana;

/* ── 12. CERRAR SESIÓN ───────────────────────────────────── */
function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

/* ── 13. SISTEMA DE NOTIFICACIONES (Toasts) ──────────────── */

/**
 * mostrarToast
 * Muestra una notificación flotante temporal en la pantalla.
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo    - "success" | "error" | "info"
 */
function mostrarToast(mensaje, tipo) {
  const contenedor = document.getElementById("toastContainer");
  if (!contenedor) return;

  // Crear el elemento toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;

  // Icono según el tipo
  const iconos = { success: "✓", error: "✗", info: "ℹ" };
  const icono  = iconos[tipo] || "•";

  toast.innerHTML = `
    <span style="font-weight:700; font-size:1rem;">${icono}</span>
    <span>${mensaje}</span>
  `;

  contenedor.appendChild(toast);

  // Auto-eliminar después de 3.5 segundos
  setTimeout(function () {
    toast.classList.add("removing");
    setTimeout(function () {
      if (toast.parentNode === contenedor) {
        contenedor.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/* ── 14. GESTIÓN DE PDFs EN EL EDITOR ───────────────────── */

/**
 * inicializarEditorPdf
 * Carga los PDFs ya guardados de la semana en el editor
 * y configura los eventos del dropzone y del input file.
 * @param {Object} semana - Semana que se está editando
 */
function inicializarEditorPdf(semana) {
  // Copiar los PDFs existentes al estado temporal del editor
  estadoAdmin.pdfsEditando = semana.pdfs ? semana.pdfs.slice() : [];

  // Renderizar la lista de PDFs actuales
  renderizarListaPdfAdmin();

  // Configurar el input file (evitar duplicar listeners usando clonación)
  const inputPdf = document.getElementById("inputPdf");
  if (inputPdf) {
    const nuevoInput = inputPdf.cloneNode(true);
    inputPdf.parentNode.replaceChild(nuevoInput, inputPdf);
    nuevoInput.addEventListener("change", manejarSeleccionPdf);
  }

  // Configurar el drag & drop en la dropzone
  const dropZone = document.getElementById("pdfDropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropZone.classList.add("pdf-dropzone-activa");
    });
    dropZone.addEventListener("dragleave", function () {
      dropZone.classList.remove("pdf-dropzone-activa");
    });
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropZone.classList.remove("pdf-dropzone-activa");
      procesarArchivosPdf(e.dataTransfer.files);
    });
  }
}

/**
 * manejarSeleccionPdf
 * Procesa los archivos seleccionados mediante el input file.
 * @param {Event} e - Evento change del input
 */
function manejarSeleccionPdf(e) {
  procesarArchivosPdf(e.target.files);
  // Limpiar el input para permitir volver a seleccionar el mismo archivo
  e.target.value = "";
}

/**
 * procesarArchivosPdf
 * Valida y convierte cada archivo PDF a base64 para almacenarlo.
 * @param {FileList} archivos - Lista de archivos seleccionados
 */
function procesarArchivosPdf(archivos) {
  if (!archivos || archivos.length === 0) return;

  // Procesar cada archivo (puede ser múltiple)
  Array.from(archivos).forEach(function (archivo) {

    // Validar tipo de archivo
    if (archivo.type !== "application/pdf" && !archivo.name.endsWith(".pdf")) {
      mostrarToast(`"${archivo.name}" no es un PDF válido.`, "error");
      return;
    }

    // Validar tamaño (máximo 5 MB = 5 * 1024 * 1024 bytes)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (archivo.size > MAX_BYTES) {
      mostrarToast(`"${archivo.name}" supera el límite de 5 MB.`, "error");
      return;
    }

    // Verificar duplicados por nombre
    const yaExiste = estadoAdmin.pdfsEditando.some(p => p.nombre === archivo.name);
    if (yaExiste) {
      mostrarToast(`"${archivo.name}" ya está adjunto.`, "info");
      return;
    }

    // Leer el archivo y convertirlo a base64
    const lector = new FileReader();
    lector.onload = function (ev) {
      // ev.target.result contiene: "data:application/pdf;base64,XXXXX..."
      estadoAdmin.pdfsEditando.push({
        nombre: archivo.name,
        tamaño: archivo.size,
        base64: ev.target.result    // Guardamos la URL de datos completa
      });
      renderizarListaPdfAdmin();
      mostrarToast(`"${archivo.name}" adjuntado correctamente. ✓`, "success");
    };
    lector.onerror = function () {
      mostrarToast(`Error al leer "${archivo.name}".`, "error");
    };
    lector.readAsDataURL(archivo);
  });
}

/**
 * renderizarListaPdfAdmin
 * Actualiza la lista visual de PDFs adjuntos en el editor.
 */
function renderizarListaPdfAdmin() {
  const lista = document.getElementById("pdfListaAdmin");
  if (!lista) return;

  lista.innerHTML = "";

  if (estadoAdmin.pdfsEditando.length === 0) {
    lista.innerHTML = `
      <p style="color:var(--text-muted); font-size:0.82rem; font-style:italic; margin-top:8px;">
        No hay PDFs adjuntos todavía.
      </p>`;
    return;
  }

  estadoAdmin.pdfsEditando.forEach(function (pdf, indice) {
    const item = document.createElement("div");
    item.className = "pdf-item-admin";
    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">📄</span>
        <span class="pdf-item-nombre">${pdf.nombre}</span>
        <span class="pdf-item-tamaño">${formatearBytes(pdf.tamaño)}</span>
      </div>
      <button
        type="button"
        onclick="eliminarPdfAdmin(${indice})"
        class="btn btn-danger btn-sm"
        title="Eliminar este PDF"
        aria-label="Eliminar PDF ${pdf.nombre}"
      >🗑️ Quitar</button>
    `;
    lista.appendChild(item);
  });
}

/**
 * eliminarPdfAdmin
 * Quita un PDF de la lista temporal del editor.
 * @param {number} indice - Posición en el arreglo pdfsEditando
 */
function eliminarPdfAdmin(indice) {
  const nombre = estadoAdmin.pdfsEditando[indice]?.nombre || "";
  estadoAdmin.pdfsEditando.splice(indice, 1);
  renderizarListaPdfAdmin();
  mostrarToast(`"${nombre}" eliminado de la lista.`, "info");
}
window.eliminarPdfAdmin = eliminarPdfAdmin;

/**
 * formatearBytes
 * Convierte bytes a texto legible (KB / MB).
 * @param {number} bytes
 * @returns {string}
 */
function formatearBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024)       return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ── 15. UTILIDADES ──────────────────────────────────────── */

/**
 * capitalizar
 * Convierte la primera letra de una cadena a mayúscula.
 * @param {string} str
 * @returns {string}
 */
function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * truncar
 * Recorta un texto a un máximo de caracteres.
 * @param {string} texto
 * @param {number} max
 * @returns {string}
 */
function truncar(texto, max) {
  if (!texto) return "";
  return texto.length > max ? texto.slice(0, max) + "..." : texto;
}

/**
 * actualizarTexto
 * Actualiza el textContent de un elemento por su ID.
 * @param {string} id
 * @param {string|number} valor
 */
function actualizarTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

/**
 * actualizarValor
 * Actualiza el value de un input/textarea o textContent de un elemento.
 * @param {string} id
 * @param {string} valor
 */
function actualizarValor(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.value = valor || "";
  } else {
    el.textContent = valor || "";
  }
}
