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
 * cargarSemanas
 * Lee las semanas desde localStorage.
 * Las mismas que verá el estudiante en index.html.
 */
function cargarSemanas() {
  const guardado = localStorage.getItem(STORAGE_KEY);

  if (guardado) {
    estadoAdmin.semanas = JSON.parse(guardado);
  } else {
    // Primera vez: crear estructura vacía de 16 semanas
    estadoAdmin.semanas = crearSemanasIniciales();
    guardarSemanas();
  }
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
 * Llena la tabla con todas las 16 semanas y sus acciones.
 */
function renderizarTablaSemanas() {
  const tbody = document.getElementById("tablaSemanasCuerpo");
  if (!tbody) return;

  tbody.innerHTML = "";

  estadoAdmin.semanas.forEach(function (semana) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td style="font-family:var(--font-mono); color:var(--text-muted);">
        ${String(semana.numero).padStart(2, "0")}
      </td>
      <td style="color:var(--text-primary); font-weight:500;">
        ${semana.titulo || "<span style='color:var(--text-muted);font-style:italic;'>Sin título</span>"}
      </td>
      <td>
        ${semana.descripcion
          ? `<span style="color:var(--text-secondary);">${truncar(semana.descripcion, 50)}</span>`
          : `<span style="color:var(--text-muted);font-style:italic;">Sin descripción</span>`}
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

  // Rellenar el formulario con los datos actuales
  actualizarValor("editorNumero",      "Semana " + numero);
  actualizarValor("editorTitulo",      semana.titulo);
  actualizarValor("editorDescripcion", semana.descripcion);
  actualizarValor("editorContenido",   semana.contenido);

  // Actualizar el checkbox de publicación
  const checkPublicar = document.getElementById("editorPublicar");
  if (checkPublicar) checkPublicar.checked = semana.publicada;

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
function guardarEditor() {
  if (!estadoAdmin.semanaEditando) return;

  // Obtener valores del formulario
  const titulo      = document.getElementById("editorTitulo")?.value.trim();
  const descripcion = document.getElementById("editorDescripcion")?.value.trim();
  const contenido   = document.getElementById("editorContenido")?.value.trim();
  const publicar    = document.getElementById("editorPublicar")?.checked;

  // Validación básica
  if (!titulo) {
    mostrarToast("El título es obligatorio.", "error");
    document.getElementById("editorTitulo")?.focus();
    return;
  }

  // Encontrar la semana y actualizar sus datos
  const indice = estadoAdmin.semanas.findIndex(
    s => s.numero === estadoAdmin.semanaEditando
  );

  if (indice !== -1) {
    estadoAdmin.semanas[indice] = {
      ...estadoAdmin.semanas[indice],
      titulo,
      descripcion,
      contenido,
      publicada:          publicar,
      fechaActualizacion: new Date().toISOString()
    };

    // Persistir en localStorage (visible para el estudiante inmediatamente)
    guardarSemanas();

    mostrarToast(`Semana ${estadoAdmin.semanaEditando} guardada exitosamente. ✓`, "success");

    // Volver a la tabla de semanas
    setTimeout(function () {
      mostrarVista("semanas");
    }, 1200);
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

/* ── 14. UTILIDADES ──────────────────────────────────────── */

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
