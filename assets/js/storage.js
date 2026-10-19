/* =========================================================
   storage.js — слой хранения данных в localStorage
   saveData / loadData / resetData + настройки и сессия.
   Если localStorage недоступен, данные живут в памяти до
   перезагрузки страницы (сайт при этом не ломается).
   ========================================================= */

const KEYS = {
  rooms: "sc_rooms",
  devices: "sc_devices",
  incidents: "sc_incidents",
  meta: "sc_meta",
  settings: "sc_settings",
  session: "sc_session",
  theme: "sc_theme"
};

const memoryStore = {};

function saveData(key, data) {
  const raw = JSON.stringify(data);
  try {
    localStorage.setItem(key, raw);
  } catch (e) {
    memoryStore[key] = raw;
  }
}

function loadData(key, fallback) {
  if (fallback === undefined) fallback = [];
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {
    raw = null;
  }
  if (raw === null && key in memoryStore) raw = memoryStore[key];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function removeData(key) {
  try { localStorage.removeItem(key); } catch (e) { /* нет доступа */ }
  delete memoryStore[key];
}

// Сброс к тестовым данным (настройки, тема и сессия не трогаются)
function resetData() {
  const seed = createSeedData();
  saveData(KEYS.rooms, seed.rooms);
  saveData(KEYS.devices, seed.devices);
  saveData(KEYS.incidents, seed.incidents);
  saveData(KEYS.meta, seed.meta);
  return seed;
}

// При первом запуске заполняем хранилище тестовыми данными
function ensureData() {
  const rooms = loadData(KEYS.rooms, null);
  if (!Array.isArray(rooms) || rooms.length === 0) resetData();
}

const getRooms = function () { ensureData(); return loadData(KEYS.rooms); };
const getDevices = function () { ensureData(); return loadData(KEYS.devices); };
const getIncidents = function () { ensureData(); return loadData(KEYS.incidents); };
const getMeta = function () { ensureData(); return loadData(KEYS.meta, { ticks: [], nextIncidentId: 1 }); };

const saveRooms = function (rooms) { saveData(KEYS.rooms, rooms); };
const saveDevices = function (devices) { saveData(KEYS.devices, devices); };
const saveIncidents = function (incidents) { saveData(KEYS.incidents, incidents); };
const saveMeta = function (meta) { saveData(KEYS.meta, meta); };

/* ---------- Настройки ---------- */

const DEFAULT_SETTINGS = {
  campusName: "Политехнический колледж — Smart Campus",
  autoSimulate: true,
  interval: 15,      // секунд между обновлениями показаний
  zThreshold: 2      // порог z-score для статистической аномалии
};

function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, loadData(KEYS.settings, {}));
}

function saveSettings(settings) {
  saveData(KEYS.settings, settings);
}

/* ---------- Тема ---------- */

function getTheme() {
  const t = loadData(KEYS.theme, "dark");
  return t === "light" ? "light" : "dark";
}

function setTheme(theme) {
  saveData(KEYS.theme, theme);
  document.documentElement.classList.toggle("light", theme === "light");
}

/* ---------- Сессия (учебная имитация входа) ---------- */

const ROLES = {
  Administrator: { label: "Администратор", canEdit: true, canDelete: true, canReset: true },
  Engineer: { label: "Инженер", canEdit: true, canDelete: false, canReset: false },
  Operator: { label: "Оператор", canEdit: false, canDelete: false, canReset: false }
};

function getSession() {
  return loadData(KEYS.session, null);
}

function setSession(session) {
  saveData(KEYS.session, session);
}

function logout() {
  removeData(KEYS.session);
  window.location.href = "index.html";
}

function can(permission) {
  const s = getSession();
  if (!s || !ROLES[s.role]) return false;
  return ROLES[s.role][permission] === true;
}

// Объём занятого хранилища (для страницы Settings)
function storageSize() {
  let bytes = 0;
  Object.keys(KEYS).forEach(function (k) {
    const raw = (function () {
      try { return localStorage.getItem(KEYS[k]); } catch (e) { return memoryStore[KEYS[k]]; }
    })();
    if (raw) bytes += raw.length * 2;
  });
  return bytes;
}
