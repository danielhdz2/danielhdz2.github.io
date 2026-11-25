(() => {
  'use strict';

  /* ---------- Constantes ---------- */
  const MS_TO = { kmh: 3.6, mph: 2.236936 };      // m/s → unidad
  const KM_TO_MI = 0.621371;
  const LABEL = { kmh: 'km/h', mph: 'mph' };
  const ARC_LEN = 424.1;                           // 270° de un círculo r=90
  const NOISE_MS = 0.6;                            // bajo esto se considera detenido (~2 km/h)
  const MAX_ACCURACY_M = 50;                       // ignora fixes muy imprecisos
  const $ = (id) => document.getElementById(id);

  /* ---------- Configuración persistente ---------- */
  const KEY = 'velocimetro-settings';
  const loadSettings = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* modo privado */ } };
  const settings = Object.assign(
    { unit: 'kmh', limit: 90, alarmOn: true, sound: true, vibrate: true },
    loadSettings()
  );

  /* ---------- Estado ---------- */
  const state = {
    running: false, watchId: null, wakeLock: null,
    speedMs: 0, maxMs: 0, sumMs: 0, samples: 0,
    distM: 0, last: null, accuracy: null
  };

  /* ---------- Utilidades ---------- */
  const toUnit = (ms) => ms * MS_TO[settings.unit];
  const fmt = (n) => Math.round(n).toString();

  function haversine(a, b) {
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------- Audio (oscilador: no descarga ningún archivo) ---------- */
  let audioCtx = null;
  function unlockAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function beep() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    [0, 0.3].forEach((off) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.4, t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + off); o.stop(t + off + 0.22);
    });
  }

  /* ---------- Alarma ---------- */
  let alarming = false, alarmTimer = null;
  function alarmTick() {
    if (settings.sound) beep();
    if (settings.vibrate && navigator.vibrate) navigator.vibrate([250, 100, 250]);
  }
  function startAlarm() {
    if (alarming) return;
    alarming = true;
    document.body.classList.add('alarm');
    $('alarmBanner').hidden = false;
    alarmTick();
    alarmTimer = setInterval(alarmTick, 1200);
  }
  function stopAlarm() {
    if (!alarming) return;
    alarming = false;
    clearInterval(alarmTimer); alarmTimer = null;
    document.body.classList.remove('alarm');
    $('alarmBanner').hidden = true;
    if (navigator.vibrate) navigator.vibrate(0);
  }
  function evaluateAlarm() {
    if (!state.running || !settings.alarmOn) return stopAlarm();
    const s = toUnit(state.speedMs);
    if (!alarming && s > settings.limit) startAlarm();
    else if (alarming && s <= settings.limit - 1) stopAlarm(); // histéresis de 1 unidad
  }

  /* ---------- Render ---------- */
  function render() {
    const u = settings.unit;
    const s = toUnit(state.speedMs);
    $('speed').textContent = fmt(s);
    $('unitLabel').textContent = LABEL[u];
    $('limitLabel').textContent = settings.alarmOn ? `Límite: ${settings.limit} ${LABEL[u]}` : 'Alarma desactivada';

    const scaleMax = Math.max(settings.limit * 1.3, u === 'kmh' ? 140 : 90);
    const frac = Math.min(s / scaleMax, 1);
    $('arc').style.strokeDasharray = `${(frac * ARC_LEN).toFixed(1)} 565.5`;

    $('maxSpeed').textContent = fmt(toUnit(state.maxMs));
    $('avgSpeed').textContent = state.samples ? fmt(toUnit(state.sumMs / state.samples)) : '0';
    const dist = u === 'kmh' ? state.distM / 1000 : (state.distM / 1000) * KM_TO_MI;
    $('distance').textContent = dist.toFixed(2) + (u === 'kmh' ? ' km' : ' mi');
    $('accuracy').textContent = state.accuracy == null ? '—' : `±${Math.round(state.accuracy)} m`;
  }

  function renderControls() {
    document.querySelectorAll('[data-unit]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.unit === settings.unit)));
    $('limitInput').value = settings.limit;
    $('alarmOn').checked = settings.alarmOn;
    $('soundOn').checked = settings.sound;
    $('vibrateOn').checked = settings.vibrate;
  }

  function setGps(stateName, text) {
    const chip = $('gpsChip');
    chip.dataset.state = stateName;
    chip.textContent = 'GPS: ' + text;
  }

  /* ---------- Geolocalización ---------- */
  function onPosition(pos) {
    const c = pos.coords;
    const cur = { lat: c.latitude, lon: c.longitude, t: pos.timestamp };
    state.accuracy = c.accuracy;
    setGps(c.accuracy <= 20 ? 'ok' : 'wait', c.accuracy <= 20 ? 'buena señal' : 'señal débil');

    let v = c.speed; // m/s (Doppler), la fuente más precisa
    const d = state.last ? haversine(state.last, cur) : 0;
    const dt = state.last ? (cur.t - state.last.t) / 1000 : 0;

    if (v == null || Number.isNaN(v)) {          // respaldo: calcular por distancia/tiempo
      v = (dt > 0 && c.accuracy <= MAX_ACCURACY_M) ? d / dt : state.speedMs;
    }
    if (v < NOISE_MS) v = 0;                     // filtra el "ruido" del GPS detenido

    state.speedMs = v;
    if (v > state.maxMs) state.maxMs = v;
    if (v > 0) { state.sumMs += v; state.samples++; }
    if (v > 0 && c.accuracy <= MAX_ACCURACY_M) state.distM += d;
    state.last = cur;

    render();
    evaluateAlarm();
  }

  function onError(err) {
    const msgs = {
      1: ['off', 'permiso denegado', 'Permite el acceso a la ubicación en el navegador para medir la velocidad.'],
      2: ['error', 'sin señal', 'No se pudo obtener la posición. Sal a un lugar con vista al cielo.'],
      3: ['wait', 'buscando…', 'Buscando señal GPS…']
    };
    const m = msgs[err.code] || ['error', 'error', err.message];
    setGps(m[0], m[1]);
    $('hint').textContent = m[2];
    if (err.code === 1) stop();
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        state.wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch { /* no crítico */ }
  }

  function start() {
    if (!('geolocation' in navigator)) {
      $('hint').textContent = 'Este dispositivo no soporta geolocalización.';
      return;
    }
    unlockAudio(); // requiere gesto del usuario
    state.running = true;
    state.last = null;
    setGps('wait', 'buscando…');
    $('hint').textContent = 'Mantén la pantalla encendida mientras conduces. El GPS no consume datos móviles.';
    state.watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true, maximumAge: 0, timeout: 15000
    });
    requestWakeLock();
    $('startBtn').textContent = 'Detener';
    $('startBtn').classList.add('running');
  }

  function stop() {
    state.running = false;
    if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
    if (state.wakeLock) { state.wakeLock.release().catch(() => {}); state.wakeLock = null; }
    state.speedMs = 0; state.last = null;
    stopAlarm();
    setGps('idle', 'apagado');
    $('startBtn').textContent = 'Iniciar';
    $('startBtn').classList.remove('running');
    render();
  }

  function resetTrip() {
    Object.assign(state, { maxMs: 0, sumMs: 0, samples: 0, distM: 0, last: null });
    render();
  }

  /* ---------- Eventos de UI ---------- */
  document.querySelectorAll('[data-unit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.unit;
      if (next === settings.unit) return;
      const factor = next === 'mph' ? KM_TO_MI : 1 / KM_TO_MI;
      settings.limit = Math.max(1, Math.round(settings.limit * factor));
      settings.unit = next;
      saveSettings(); renderControls(); render(); evaluateAlarm();
    });
  });

  function setLimit(v) {
    const n = Math.min(400, Math.max(1, Math.round(Number(v) || settings.limit)));
    settings.limit = n;
    saveSettings(); renderControls(); render(); evaluateAlarm();
  }
  $('limitMinus').addEventListener('click', () => setLimit(settings.limit - 5));
  $('limitPlus').addEventListener('click', () => setLimit(settings.limit + 5));
  $('limitInput').addEventListener('change', (e) => setLimit(e.target.value));

  [['alarmOn', 'alarmOn'], ['soundOn', 'sound'], ['vibrateOn', 'vibrate']].forEach(([id, key]) => {
    $(id).addEventListener('change', (e) => {
      settings[key] = e.target.checked;
      if (e.target.checked && key === 'sound') unlockAudio();
      saveSettings(); render(); evaluateAlarm();
    });
  });

  $('startBtn').addEventListener('click', () => (state.running ? stop() : start()));
  $('resetBtn').addEventListener('click', resetTrip);
  $('testBtn').addEventListener('click', () => {
    unlockAudio();
    startAlarm();
    setTimeout(() => { if (!(state.running && toUnit(state.speedMs) > settings.limit)) stopAlarm(); }, 3000);
  });

  // El bloqueo de pantalla se libera al ocultar la app: volver a pedirlo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.running) requestWakeLock();
  });

  /* ---------- Estado de red ---------- */
  function updateNet() {
    const on = navigator.onLine;
    $('netChip').dataset.state = on ? 'on' : 'off';
    $('netChip').textContent = on ? 'En línea' : 'Sin conexión';
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);

  /* ---------- PWA: instalación y service worker ---------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('installBtn').hidden = false;
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }

  /* ---------- Inicio ---------- */
  renderControls();
  render();
  updateNet();
})();
