/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: main.js
   Descripción: Portal del estudiante con Supabase
   ============================================================ */

const SESSION_KEY        = "upla_session";
const UNIDADES_STORAGE_KEY = "upla_unidades";

const UNIDADES_DEFAULT = [
  { numero: 1, nombre: "Unidad I",   descripcion: "Fundamentos y Modelo Relacional",    semanas: [1,2,3,4]     },
  { numero: 2, nombre: "Unidad II",  descripcion: "Diseño Avanzado de Bases de Datos",  semanas: [5,6,7,8]     },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos",      semanas: [9,10,11,12]  },
  { numero: 4, nombre: "Unidad IV",  descripcion: "Administración y Seguridad",         semanas: [13,14,15,16] }
];

let UNIDADES = UNIDADES_DEFAULT.map(u => ({ ...u }));

// Cargar nombres personalizados (primero Supabase, luego localStorage)
(function cargarNombresUnidades() {
  try {
    const guardadas = localStorage.getItem(UNIDADES_STORAGE_KEY);
    if (guardadas) {
      JSON.parse(guardadas).forEach(function(u) {
        const idx = UNIDADES.findIndex(x => x.numero === u.numero);
        if (idx !== -1) {
          UNIDADES[idx].nombre      = u.nombre      || UNIDADES[idx].nombre;
          UNIDADES[idx].descripcion = u.descripcion || UNIDADES[idx].descripcion;
        }
      });
    }
  } catch (_) { /* usar defaults */ }
})();

const estado = {
  sesion:       null,
  semanas:      [],
  semanaActiva: null,
  vistaActual:  "grid"
};

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
  cargarSesion();
  renderizarNavbar();
  await cargarSemanas();
  renderizarEstadisticas();
  renderizarGrillaSemanas();
}

function cargarSesion() {
  try {
    const datos = sessionStorage.getItem(SESSION_KEY);
    estado.sesion = datos ? JSON.parse(datos) : null;
  } catch (_) { estado.sesion = null; }
}

async function cargarSemanas() {
  try {
    const { data, error } = await window.supabaseClient
      .from("semanas")
      .select("numero_semana, titulo, descripcion, contenido_html, publicado, archivos_pdf, ultima_modificacion")
      .eq("publicado", true)
      .order("numero_semana", { ascending: true });

    if (error) throw error;
    estado.semanas = data || [];
  } catch (err) {
    console.error("Error cargando semanas:", err);
    estado.semanas = [];
  }
}

// ── Navbar ────────────────────────────────────────────────────
function renderizarNavbar() {
  const navUser = document.getElementById("navUser");
  if (!navUser) return;

  if (estado.sesion) {
    const inicial = escapeHtml(estado.sesion.nombre.charAt(0).toUpperCase());
    const nombre  = escapeHtml(estado.sesion.nombre);
    navUser.innerHTML = `
      <div class="navbar-user">
        <div class="navbar-avatar">${inicial}</div>
        <span>${nombre}</span>
        ${estado.sesion.rol === "admin"
          ? `<a href="admin.html" class="btn btn-secondary btn-sm">Panel Admin</a>`
          : ""}
        <button onclick="cerrarSesion()" class="btn btn-secondary btn-sm">Salir</button>
      </div>`;
  } else {
    navUser.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Iniciar Sesión</a>`;
  }
}

// ── Estadísticas ──────────────────────────────────────────────
function renderizarEstadisticas() {
  const el = document.getElementById("statPublicadas");
  if (el) el.textContent = estado.semanas.length;
}

// ── Grilla de semanas ─────────────────────────────────────────
function renderizarGrillaSemanas() {
  const contenedor = document.getElementById("semanasGrid");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  let idx = 0;
  UNIDADES.forEach(function(unidad) {
    const bloque = document.createElement("div");
    bloque.className = "unidad-bloque";
    bloque.innerHTML = `
      <div class="unidad-header">
        <div class="unidad-numero-badge">Unidad ${unidad.numero}</div>
        <div class="unidad-info">
          <h3 class="unidad-titulo">${escapeHtml(unidad.nombre)}</h3>
          <p class="unidad-descripcion">${escapeHtml(unidad.descripcion)}</p>
        </div>
        <div class="unidad-progress">
          <span id="progreso-unidad-${unidad.numero}" class="badge badge-muted">0 / 4</span>
        </div>
      </div>`;

    const grilla = document.createElement("div");
    grilla.className = "weeks-grid";

    unidad.semanas.forEach(function(numSemana) {
      const semana  = estado.semanas.find(s => s.numero_semana === numSemana);
      const tarjeta = crearTarjetaSemana(semana, numSemana);
      tarjeta.style.animationDelay = (idx * 0.05) + "s";
      idx++;
      grilla.appendChild(tarjeta);
    });

    bloque.appendChild(grilla);
    contenedor.appendChild(bloque);
    actualizarProgresoUnidad(unidad);
  });
}

function crearTarjetaSemana(semana, numSemana) {
  const div = document.createElement("div");
  const isPublicada = semana && semana.publicado;
  div.className = "week-card" + (isPublicada ? "" : " locked");

  if (isPublicada) {
    div.innerHTML = `
      <div class="week-number">Semana ${numSemana}</div>
      <div class="week-title">${escapeHtml(semana.titulo || "Sin título")}</div>
      <div class="week-description">${escapeHtml(semana.descripcion || "Sin descripción disponible.")}</div>
      <div class="week-footer">
        <span class="badge badge-success">✓ Disponible</span>
        <span style="font-size:0.82rem;color:var(--text-accent);">Ver contenido →</span>
      </div>`;
    div.addEventListener("click", () => mostrarDetalleSemana(semana));
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");
    div.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") mostrarDetalleSemana(semana);
    });
  } else {
    div.innerHTML = `
      <div class="week-number">Semana ${numSemana}</div>
      <div class="week-title" style="color:var(--text-muted)">Próximamente...</div>
      <div class="week-description" style="color:var(--text-muted)">Esta semana aún no ha sido publicada por el docente.</div>
      <div class="week-footer">
        <span class="badge badge-muted">🔒 No disponible</span>
      </div>`;
  }
  return div;
}

function actualizarProgresoUnidad(unidad) {
  const publicadas = unidad.semanas.filter(n => estado.semanas.find(s => s.numero_semana === n)).length;
  const badge = document.getElementById("progreso-unidad-" + unidad.numero);
  if (!badge) return;
  badge.textContent = publicadas + " / 4";
  badge.className = "badge " + (publicadas === 0 ? "badge-muted" : publicadas < 4 ? "badge-warning" : "badge-success");
}

// ── Detalle de semana ─────────────────────────────────────────
function mostrarDetalleSemana(semana) {
  if (!semana || !semana.publicado) return;
  estado.semanaActiva = semana;
  estado.vistaActual  = "detalle";

  document.getElementById("vistaGrid")?.classList.add("hidden");
  const detalle = document.getElementById("vistaDetalle");
  if (detalle) {
    detalle.classList.remove("hidden");
    renderizarDetalle(semana);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function renderizarDetalle(semana) {
  const unidad = UNIDADES.find(u => u.semanas.includes(semana.numero_semana));
  const etiquetaUnidad = unidad ? `${unidad.nombre} — ${unidad.descripcion}` : "";

  const el = id => document.getElementById(id);
  if (el("detalleTitulo"))   el("detalleTitulo").textContent   = semana.titulo;
  if (el("detalleSubtitulo")) el("detalleSubtitulo").textContent = `${etiquetaUnidad} · Semana ${semana.numero_semana}`;

  // Renderizar contenido como HTML (el admin escribe HTML en el editor)
  const contenidoEl = el("detalleContenido");
  if (contenidoEl) {
    const html = semana.contenido_html || "";
    // Sanear el HTML para evitar XSS
    contenidoEl.innerHTML = sanitizarHTML(html) || "<p style='color:var(--text-muted)'>No hay contenido disponible aún.</p>";
  }

  if (el("detalleFecha") && semana.ultima_modificacion) {
    el("detalleFecha").textContent = "Última actualización: " + new Date(semana.ultima_modificacion)
      .toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
  }

  renderizarPdfsDetalle(semana.archivos_pdf || []);
}

// Saneado básico de HTML: permite etiquetas seguras, elimina scripts/eventos
function sanitizarHTML(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  // Eliminar scripts y on* event handlers
  tmp.querySelectorAll("script, iframe[src^='javascript']").forEach(el => el.remove());
  tmp.querySelectorAll("*").forEach(function(el) {
    Array.from(el.attributes).forEach(function(attr) {
      if (attr.name.startsWith("on") || (attr.name === "href" && attr.value.startsWith("javascript:"))) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return tmp.innerHTML;
}

// ── Visor de archivos ─────────────────────────────────────────
const TIPOS_VISOR = {
  pdf:  { icono: "📄", etiqueta: "PDF",       visor: "iframe"    },
  doc:  { icono: "📝", etiqueta: "Word",       visor: "descarga"  },
  docx: { icono: "📝", etiqueta: "Word",       visor: "office365" },
  ppt:  { icono: "📊", etiqueta: "PPT",        visor: "descarga"  },
  pptx: { icono: "📊", etiqueta: "PPT",        visor: "office365" },
  xls:  { icono: "📋", etiqueta: "Excel",      visor: "descarga"  },
  xlsx: { icono: "📋", etiqueta: "Excel",      visor: "office365" },
  png:  { icono: "🖼️", etiqueta: "Imagen",     visor: "imagen"    },
  jpg:  { icono: "🖼️", etiqueta: "Imagen",     visor: "imagen"    },
  jpeg: { icono: "🖼️", etiqueta: "Imagen",     visor: "imagen"    },
  gif:  { icono: "🖼️", etiqueta: "GIF",        visor: "imagen"    },
  webp: { icono: "🖼️", etiqueta: "Imagen",     visor: "imagen"    },
  mp4:  { icono: "🎬", etiqueta: "Video",      visor: "video"     },
  mp3:  { icono: "🎵", etiqueta: "Audio",      visor: "audio"     },
  txt:  { icono: "📃", etiqueta: "Texto",      visor: "iframe"    },
  zip:  { icono: "📦", etiqueta: "ZIP",        visor: "descarga"  },
  rar:  { icono: "📦", etiqueta: "RAR",        visor: "descarga"  },
};

function obtenerTipoVisor(nombre) {
  const ext = (nombre || "").split(".").pop().toLowerCase();
  return TIPOS_VISOR[ext] || { icono: "📎", etiqueta: ext.toUpperCase(), visor: "descarga" };
}

let archivoVisorActivo = -1;

function renderizarPdfsDetalle(archivos) {
  const seccion = document.getElementById("detallePdfSection");
  const lista   = document.getElementById("detallePdfLista");
  if (!seccion || !lista) return;

  if (!archivos || archivos.length === 0) { seccion.classList.add("hidden"); return; }

  seccion.classList.remove("hidden");
  lista.innerHTML = "";
  cerrarVisorPdf();
  archivoVisorActivo = -1;

  // Filtros por tipo
  const tiposPresentes = [...new Set(archivos.map(a => obtenerTipoVisor(a.nombre).etiqueta))];
  if (tiposPresentes.length > 1) {
    const filtrosEl = document.createElement("div");
    filtrosEl.className = "file-type-filters";
    filtrosEl.setAttribute("role", "group");
    filtrosEl.setAttribute("aria-label", "Filtrar archivos");
    filtrosEl.innerHTML = `<button class="file-type-btn active" onclick="filtrarArchivosEstudiante('todos', this)">Todos (${archivos.length})</button>`;
    tiposPresentes.forEach(function(tipo) {
      const count = archivos.filter(a => obtenerTipoVisor(a.nombre).etiqueta === tipo).length;
      filtrosEl.innerHTML += `<button class="file-type-btn" onclick="filtrarArchivosEstudiante('${escapeHtml(tipo)}', this)">${escapeHtml(tipo)} (${count})</button>`;
    });
    lista.appendChild(filtrosEl);
  }

  const contenedorItems = document.createElement("div");
  contenedorItems.id = "listaArchivosEstudiante";
  contenedorItems.className = "pdf-lista";
  lista.appendChild(contenedorItems);
  renderizarItemsArchivos(archivos, contenedorItems, archivos);
}

function renderizarItemsArchivos(archivos, contenedor, todosList) {
  contenedor.innerHTML = "";
  archivos.forEach(function(archivo) {
    const indiceReal = todosList.indexOf(archivo);
    const tipo = obtenerTipoVisor(archivo.nombre);
    const ext  = (archivo.nombre || "").split(".").pop().toLowerCase();

    const item = document.createElement("div");
    item.className = "pdf-item-usuario";
    item.dataset.tipo = tipo.etiqueta;

    let botonesHTML = `<a href="${escapeAttr(archivo.base64)}" download="${escapeAttr(archivo.nombre)}" class="btn btn-secondary btn-sm">⬇️ Descargar</a>`;
    if (tipo.visor !== "descarga") {
      botonesHTML = `<button onclick="abrirVisorPdf(${indiceReal})" class="btn btn-primary btn-sm">👁️ Ver</button>${botonesHTML}`;
    }

    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">${tipo.icono}</span>
        <div>
          <div class="pdf-item-nombre">${escapeHtml(archivo.nombre)}</div>
          <div style="display:flex;gap:6px;margin-top:3px;align-items:center;">
            <span class="file-badge file-badge-${ext}">${tipo.etiqueta}</span>
            <span class="pdf-item-tamaño">${formatearBytes(archivo.tamaño)}</span>
          </div>
        </div>
      </div>
      <div class="pdf-item-acciones">${botonesHTML}</div>`;
    contenedor.appendChild(item);
  });
}

function filtrarArchivosEstudiante(tipo, btnEl) {
  const semana   = estado.semanaActiva;
  if (!semana) return;
  const archivos = semana.archivos_pdf || [];

  document.querySelectorAll(".file-type-filters .file-type-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  const contenedor = document.getElementById("listaArchivosEstudiante");
  if (!contenedor) return;

  const filtrados = tipo === "todos" ? archivos : archivos.filter(a => obtenerTipoVisor(a.nombre).etiqueta === tipo);
  renderizarItemsArchivos(filtrados, contenedor, archivos);
  cerrarVisorPdf();
}

function abrirVisorPdf(indice) {
  const semana = estado.semanaActiva;
  if (!semana?.archivos_pdf?.[indice]) return;

  const archivo = semana.archivos_pdf[indice];
  const tipo    = obtenerTipoVisor(archivo.nombre);
  const wrapper = document.getElementById("pdfViewerWrapper");
  const nombreEl = document.getElementById("pdfViewerNombre");
  const descBtn  = document.getElementById("pdfDescargarBtn");
  const visor    = document.getElementById("visorContenido");

  if (!wrapper || !visor) return;

  archivoVisorActivo = indice;
  if (descBtn)  { descBtn.href = archivo.base64; descBtn.download = archivo.nombre; }
  if (nombreEl) nombreEl.textContent = archivo.nombre;
  visor.innerHTML = "";

  if (tipo.visor === "iframe" || tipo.visor === "descarga") {
    const frame = document.createElement("iframe");
    frame.className = "pdf-visor-frame";
    frame.title = archivo.nombre;
    frame.src   = archivo.base64;
    visor.appendChild(frame);
  } else if (tipo.visor === "imagen") {
    const img = document.createElement("img");
    img.src = archivo.base64;
    img.alt = archivo.nombre;
    img.className = "visor-imagen";
    visor.appendChild(img);
  } else if (tipo.visor === "video") {
    const vid = document.createElement("video");
    vid.src = archivo.base64;
    vid.controls = true;
    vid.className = "visor-video";
    visor.appendChild(vid);
  } else if (tipo.visor === "audio") {
    const aud = document.createElement("audio");
    aud.src = archivo.base64;
    aud.controls = true;
    aud.className = "visor-audio";
    visor.appendChild(aud);
  } else {
    visor.innerHTML = `
      <div class="visor-no-preview">
        <div class="visor-no-preview-icon">${tipo.icono}</div>
        <p class="visor-no-preview-titulo">Vista previa no disponible</p>
        <p class="visor-no-preview-msg">Descarga el archivo para abrirlo con la aplicación correspondiente.</p>
        <a href="${escapeAttr(archivo.base64)}" download="${escapeAttr(archivo.nombre)}" class="btn btn-primary">
          ⬇️ Descargar ${escapeHtml(archivo.nombre)}
        </a>
      </div>`;
  }

  wrapper.classList.remove("hidden");
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarVisorPdf() {
  const wrapper = document.getElementById("pdfViewerWrapper");
  const visor   = document.getElementById("visorContenido");
  if (wrapper) wrapper.classList.add("hidden");
  if (visor)   visor.innerHTML = "";
  archivoVisorActivo = -1;
}

// ── Navegación ────────────────────────────────────────────────
function volverAGrilla() {
  estado.semanaActiva = null;
  estado.vistaActual  = "grid";
  document.getElementById("vistaGrid")?.classList.remove("hidden");
  document.getElementById("vistaDetalle")?.classList.add("hidden");
  renderizarGrillaSemanas();
  renderizarEstadisticas();
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// ── Utilidades ────────────────────────────────────────────────
function escapeHtml(texto) {
  if (!texto) return "";
  return String(texto).replace(/[&<>"']/g, m =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

function escapeAttr(texto) {
  if (!texto) return "";
  // Para href/download: solo eliminar caracteres peligrosos fuera de data:
  return String(texto).replace(/"/g, "&quot;");
}

function formatearBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024)        return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Exportar funciones globales ───────────────────────────────
window.volverAGrilla            = volverAGrilla;
window.cerrarSesion             = cerrarSesion;
window.abrirVisorPdf            = abrirVisorPdf;
window.cerrarVisorPdf           = cerrarVisorPdf;
window.filtrarArchivosEstudiante = filtrarArchivosEstudiante;
