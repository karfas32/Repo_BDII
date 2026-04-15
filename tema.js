/* ============================================================
   PROYECTO WEB - UPLA
   Archivo: tema.js
   Descripción: Sistema de cambio de tema claro / oscuro
   ============================================================ */

const TEMA_KEY = "upla_tema";

(function aplicarTemaInicial() {
  const temaGuardado = localStorage.getItem(TEMA_KEY) || "oscuro";
  document.documentElement.setAttribute("data-tema", temaGuardado);
})();

document.addEventListener("DOMContentLoaded", function () {
  actualizarIconTema();
});

function toggleTema() {
  const temaActual = document.documentElement.getAttribute("data-tema") || "oscuro";
  const nuevoTema = temaActual === "oscuro" ? "claro" : "oscuro";

  document.documentElement.setAttribute("data-tema", nuevoTema);
  localStorage.setItem(TEMA_KEY, nuevoTema);
  actualizarIconTema();
}

function actualizarIconTema() {
  const icono = document.getElementById("iconTema");
  const temaActual = document.documentElement.getAttribute("data-tema") || "oscuro";
  if (icono) {
    icono.textContent = temaActual === "oscuro" ? "☀️" : "🌙";
  }
}

window.toggleTema = toggleTema;