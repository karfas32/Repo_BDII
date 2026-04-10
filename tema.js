/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: tema.js
   Descripción: Sistema de cambio de tema claro / oscuro.
                Funciona en todas las páginas (index, admin, login).
                Persiste la preferencia del usuario en localStorage.
   ============================================================ */

/* ── 1. CONSTANTE DE CLAVE EN localStorage ───────────────── */
const TEMA_KEY = "upla_tema";   // "oscuro" | "claro"

/* ── 2. APLICAR TEMA AL CARGAR ───────────────────────────── */
/**
 * Al cargar cualquier página, se aplica inmediatamente el tema
 * guardado para evitar el "flash" de color incorrecto.
 * Se ejecuta fuera de DOMContentLoaded para máxima velocidad.
 */
(function aplicarTemaInicial() {
  const temaGuardado = localStorage.getItem(TEMA_KEY) || "oscuro";
  document.documentElement.setAttribute("data-tema", temaGuardado);
  // El icono se actualiza después cuando el DOM esté listo
})();

/* ── 3. ACTUALIZAR ÍCONO AL CARGAR ───────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  actualizarIconTema();
});

/* ── 4. FUNCIÓN PRINCIPAL: toggleTema ───────────────────── */
/**
 * toggleTema
 * Alterna entre tema oscuro y claro.
 * Se llama desde el onclick del botón en el HTML.
 */
function toggleTema() {
  const temaActual = document.documentElement.getAttribute("data-tema") || "oscuro";
  const nuevoTema  = temaActual === "oscuro" ? "claro" : "oscuro";

  // Aplicar al elemento raíz (afecta a todas las variables CSS)
  document.documentElement.setAttribute("data-tema", nuevoTema);

  // Persistir la preferencia
  localStorage.setItem(TEMA_KEY, nuevoTema);

  // Actualizar el ícono del botón
  actualizarIconTema();
}

/**
 * actualizarIconTema
 * Cambia el emoji del botón según el tema activo:
 * ☀️ cuando es oscuro (invita a cambiar a claro)
 * 🌙 cuando es claro  (invita a cambiar a oscuro)
 */
function actualizarIconTema() {
  const icono     = document.getElementById("iconTema");
  const temaActual = document.documentElement.getAttribute("data-tema") || "oscuro";

  if (icono) {
    icono.textContent = temaActual === "oscuro" ? "☀️" : "🌙";
  }
}

// Exponer globalmente (se llama desde onclick en el HTML)
window.toggleTema = toggleTema;
