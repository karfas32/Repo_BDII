/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: main.js
   Descripción: Portal del estudiante con Supabase
   ============================================================ */

const SESSION_KEY = "upla_session";
const UNIDADES = [
  { numero: 1, nombre: "Unidad I", descripcion: "Fundamentos y Modelo Relacional", semanas: [1, 2, 3, 4] },
  { numero: 2, nombre: "Unidad II", descripcion: "Diseño Avanzado de Bases de Datos", semanas: [5, 6, 7, 8] },
  { numero: 3, nombre: "Unidad III", descripcion: "Programación en Base de Datos", semanas: [9, 10, 11, 12] },
  { numero: 4, nombre: "Unidad IV", descripcion: "Administración y Seguridad", semanas: [13, 14, 15, 16] }
];

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

function renderizarPdfsDetalle(pdfs) {
  const seccion = document.getElementById("detallePdfSection");
  const lista = document.getElementById("detallePdfLista");
  if (!seccion || !lista) return;

  if (!pdfs || pdfs.length === 0) {
    seccion.classList.add("hidden");
    return;
  }

  seccion.classList.remove("hidden");
  lista.innerHTML = "";
  cerrarVisorPdf();

  pdfs.forEach(function (pdf, indice) {
    const item = document.createElement("div");
    item.className = "pdf-item-usuario";
    item.innerHTML = `
      <div class="pdf-item-info">
        <span class="pdf-item-icono">📄</span>
        <div>
          <div class="pdf-item-nombre">${pdf.nombre}</div>
          <div class="pdf-item-tamaño">${formatearBytes(pdf.tamaño)}</div>
        </div>
      </div>
      <div class="pdf-item-acciones">
        <button onclick="abrirVisorPdf(${indice})" class="btn primary-btn sm">👁️ Ver</button>
        <a href="${pdf.base64}" download="${pdf.nombre}" class="btn secondary-btn sm">⬇️ Descargar</a>
      </div>
    `;
    lista.appendChild(item);
  });
}

function formatearBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function abrirVisorPdf(indice) {
  const semana = estado.semanaActiva;
  if (!semana || !semana.archivos_pdf || !semana.archivos_pdf[indice]) return;

  const pdf = semana.archivos_pdf[indice];
  const frame = document.getElementById("pdfVisorFrame");
  const wrapper = document.getElementById("pdfViewerWrapper");
  const nombre = document.getElementById("pdfViewerNombre");
  const descBtn = document.getElementById("pdfDescargarBtn");

  if (!frame || !wrapper) return;

  frame.src = pdf.base64;
  if (descBtn) {
    descBtn.href = pdf.base64;
    descBtn.download = pdf.nombre;
  }
  if (nombre) nombre.textContent = pdf.nombre;
  wrapper.classList.remove("hidden");
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarVisorPdf() {
  const wrapper = document.getElementById("pdfViewerWrapper");
  const frame = document.getElementById("pdfVisorFrame");
  if (wrapper) wrapper.classList.add("hidden");
  if (frame) frame.src = "";
}

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
