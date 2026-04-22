/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: admin.js
   Descripción: Panel de administración con Supabase
   ============================================================ */
const SESSION_KEY = "upla_session";

// ── Valores por defecto de las unidades ──────────────────────
const UNIDADES_DEFAULT = [
  { numero: 1, nombre: "Unidad I",   descripcion: "Fundamentos y Modelo Relacional",      semanas: [1,2,3,4]    },
  { numero: 2, nombre: "Unidad II",  descripcion: "Diseño Avanzado de Bases de Datos",     semanas: [5,6,7,8]    },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos",         semanas: [9,10,11,12] },
  { numero: 4, nombre: "Unidad IV",  descripcion: "Administración y Seguridad",            semanas: [13,14,15,16] }
];

// UNIDADES se carga dinámicamente desde Supabase/localStorage
let UNIDADES = UNIDADES_DEFAULT.map(u => ({ ...u }));

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
  await cargarUnidades();
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

  const vistas = ["vistaDashboard", "vistaSemanas", "vistaEditor", "vistaUnidades"];
  vistas.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const vistaActiva = document.getElementById("vista" + vista.charAt(0).toUpperCase() + vista.slice(1));
  if (vistaActiva) vistaActiva.classList.remove("hidden");

  actualizarSidebar(vista);

  if (vista === "dashboard") renderizarDashboard();
  if (vista === "semanas")   renderizarTablaSemanas();
  if (vista === "unidades")  renderizarEditorUnidades();
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
// FUNCIONES PARA MANEJO DE ARCHIVOS (multi-tipo)
// ============================================================

// Mapa de extensiones → { icono, tipo, categoria }
const TIPOS_ARCHIVO = {
  pdf:  { icono: "📄", etiqueta: "PDF",        categoria: "pdf",    visor: "iframe" },
  doc:  { icono: "📝", etiqueta: "Word",        categoria: "docx",   visor: "descarga" },
  docx: { icono: "📝", etiqueta: "Word",        categoria: "docx",   visor: "office365" },
  ppt:  { icono: "📊", etiqueta: "PowerPoint",  categoria: "pptx",   visor: "descarga" },
  pptx: { icono: "📊", etiqueta: "PowerPoint",  categoria: "pptx",   visor: "office365" },
  xls:  { icono: "📋", etiqueta: "Excel",       categoria: "otro",   visor: "descarga" },
  xlsx: { icono: "📋", etiqueta: "Excel",       categoria: "otro",   visor: "office365" },
  png:  { icono: "🖼️", etiqueta: "Imagen",      categoria: "imagen", visor: "imagen" },
  jpg:  { icono: "🖼️", etiqueta: "Imagen",      categoria: "imagen", visor: "imagen" },
  jpeg: { icono: "🖼️", etiqueta: "Imagen",      categoria: "imagen", visor: "imagen" },
  gif:  { icono: "🖼️", etiqueta: "GIF",         categoria: "imagen", visor: "imagen" },
  webp: { icono: "🖼️", etiqueta: "Imagen",      categoria: "imagen", visor: "imagen" },
  mp4:  { icono: "🎬", etiqueta: "Video",       categoria: "otro",   visor: "video" },
  mp3:  { icono: "🎵", etiqueta: "Audio",       categoria: "otro",   visor: "audio" },
  txt:  { icono: "📃", etiqueta: "Texto",       categoria: "otro",   visor: "iframe" },
  zip:  { icono: "📦", etiqueta: "ZIP",         categoria: "otro",   visor: "descarga" },
  rar:  { icono: "📦", etiqueta: "RAR",         categoria: "otro",   visor: "descarga" },
};

function obtenerInfoTipo(nombre) {
  const ext = nombre.split(".").pop().toLowerCase();
  return TIPOS_ARCHIVO[ext] || { icono: "📎", etiqueta: ext.toUpperCase(), categoria: "otro", visor: "descarga" };
}

// Filtro activo en el editor admin
let filtroTipoAdmin = "todos";

function filtrarTipoAdmin(tipo) {
  filtroTipoAdmin = tipo;
  document.querySelectorAll(".file-type-btn").forEach(function(btn) {
    btn.classList.toggle("active", btn.dataset.tipo === tipo);
  });
  renderizarListaPdfAdmin();
}

function inicializarEditorPdf(semana) {
  estadoAdmin.pdfsEditando = semana.archivos_pdf ? [...semana.archivos_pdf] : [];
  filtroTipoAdmin = "todos";
  // Reset filtro UI
  document.querySelectorAll(".file-type-btn").forEach(function(btn) {
    btn.classList.toggle("active", btn.dataset.tipo === "todos");
  });
  renderizarListaPdfAdmin();

  // Configurar input file (multi-tipo)
  const inputArchivos = document.getElementById("inputArchivos");
  if (inputArchivos) {
    const nuevoInput = inputArchivos.cloneNode(true);
    inputArchivos.parentNode.replaceChild(nuevoInput, inputArchivos);
    nuevoInput.addEventListener("change", function(e) {
      procesarArchivos(e.target.files);
      e.target.value = "";
    });
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
      procesarArchivos(e.dataTransfer.files);
    };
  }
}

function procesarArchivos(archivos) {
  if (!archivos || archivos.length === 0) return;

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  Array.from(archivos).forEach(function (archivo) {
    if (archivo.size > MAX_BYTES) {
      mostrarToast(`"${archivo.name}" supera el límite de 10 MB.`, "error");
      return;
    }
    const yaExiste = estadoAdmin.pdfsEditando.some(p => p.nombre === archivo.name);
    if (yaExiste) {
      mostrarToast(`"${archivo.name}" ya está adjunto.`, "info");
      return;
    }
    const info = obtenerInfoTipo(archivo.name);
    const lector = new FileReader();
    lector.onload = function (ev) {
      estadoAdmin.pdfsEditando.push({
        nombre:    archivo.name,
        tamaño:    archivo.size,
        base64:    ev.target.result,
        categoria: info.categoria,
        visor:     info.visor,
        etiqueta:  info.etiqueta,
        icono:     info.icono
      });
      renderizarListaPdfAdmin();
      mostrarToast(`"${archivo.name}" adjuntado ✓`, "success");
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

  const filtrados = filtroTipoAdmin === "todos"
    ? estadoAdmin.pdfsEditando
    : estadoAdmin.pdfsEditando.filter(function(a) { return a.categoria === filtroTipoAdmin; });

  if (estadoAdmin.pdfsEditando.length === 0) {
    lista.innerHTML = `<p style="color:var(--text-muted); font-size:0.82rem; font-style:italic; margin-top:8px;">No hay archivos adjuntos todavía.</p>`;
    return;
  }

  if (filtrados.length === 0) {
    lista.innerHTML = `<p style="color:var(--text-muted); font-size:0.82rem; font-style:italic; margin-top:8px;">No hay archivos de este tipo.</p>`;
    return;
  }

  filtrados.forEach(function (archivo) {
    const indiceReal = estadoAdmin.pdfsEditando.indexOf(archivo);
    const info = obtenerInfoTipo(archivo.nombre);
    const item = document.createElement("div");
    item.className = "pdf-item-admin";
    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">${info.icono}</span>
        <div>
          <span class="pdf-item-nombre">${escapeHtml(archivo.nombre)}</span>
          <div style="display:flex; gap:6px; margin-top:3px;">
            <span class="file-badge file-badge-${info.categoria}">${info.etiqueta}</span>
            <span class="pdf-item-tamaño">${formatearBytes(archivo.tamaño)}</span>
          </div>
        </div>
      </div>
      <button type="button" onclick="eliminarPdfAdmin(${indiceReal})" class="btn btn-danger btn-sm" title="Eliminar">🗑️ Quitar</button>
    `;
    lista.appendChild(item);
  });

  // Contador
  const contadorEl = document.createElement("p");
  contadorEl.style.cssText = "font-size:0.75rem; color:var(--text-muted); margin-top:6px; text-align:right;";
  contadorEl.textContent = `${estadoAdmin.pdfsEditando.length} archivo(s) adjunto(s)`;
  lista.appendChild(contadorEl);
}

function eliminarPdfAdmin(indice) {
  const nombre = estadoAdmin.pdfsEditando[indice]?.nombre || "";
  estadoAdmin.pdfsEditando.splice(indice, 1);
  renderizarListaPdfAdmin();
  mostrarToast(`"${nombre}" eliminado de la lista.`, "info");
}

window.filtrarTipoAdmin = filtrarTipoAdmin;

// ============================================================
// GESTIÓN DE UNIDADES (nombres y descripciones editables)
// ============================================================
const UNIDADES_STORAGE_KEY = "upla_unidades";

async function cargarUnidades() {
  // 1. Intentar cargar desde Supabase
  try {
    const { data, error } = await window.supabaseClient
      .from('unidades')
      .select('*')
      .order('numero', { ascending: true });

    if (!error && data && data.length === 4) {
      data.forEach(function(u) {
        const idx = UNIDADES.findIndex(function(x) { return x.numero === u.numero; });
        if (idx !== -1) {
          UNIDADES[idx].nombre      = u.nombre      || UNIDADES[idx].nombre;
          UNIDADES[idx].descripcion = u.descripcion || UNIDADES[idx].descripcion;
        }
      });
      // Sincronizar localStorage
      localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(UNIDADES));
      return;
    }
  } catch (_) { /* sin tabla unidades — usar fallback */ }

  // 2. Fallback: localStorage
  const guardadas = localStorage.getItem(UNIDADES_STORAGE_KEY);
  if (guardadas) {
    try {
      const arr = JSON.parse(guardadas);
      arr.forEach(function(u) {
        const idx = UNIDADES.findIndex(function(x) { return x.numero === u.numero; });
        if (idx !== -1) {
          UNIDADES[idx].nombre      = u.nombre      || UNIDADES[idx].nombre;
          UNIDADES[idx].descripcion = u.descripcion || UNIDADES[idx].descripcion;
        }
      });
    } catch (_) { /* usar defaults */ }
  }
}

function renderizarEditorUnidades() {
  const grid = document.getElementById("unidadesEditorGrid");
  if (!grid) return;
  grid.innerHTML = "";

  UNIDADES.forEach(function(unidad) {
    const card = document.createElement("div");
    card.className = "unidad-edit-card";
    card.innerHTML = `
      <div class="unidad-edit-header">
        <span class="unidad-edit-num">Unidad ${unidad.numero}</span>
        <span class="unidad-edit-semanas">Semanas ${unidad.semanas[0]}–${unidad.semanas[unidad.semanas.length - 1]}</span>
      </div>
      <div class="form-group" style="margin-bottom:0.75rem;">
        <label class="form-label" for="unidadNombre${unidad.numero}">Nombre</label>
        <input type="text" id="unidadNombre${unidad.numero}" class="form-input"
          value="${escapeHtml(unidad.nombre)}" maxlength="60"
          placeholder="Ej: Unidad I — Introducción">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="unidadDesc${unidad.numero}">Descripción</label>
        <input type="text" id="unidadDesc${unidad.numero}" class="form-input"
          value="${escapeHtml(unidad.descripcion)}" maxlength="120"
          placeholder="Breve descripción de los temas cubiertos">
      </div>
    `;
    grid.appendChild(card);
  });

  // Ocultar alerta previa
  const alerta = document.getElementById("unidadesAlerta");
  if (alerta) alerta.classList.add("hidden");
}

async function guardarUnidades() {
  // Leer valores del formulario
  let valido = true;
  const nuevasUnidades = UNIDADES.map(function(unidad) {
    const nombre      = (document.getElementById("unidadNombre" + unidad.numero)?.value || "").trim();
    const descripcion = (document.getElementById("unidadDesc"   + unidad.numero)?.value || "").trim();
    if (!nombre) { valido = false; }
    return { ...unidad, nombre, descripcion };
  });

  if (!valido) {
    mostrarAlertaUnidades("El nombre de cada unidad es obligatorio.", "error");
    return;
  }

  // Actualizar array en memoria
  nuevasUnidades.forEach(function(u, i) {
    UNIDADES[i].nombre      = u.nombre;
    UNIDADES[i].descripcion = u.descripcion;
  });

  // Persistir en localStorage (siempre)
  localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(UNIDADES));

  // Intentar persistir en Supabase
  let guardadoEnBD = false;
  try {
    for (const u of UNIDADES) {
      const { error } = await window.supabaseClient
        .from('unidades')
        .upsert({ numero: u.numero, nombre: u.nombre, descripcion: u.descripcion },
                 { onConflict: 'numero' });
      if (error) throw error;
    }
    guardadoEnBD = true;
  } catch (_) { /* tabla no existe — solo localStorage */ }

  mostrarToast("✅ Unidades guardadas correctamente.", "success");
  mostrarAlertaUnidades(
    guardadoEnBD
      ? "✅ Cambios guardados en la base de datos y en este navegador."
      : "✅ Cambios guardados localmente. (Crea la tabla 'unidades' en Supabase para persistencia total.)",
    "success"
  );

  // Refrescar tabla y dashboard para reflejar nuevos nombres
  renderizarTablaSemanas();
  renderizarDashboard();
}

function restablecerUnidades() {
  if (!confirm("¿Restablecer los nombres y descripciones originales de las 4 unidades?")) return;
  UNIDADES_DEFAULT.forEach(function(def, i) {
    UNIDADES[i].nombre      = def.nombre;
    UNIDADES[i].descripcion = def.descripcion;
  });
  localStorage.removeItem(UNIDADES_STORAGE_KEY);
  renderizarEditorUnidades();
  mostrarToast("Unidades restablecidas a los valores por defecto.", "info");
}

function mostrarAlertaUnidades(mensaje, tipo) {
  const alerta = document.getElementById("unidadesAlerta");
  if (!alerta) return;
  alerta.className = "alert alert-" + (tipo === "error" ? "error" : "success");
  alerta.innerHTML = "<span>" + mensaje + "</span>";
  alerta.classList.remove("hidden");
  setTimeout(function() { alerta.classList.add("hidden"); }, 5000);
}

window.guardarUnidades    = guardarUnidades;
window.restablecerUnidades = restablecerUnidades;

// ────────────────────────────────────────────────────────────
// FIN gestión de unidades
// ────────────────────────────────────────────────────────────

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
