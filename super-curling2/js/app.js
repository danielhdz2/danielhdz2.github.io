// Registro del service worker (ruta relativa: funciona en GitHub Pages bajo /nombre-repo/)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW no registrado:', err));
  });
}

// Botón propio de instalación
let promptInstalacion = null;
const btn = document.getElementById('btn-instalar');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  promptInstalacion = e;
  btn.hidden = false;
});
btn.addEventListener('click', async () => {
  if (!promptInstalacion) return;
  promptInstalacion.prompt();
  await promptInstalacion.userChoice;
  promptInstalacion = null;
  btn.hidden = true;
});
window.addEventListener('appinstalled', () => { btn.hidden = true; });

// Ayuda para iOS (Safari no dispara beforeinstallprompt)
const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (esIOS && !instalada) document.getElementById('ayuda-ios').hidden = false;

// Indicador en línea / sin conexión
const estado = document.getElementById('estado');
function actualizarEstado() {
  const on = navigator.onLine;
  estado.textContent = on ? 'En línea' : 'Sin conexión (modo offline)';
  estado.classList.toggle('off', !on);
}
window.addEventListener('online', actualizarEstado);
window.addEventListener('offline', actualizarEstado);
actualizarEstado();
