/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: admin.js
   Descripción: Panel de administración con Supabase
   ============================================================ */
const SESSION_KEY = "upla_session";
const UNIDADES = [
  { numero: 1, nombre: "Unidad I", descripcion: "Fundamentos y Modelo Relacional", semanas: [1, 2, 3, 4] },
  { numero: 2, nombre: "Unidad II", descripcion: "Diseño Avanzado de Bases de Datos", semanas: [5, 6, 7, 8] },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos", semanas: [9, 10, 11, 12] },
  { numero: 4, nombre: "Unidad IV", descripcion: "Administración y Seguridad", semanas: [13, 14, 15, 16] }
];

const estadoAdmin = {
  sesion: null,
  semanas: [],
  semanaEditando: null,
  pdfsEditando: [],
  vistaActual: "dashboard"
};

document.addEventListener("DOMContentLoaded", function () {
  inicializarAdmin();
});

async function inicializarAdmin() {
  if (!verificarAccesoAdmin()) return;
  await cargarSemanas();
  renderizarInfoAdmin();
  mostrarVista("dashboard");
}

function verificarAccesoAdmin() {
  const datos = sessionStorage.getItem(SESSION_KEY);
  if (!datos) {
    window.location.href = "login.html";
    return false;
  }
  const sesion = JSON.parse(datos);
  if (sesion.rol !== "admin") {
    window.location.href = "index.html";
    return false;
  }
  estadoAdmin.sesion = sesion;
  return true;
}

async function cargarSemanas() {
  try {
    const { data, error } = await window.supabaseClient
      .from('semanas')
      .select('*')
      .order('numero_semana', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      estadoAdmin.semanas = data;
    } else {
      // Si no hay datos, crear semanas iniciales
      await crearSemanasIniciales();
      const { data: nuevasSemanas } = await window.supabaseClient
        .from('semanas')
        .select('*')
        .order('numero_semana', { ascending: true });
      estadoAdmin.semanas = nuevasSemanas || [];
    }

    renderizarDashboard();
    renderizarTablaSemanas();
  } catch (error) {
    console.error("Error cargando semanas:", error);
    mostrarToast("Error al cargar las semanas", "error");
  }
}

async function crearSemanasIniciales() {
  const semanas = [];
  for (let i = 1; i <= 16; i++) {
    semanas.push({
      numero_semana: i,
      titulo: "",
      descripcion: "",
      contenido_html: "",
      publicado: false,
      archivos_pdf: [],
      ultima_modificacion: new Date().toISOString()
    });
  }

  try {
    const { error } = await window.supabaseClient
      .from('semanas')
      .insert(semanas);

    if (error) throw error;
    console.log("Semanas iniciales creadas");
  } catch (error) {
    console.error("Error creando semanas:", error);
  }
}

function renderizarInfoAdmin() {
  const navAdminNombre = document.getElementById("adminNombre");
  const navAdminRol = document.getElementById("adminRol");
  if (navAdminNombre && estadoAdmin.sesion) {
    navAdminNombre.textContent = estadoAdmin.sesion.nombre;
  }
  if (navAdminRol) {
    navAdminRol.textContent = "Administrador";
  }
}

function mostrarVista(vista) {
  estadoAdmin.vistaActual = vista;

  const vistas = ["vistaDashboard", "vistaSemanas", "vistaEditor"];
  vistas.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const vistaActiva = document.getElementById("vista" + vista.charAt(0).toUpperCase() + vista.slice(1));
  if (vistaActiva) vistaActiva.classList.remove("hidden");

  actualizarSidebar(vista);

  if (vista === "dashboard") renderizarDashboard();
  if (vista === "semanas") renderizarTablaSemanas();
}

function actualizarSidebar(vista) {
  document.querySelectorAll(".sidebar-item").forEach(function (item) {
    item.classList.remove("active");
    if (item.dataset.vista === vista) {
      item.classList.add("active");
    }
  });
}

function renderizarDashboard() {
  const publicadas = estadoAdmin.semanas.filter(s => s.publicado).length;
  const conContenido = estadoAdmin.semanas.filter(s => s.titulo && s.titulo !== "").length;
  const pendientes = 16 - publicadas;

  actualizarTexto("kpiPublicadas", publicadas);
  actualizarTexto("kpiContenido", conContenido);
  actualizarTexto("kpiPendientes", pendientes);
  actualizarTexto("kpiTotal", 16);

  renderizarResumenSemanas();
}

function renderizarResumenSemanas() {
  const contenedor = document.getElementById("resumenSemanas");
  if (!contenedor) return;
  contenedor.innerHTML = "";

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
        <span style="font-family:var(--font-mono); color:var(--text-muted); font-size:0.75rem; min-width:26px;">S${String(semana.numero_semana).padStart(2, "0")}</span>
        <span style="color:var(--text-primary);">${semana.titulo || "Sin título"}</span>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <span class="badge ${semana.publicado ? "badge-success" : "badge-muted"}">
          ${semana.publicado ? "Publicada" : "Borrador"}
        </span>
        <button onclick="editarSemana(${semana.numero_semana})" class="btn btn-secondary btn-sm">Editar</button>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

function renderizarTablaSemanas() {
  const tbody = document.getElementById("tablaSemanasCuerpo");
  if (!tbody) return;
  tbody.innerHTML = "";

  UNIDADES.forEach(function (unidad) {
    const filaUnidad = document.createElement("tr");
    filaUnidad.innerHTML = `
      <td colspan="5" style="padding: 10px 16px; background: rgba(21,101,192,0.08); border-top: 1px solid var(--border-active); border-bottom: 1px solid var(--border-color);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:var(--font-mono); font-size:0.7rem; font-weight:700; color:var(--upla-blue-bright); background:rgba(21,101,192,0.15); border:1px solid rgba(21,101,192,0.3); padding:3px 10px; border-radius:20px;">${unidad.nombre}</span>
          <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">${unidad.descripcion}</span>
        </div>
      </td>
    `;
    tbody.appendChild(filaUnidad);

    unidad.semanas.forEach(function (numSemana) {
      const semana = estadoAdmin.semanas.find(s => s.numero_semana === numSemana);
      if (!semana) return;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td style="font-family:var(--font-mono); color:var(--text-muted); padding-left:28px;">S${String(semana.numero_semana).padStart(2, "0")}</td>
        <td><span class="badge badge-blue" style="font-size:0.68rem;">${unidad.nombre}</span></td>
        <td style="color:var(--text-primary); font-weight:500;">${semana.titulo || "<span style='color:var(--text-muted);font-style:italic;'>Sin título</span>"}</td>
        <td><span class="badge ${semana.publicado ? "badge-success" : "badge-muted"}">${semana.publicado ? "✓ Publicada" : "○ Borrador"}</span></td>
        <td>
          <div class="table-actions">
            <button onclick="editarSemana(${semana.numero_semana})" class="btn btn-secondary btn-sm">✏️ Editar</button>
            <button onclick="togglePublicar(${semana.numero_semana})" class="btn btn-sm ${semana.publicado ? "btn-danger" : "btn-primary"}">${semana.publicado ? "Despublicar" : "Publicar"}</button>
            <button onclick="limpiarSemana(${semana.numero_semana})" class="btn btn-secondary btn-sm" title="Limpiar contenido">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(fila);
    });
  });
}

function editarSemana(numero) {
  const semana = estadoAdmin.semanas.find(s => s.numero_semana === numero);
  if (!semana) return;

  estadoAdmin.semanaEditando = numero;
  const unidad = UNIDADES.find(u => u.semanas.includes(numero));
  const etiqueta = unidad ? `${unidad.nombre} · Semana ${numero}` : `Semana ${numero}`;

  actualizarValor("editorNumero", etiqueta);
  actualizarValor("editorTitulo", semana.titulo || "");
  actualizarValor("editorDescripcion", semana.descripcion || "");
  actualizarValor("editorContenido", semana.contenido_html || "");

  const subtituloEditor = document.getElementById("editorSubtitulo");
  if (subtituloEditor && unidad) {
    subtituloEditor.textContent = unidad.descripcion;
  }

  const checkPublicar = document.getElementById("editorPublicar");
  if (checkPublicar) checkPublicar.checked = semana.publicado;

  inicializarEditorPdf(semana);
  mostrarVista("editor");
}

async function guardarEditor() {
  const num = estadoAdmin.semanaEditando;
  if (!num) {
    mostrarToast("No hay semana seleccionada", "error");
    return;
  }

  // Obtener valores del formulario
  const titulo = document.getElementById('editorTitulo').value.trim();
  const descripcion = document.getElementById('editorDescripcion').value;
  const contenido = document.getElementById('editorContenido').value;
  const publicado = document.getElementById('editorPublicar').checked;

  // Validar título
  if (!titulo) {
    mostrarToast("El título es obligatorio", "error");
    document.getElementById('editorTitulo').focus();
    return;
  }

  // Mostrar loading
  const btnGuardar = document.querySelector('#vistaEditor .btn-primary');
  const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '💾 Guardar Cambios';
  if (btnGuardar) {
    btnGuardar.innerHTML = '<span class="spinner"></span> Guardando...';
    btnGuardar.disabled = true;
  }

  try {
    // Preparar datos para guardar
    const updateData = {
      titulo: titulo,
      descripcion: descripcion,
      contenido_html: contenido,
      publicado: publicado,
      archivos_pdf: estadoAdmin.pdfsEditando,
      ultima_modificacion: new Date().toISOString()
    };

    console.log("Guardando semana:", num, updateData);

    // Verificar si la semana ya existe
    const { data: existe } = await window.supabaseClient
      .from('semanas')
      .select('numero_semana')
      .eq('numero_semana', num)
      .single();

    let error;
    if (existe) {
      // Actualizar semana existente
      const { error: updateError } = await window.supabaseClient
        .from('semanas')
        .update(updateData)
        .eq('numero_semana', num);
      error = updateError;
    } else {
      // Crear nueva semana
      const { error: insertError } = await window.supabaseClient
        .from('semanas')
        .insert({
          numero_semana: num,
          ...updateData
        });
      error = insertError;
    }

    if (error) throw error;

    mostrarToast(`✅ ¡Semana ${num} guardada correctamente!`, "success");

    // Recargar datos y volver a la tabla
    await cargarSemanas();
    estadoAdmin.semanaEditando = null;
    estadoAdmin.pdfsEditando = [];
    mostrarVista("semanas");

  } catch (error) {
    console.error("Error guardando:", error);
    mostrarToast("❌ Error al guardar en la base de datos: " + (error.message || "Desconocido"), "error");
  } finally {
    // Restaurar botón
    if (btnGuardar) {
      btnGuardar.innerHTML = textoOriginal;
      btnGuardar.disabled = false;
    }
  }
}

function cancelarEditor() {
  estadoAdmin.semanaEditando = null;
  estadoAdmin.pdfsEditando = [];
  mostrarVista("semanas");
}

async function togglePublicar(numero) {
  const semana = estadoAdmin.semanas.find(s => s.numero_semana === numero);
  if (!semana) return;

  if (!semana.publicado && !semana.titulo) {
    mostrarToast("Agrega un título antes de publicar la semana.", "error");
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('semanas')
      .update({
        publicado: !semana.publicado,
        ultima_modificacion: new Date().toISOString()
      })
      .eq('numero_semana', numero);

    if (error) throw error;

    const accion = !semana.publicado ? "publicada" : "despublicada";
    mostrarToast(`Semana ${numero} ${accion} correctamente.`, "success");
    await cargarSemanas();
  } catch (error) {
    console.error("Error:", error);
    mostrarToast("Error al cambiar estado", "error");
  }
}

async function limpiarSemana(numero) {
  if (!confirm(`¿Seguro que deseas limpiar el contenido de la Semana ${numero}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('semanas')
      .update({
        titulo: "",
        descripcion: "",
        contenido_html: "",
        archivos_pdf: [],
        publicado: false,
        ultima_modificacion: new Date().toISOString()
      })
      .eq('numero_semana', numero);

    if (error) throw error;

    mostrarToast(`Contenido de Semana ${numero} eliminado.`, "info");
    await cargarSemanas();
  } catch (error) {
    console.error("Error:", error);
    mostrarToast("Error al limpiar la semana", "error");
  }
}

// ============================================================
// FUNCIONES PARA MANEJO DE PDFs
// ============================================================
function inicializarEditorPdf(semana) {
  // Cargar PDFs existentes
  estadoAdmin.pdfsEditando = semana.archivos_pdf ? [...semana.archivos_pdf] : [];
  renderizarListaPdfAdmin();

  // Configurar input file
  const inputPdf = document.getElementById("inputPdf");
  if (inputPdf) {
    const nuevoInput = inputPdf.cloneNode(true);
    inputPdf.parentNode.replaceChild(nuevoInput, inputPdf);
    nuevoInput.addEventListener("change", manejarSeleccionPdf);
  }

  // Configurar drop zone
  const dropZone = document.getElementById("pdfDropZone");
  if (dropZone) {
    dropZone.ondragover = function (e) {
      e.preventDefault();
      dropZone.classList.add("pdf-dropzone-activa");
    };
    dropZone.ondragleave = function () {
      dropZone.classList.remove("pdf-dropzone-activa");
    };
    dropZone.ondrop = function (e) {
      e.preventDefault();
      dropZone.classList.remove("pdf-dropzone-activa");
      procesarArchivosPdf(e.dataTransfer.files);
    };
  }
}

function manejarSeleccionPdf(e) {
  procesarArchivosPdf(e.target.files);
  e.target.value = "";
}

function procesarArchivosPdf(archivos) {
  if (!archivos || archivos.length === 0) return;

  Array.from(archivos).forEach(function (archivo) {
    // Validar tipo
    if (archivo.type !== "application/pdf" && !archivo.name.endsWith(".pdf")) {
      mostrarToast(`"${archivo.name}" no es un PDF válido.`, "error");
      return;
    }

    // Validar tamaño (5 MB)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (archivo.size > MAX_BYTES) {
      mostrarToast(`"${archivo.name}" supera el límite de 5 MB.`, "error");
      return;
    }

    // Verificar duplicados
    const yaExiste = estadoAdmin.pdfsEditando.some(p => p.nombre === archivo.name);
    if (yaExiste) {
      mostrarToast(`"${archivo.name}" ya está adjunto.`, "info");
      return;
    }

    // Leer y convertir a base64
    const lector = new FileReader();
    lector.onload = function (ev) {
      estadoAdmin.pdfsEditando.push({
        nombre: archivo.name,
        tamaño: archivo.size,
        base64: ev.target.result
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
        <span class="pdf-item-nombre">${escapeHtml(pdf.nombre)}</span>
        <span class="pdf-item-tamaño">${formatearBytes(pdf.tamaño)}</span>
      </div>
      <button type="button" onclick="eliminarPdfAdmin(${indice})" class="btn btn-danger btn-sm" title="Eliminar este PDF">🗑️ Quitar</button>
    `;
    lista.appendChild(item);
  });
}

function eliminarPdfAdmin(indice) {
  const nombre = estadoAdmin.pdfsEditando[indice]?.nombre || "";
  estadoAdmin.pdfsEditando.splice(indice, 1);
  renderizarListaPdfAdmin();
  mostrarToast(`"${nombre}" eliminado de la lista.`, "info");
}

function formatearBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function escapeHtml(texto) {
  if (!texto) return "";
  return texto.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ============================================================
// NOTIFICACIONES TOAST
// ============================================================
function mostrarToast(mensaje, tipo) {
  const contenedor = document.getElementById("toastContainer");
  if (!contenedor) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;

  const iconos = { success: "✅", error: "❌", info: "ℹ️" };
  const icono = iconos[tipo] || "•";

  toast.innerHTML = `<span style="font-weight:700; font-size:1rem;">${icono}</span><span>${mensaje}</span>`;
  contenedor.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("removing");
    setTimeout(function () {
      if (toast.parentNode === contenedor) {
        contenedor.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

function actualizarTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function actualizarValor(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.value = valor || "";
  } else {
    el.textContent = valor || "";
  }
}

// Exponer funciones globales
window.mostrarVista = mostrarVista;
window.editarSemana = editarSemana;
window.guardarEditor = guardarEditor;
window.cancelarEditor = cancelarEditor;
window.togglePublicar = togglePublicar;
window.limpiarSemana = limpiarSemana;
window.cerrarSesion = cerrarSesion;
window.eliminarPdfAdmin = eliminarPdfAdmin;
