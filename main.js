/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: main.js
   Descripción: Portal del estudiante con Supabase
   ============================================================ */

const SESSION_KEY = "upla_session";
const UNIDADES_STORAGE_KEY = "upla_unidades";

const UNIDADES_DEFAULT = [
  { numero: 1, nombre: "Unidad I",   descripcion: "Fundamentos y Modelo Relacional",   semanas: [1,2,3,4]    },
  { numero: 2, nombre: "Unidad II",  descripcion: "Diseño Avanzado de Bases de Datos",  semanas: [5,6,7,8]    },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos",      semanas: [9,10,11,12] },
  { numero: 4, nombre: "Unidad IV",  descripcion: "Administración y Seguridad",         semanas: [13,14,15,16] }
];

// Cargar nombres personalizados guardados por el admin
let UNIDADES = UNIDADES_DEFAULT.map(function(u) { return Object.assign({}, u); });
(function cargarNombresUnidades() {
  try {
    const guardadas = localStorage.getItem(UNIDADES_STORAGE_KEY);
    if (guardadas) {
      const arr = JSON.parse(guardadas);
      arr.forEach(function(u) {
        const idx = UNIDADES.findIndex(function(x) { return x.numero === u.numero; });
        if (idx !== -1) {
          UNIDADES[idx].nombre      = u.nombre      || UNIDADES[idx].nombre;
          UNIDADES[idx].descripcion = u.descripcion || UNIDADES[idx].descripcion;
        }
      });
    }
  } catch (_) { /* usar defaults */ }
})();

const estado = {
  sesion: null,
  semanas: [],
  semanaActiva: null,
  vistaActual: "grid"
};

document.addEventListener("DOMContentLoaded", function () {
  inicializar();
});

async function inicializar() {
  cargarSesion();
  await cargarSemanas();
  renderizarNavbar();
  renderizarEstadisticas();
  renderizarGrillaSemanas();
}

function cargarSesion() {
  const datos = sessionStorage.getItem(SESSION_KEY);
  estado.sesion = datos ? JSON.parse(datos) : null;
}

async function cargarSemanas() {
  try {
    const { data, error } = await window.supabaseClient
      .from('semanas')
      .select('*')
      .eq('publicado', true)
      .order('numero_semana', { ascending: true });

    if (error) throw error;
    estado.semanas = data || [];
  } catch (error) {
    console.error("Error cargando semanas:", error);
    estado.semanas = [];
  }
}

function renderizarNavbar() {
  const navUser = document.getElementById("navUser");
  if (!navUser) return;

  if (estado.sesion) {
    const inicial = estado.sesion.nombre.charAt(0).toUpperCase();
    navUser.innerHTML = `
      <div class="navbar-user">
        <div class="navbar-avatar">${inicial}</div>
        <span>${estado.sesion.nombre}</span>
        ${estado.sesion.rol === "admin" ? `<a href="admin.html" class="btn btn-secondary btn-sm">Panel Admin</a>` : ""}
        <button onclick="cerrarSesion()" class="btn btn-secondary btn-sm">Salir</button>
      </div>
    `;
  } else {
    navUser.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Iniciar Sesión</a>`;
  }
}

function renderizarEstadisticas() {
  const publicadas = estado.semanas.filter(s => s.publicado).length;
  const elPublicadas = document.getElementById("statPublicadas");
  const elTotal = document.getElementById("statTotal");
  if (elPublicadas) elPublicadas.textContent = publicadas;
  if (elTotal) elTotal.textContent = "16";
}

function renderizarGrillaSemanas() {
  const contenedor = document.getElementById("semanasGrid");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  let indiceGlobal = 0;

  UNIDADES.forEach(function (unidad) {
    const bloque = document.createElement("div");
    bloque.className = "unidad-bloque";

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

    const grilla = document.createElement("div");
    grilla.className = "weeks-grid";

    unidad.semanas.forEach(function (numSemana) {
      const semana = estado.semanas.find(s => s.numero_semana === numSemana);
      const tarjeta = crearTarjetaSemana(semana, numSemana);
      tarjeta.style.animationDelay = (indiceGlobal * 0.05) + "s";
      indiceGlobal++;
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
      <div class="week-title">${semana.titulo || "Sin título"}</div>
      <div class="week-description">${semana.descripcion || "Sin descripción disponible."}</div>
      <div class="week-footer">
        <span class="badge badge-success">✓ Disponible</span>
        <span style="font-size:0.82rem; color:var(--text-accent);">Ver contenido →</span>
      </div>
    `;
    div.addEventListener("click", function () {
      mostrarDetalleSemana(semana);
    });
  } else {
    div.innerHTML = `
      <div class="week-number">Semana ${numSemana}</div>
      <div class="week-title" style="color:var(--text-muted)">Próximamente...</div>
      <div class="week-description" style="color:var(--text-muted)">Esta semana aún no ha sido publicada por el docente.</div>
      <div class="week-footer">
        <span class="badge badge-muted">🔒 No disponible</span>
      </div>
    `;
  }
  return div;
}

function actualizarProgresoUnidad(unidad) {
  const publicadasEnUnidad = unidad.semanas.filter(function (numSemana) {
    const semana = estado.semanas.find(s => s.numero_semana === numSemana);
    return semana && semana.publicado;
  }).length;

  const badge = document.getElementById("progreso-unidad-" + unidad.numero);
  if (!badge) return;

  badge.textContent = publicadasEnUnidad + " / 4";
  badge.className = "badge";
  if (publicadasEnUnidad === 0) badge.classList.add("badge-muted");
  else if (publicadasEnUnidad < 4) badge.classList.add("badge-warning");
  else badge.classList.add("badge-success");
}

function mostrarDetalleSemana(semana) {
  if (!semana || !semana.publicado) return;

  estado.semanaActiva = semana;
  estado.vistaActual = "detalle";

  const grilla = document.getElementById("vistaGrid");
  const detalle = document.getElementById("vistaDetalle");

  if (grilla) grilla.classList.add("hidden");
  if (detalle) {
    detalle.classList.remove("hidden");
    renderizarDetalle(semana);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function renderizarDetalle(semana) {
  const titulo = document.getElementById("detalleTitulo");
  const subtitulo = document.getElementById("detalleSubtitulo");
  const contenido = document.getElementById("detalleContenido");
  const fecha = document.getElementById("detalleFecha");

  const unidad = UNIDADES.find(u => u.semanas.includes(semana.numero_semana));
  const etiquetaUnidad = unidad ? `${unidad.nombre} — ${unidad.descripcion}` : "";

  if (titulo) titulo.textContent = semana.titulo;
  if (subtitulo) subtitulo.textContent = `${etiquetaUnidad} · Semana ${semana.numero_semana}`;
  if (contenido) contenido.textContent = semana.contenido_html || "No hay contenido disponible aún.";

  if (fecha && semana.ultima_modificacion) {
    const fechaFormato = new Date(semana.ultima_modificacion).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric"
    });
    fecha.textContent = "Última actualización: " + fechaFormato;
  }

  renderizarPdfsDetalle(semana.archivos_pdf || []);
}

// ============================================================
// VISOR DE ARCHIVOS — multi-tipo
// ============================================================

const TIPOS_VISOR = {
  pdf:  { icono: "📄", etiqueta: "PDF",        visor: "iframe"     },
  doc:  { icono: "📝", etiqueta: "Word",        visor: "descarga"   },
  docx: { icono: "📝", etiqueta: "Word",        visor: "office365"  },
  ppt:  { icono: "📊", etiqueta: "PowerPoint",  visor: "descarga"   },
  pptx: { icono: "📊", etiqueta: "PowerPoint",  visor: "office365"  },
  xls:  { icono: "📋", etiqueta: "Excel",       visor: "descarga"   },
  xlsx: { icono: "📋", etiqueta: "Excel",       visor: "office365"  },
  png:  { icono: "🖼️", etiqueta: "Imagen",      visor: "imagen"     },
  jpg:  { icono: "🖼️", etiqueta: "Imagen",      visor: "imagen"     },
  jpeg: { icono: "🖼️", etiqueta: "Imagen",      visor: "imagen"     },
  gif:  { icono: "🖼️", etiqueta: "GIF",         visor: "imagen"     },
  webp: { icono: "🖼️", etiqueta: "Imagen",      visor: "imagen"     },
  mp4:  { icono: "🎬", etiqueta: "Video",        visor: "video"      },
  mp3:  { icono: "🎵", etiqueta: "Audio",        visor: "audio"      },
  txt:  { icono: "📃", etiqueta: "Texto",        visor: "iframe"     },
  zip:  { icono: "📦", etiqueta: "ZIP",          visor: "descarga"   },
  rar:  { icono: "📦", etiqueta: "RAR",          visor: "descarga"   },
};

function formatearBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function obtenerTipoVisor(nombre) {
  const ext = (nombre || "").split(".").pop().toLowerCase();
  return TIPOS_VISOR[ext] || { icono: "📎", etiqueta: ext.toUpperCase(), visor: "descarga" };
}

// Índice del archivo actualmente en el visor
let archivoVisorActivo = -1;

function renderizarPdfsDetalle(archivos) {
  const seccion = document.getElementById("detallePdfSection");
  const lista   = document.getElementById("detallePdfLista");
  if (!seccion || !lista) return;

  if (!archivos || archivos.length === 0) {
    seccion.classList.add("hidden");
    return;
  }

  seccion.classList.remove("hidden");
  lista.innerHTML = "";
  cerrarVisorPdf();
  archivoVisorActivo = -1;

  // Filtros de tipo para el estudiante
  const tiposPresentes = [...new Set(archivos.map(function(a) {
    return obtenerTipoVisor(a.nombre).etiqueta;
  }))];

  if (tiposPresentes.length > 1) {
    const filtrosEl = document.createElement("div");
    filtrosEl.className = "file-type-filters";
    filtrosEl.setAttribute("role", "group");
    filtrosEl.setAttribute("aria-label", "Filtrar archivos");
    filtrosEl.innerHTML = `<button class="file-type-btn active" onclick="filtrarArchivosEstudiante('todos', this)">Todos (${archivos.length})</button>`;
    tiposPresentes.forEach(function(tipo) {
      const count = archivos.filter(function(a){ return obtenerTipoVisor(a.nombre).etiqueta === tipo; }).length;
      filtrosEl.innerHTML += `<button class="file-type-btn" onclick="filtrarArchivosEstudiante('${tipo}', this)">${tipo} (${count})</button>`;
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
  archivos.forEach(function (archivo, indice) {
    const indiceReal = todosList.indexOf(archivo);
    const tipo = obtenerTipoVisor(archivo.nombre);
    const ext  = (archivo.nombre || "").split(".").pop().toLowerCase();

    const item = document.createElement("div");
    item.className = "pdf-item-usuario";
    item.dataset.tipo = tipo.etiqueta;

    // Decide qué botones mostrar
    let botonesHTML = `<a href="${archivo.base64}" download="${archivo.nombre}" class="btn btn-secondary btn-sm">⬇️ Descargar</a>`;

    if (tipo.visor === "iframe" || tipo.visor === "imagen" || tipo.visor === "video" || tipo.visor === "audio") {
      botonesHTML = `
        <button onclick="abrirVisorPdf(${indiceReal})" class="btn btn-primary btn-sm">👁️ Ver</button>
        ${botonesHTML}
      `;
    } else if (tipo.visor === "office365") {
      botonesHTML = `
        <button onclick="abrirVisorPdf(${indiceReal})" class="btn btn-primary btn-sm">👁️ Ver online</button>
        ${botonesHTML}
      `;
    }

    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">${tipo.icono}</span>
        <div>
          <div class="pdf-item-nombre">${escapeHtml(archivo.nombre)}</div>
          <div style="display:flex; gap:6px; margin-top:3px; align-items:center;">
            <span class="file-badge file-badge-${ext}">${tipo.etiqueta}</span>
            <span class="pdf-item-tamaño">${formatearBytes(archivo.tamaño)}</span>
          </div>
        </div>
      </div>
      <div class="pdf-item-acciones">${botonesHTML}</div>
    `;
    contenedor.appendChild(item);
  });
}

function filtrarArchivosEstudiante(tipo, btnEl) {
  const semana = estado.semanaActiva;
  if (!semana) return;
  const archivos = semana.archivos_pdf || [];

  document.querySelectorAll(".file-type-filters .file-type-btn").forEach(function(b) {
    b.classList.remove("active");
  });
  if (btnEl) btnEl.classList.add("active");

  const contenedor = document.getElementById("listaArchivosEstudiante");
  if (!contenedor) return;

  const filtrados = tipo === "todos"
    ? archivos
    : archivos.filter(function(a) { return obtenerTipoVisor(a.nombre).etiqueta === tipo; });

  renderizarItemsArchivos(filtrados, contenedor, archivos);
  cerrarVisorPdf();
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

function abrirVisorPdf(indice) {
  const semana = estado.semanaActiva;
  if (!semana || !semana.archivos_pdf || !semana.archivos_pdf[indice]) return;

  const archivo = semana.archivos_pdf[indice];
  const tipo    = obtenerTipoVisor(archivo.nombre);
  const wrapper = document.getElementById("pdfViewerWrapper");
  const nombre  = document.getElementById("pdfViewerNombre");
  const descBtn = document.getElementById("pdfDescargarBtn");
  const contenidoVisor = document.getElementById("visorContenido");

  if (!wrapper || !contenidoVisor) return;

  archivoVisorActivo = indice;
  if (descBtn)  { descBtn.href = archivo.base64; descBtn.download = archivo.nombre; }
  if (nombre)   nombre.textContent = archivo.nombre;

  // Limpiar visor anterior
  contenidoVisor.innerHTML = "";

  if (tipo.visor === "iframe" || tipo.visor === "descarga") {
    // PDF y TXT → iframe
    const frame = document.createElement("iframe");
    frame.className = "pdf-visor-frame";
    frame.title = archivo.nombre;
    frame.src = archivo.base64;
    contenidoVisor.appendChild(frame);

  } else if (tipo.visor === "imagen") {
    // Imágenes → <img>
    const img = document.createElement("img");
    img.src = archivo.base64;
    img.alt = archivo.nombre;
    img.className = "visor-imagen";
    contenidoVisor.appendChild(img);

  } else if (tipo.visor === "video") {
    const vid = document.createElement("video");
    vid.src = archivo.base64;
    vid.controls = true;
    vid.className = "visor-video";
    contenidoVisor.appendChild(vid);

  } else if (tipo.visor === "audio") {
    const aud = document.createElement("audio");
    aud.src = archivo.base64;
    aud.controls = true;
    aud.className = "visor-audio";
    contenidoVisor.appendChild(aud);

  } else if (tipo.visor === "office365") {
    // Para DOCX/PPTX/XLSX sólo podemos ofrecer descarga + mensaje
    // (base64 no es URL pública para office online viewer)
    contenidoVisor.innerHTML = `
      <div class="visor-no-preview">
        <div class="visor-no-preview-icon">${tipo.icono}</div>
        <p class="visor-no-preview-titulo">Vista previa no disponible</p>
        <p class="visor-no-preview-msg">
          Los archivos <strong>${tipo.etiqueta}</strong> no pueden previsualizarse directamente en el navegador.
          Descárgalo para abrirlo con la aplicación correspondiente.
        </p>
        <a href="${archivo.base64}" download="${archivo.nombre}" class="btn btn-primary">
          ⬇️ Descargar ${archivo.nombre}
        </a>
      </div>`;
  }

  wrapper.classList.remove("hidden");
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarVisorPdf() {
  const wrapper = document.getElementById("pdfViewerWrapper");
  const contenidoVisor = document.getElementById("visorContenido");
  if (wrapper) wrapper.classList.add("hidden");
  if (contenidoVisor) contenidoVisor.innerHTML = "";
  archivoVisorActivo = -1;
}

window.filtrarArchivosEstudiante = filtrarArchivosEstudiante;

function volverAGrilla() {
  estado.semanaActiva = null;
  estado.vistaActual = "grid";

  const grilla = document.getElementById("vistaGrid");
  const detalle = document.getElementById("vistaDetalle");

  if (grilla) grilla.classList.remove("hidden");
  if (detalle) detalle.classList.add("hidden");

  renderizarGrillaSemanas();
  renderizarEstadisticas();
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

window.volverAGrilla = volverAGrilla;
window.cerrarSesion = cerrarSesion;
window.abrirVisorPdf = abrirVisorPdf;
window.cerrarVisorPdf = cerrarVisorPdf;
