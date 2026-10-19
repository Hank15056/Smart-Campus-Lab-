/* =========================================================
   layout.js — общие элементы всех страниц
   Sidebar, Topbar, уведомления, тема, поиск, тосты,
   окно подтверждения и помощники для Chart.js.
   ========================================================= */

const ICONS = {
  logo: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-5h6v5"/><path d="M12 10h.01"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  rooms: '<path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-4h6v4"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/>',
  devices: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  incidents: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  analytics: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  thermo: '<path d="M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wifiOff: '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.6a10 10 0 0 1 5.2-2.6M19 12.6a10 10 0 0 0-2.1-1.6"/><path d="M12 20h.01"/>',
  brain: '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1V4a2 2 0 0 0-3-1z"/><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'
};

function icon(name, cls) {
  return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
}

// Защита от XSS: текст пользователя всегда экранируется перед вставкой в HTML
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const NAV_ITEMS = [
  ["dashboard", "Dashboard", "dashboard.html"],
  ["rooms", "Помещения", "rooms.html"],
  ["devices", "Устройства", "devices.html"],
  ["incidents", "Инциденты", "incidents.html"],
  ["analytics", "AI Analytics", "analytics.html"],
  ["settings", "Настройки", "settings.html"]
];

const NOTIFY_ICON = { co2: "wind", temp: "thermo", energy: "bolt", offline: "wifiOff" };

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.replace("index.html");
    return null;
  }
  return session;
}

function initials(name) {
  return name.split(/\s+/).map(function (p) { return p[0] || ""; }).join("").slice(0, 2).toUpperCase();
}

function renderSidebar(active) {
  const el = document.getElementById("sidebar");
  const openIncidents = getIncidents().filter(function (i) { return i.status !== "resolved"; }).length;
  const settings = getSettings();
  el.innerHTML =
    '<a class="brand" href="dashboard.html" title="Smart Campus AI">' +
      '<span class="brand-logo">' + icon("logo") + "</span>" +
      '<span class="brand-text"><b>Smart Campus AI</b><small>Панель управления</small></span>' +
    "</a>" +
    '<nav class="nav" aria-label="Основное меню">' +
      NAV_ITEMS.map(function (item) {
        const extra = item[0] === "incidents" && openIncidents
          ? '<span class="count" aria-label="открытых: ' + openIncidents + '">' + openIncidents + "</span>" : "";
        return '<a href="' + item[2] + '" aria-label="' + item[1] + '"' + (item[0] === active ? ' class="active" aria-current="page"' : "") + ">" +
          icon(item[0]) + '<span class="nav-label">' + item[1] + "</span>" + extra + "</a>";
      }).join("") +
    "</nav>" +
    '<div class="sidebar-foot" title="Система онлайн">' +
      '<span class="live-dot"></span>' +
      '<span class="foot-text">' + escapeHtml(settings.campusName) + "<br>Учебный проект · 2026</span>" +
    "</div>";
}

function renderTopbar() {
  const el = document.getElementById("topbar");
  const session = getSession();
  const role = ROLES[session.role] || ROLES.Operator;
  const theme = getTheme();
  el.innerHTML =
    '<button class="icon-btn burger" id="burgerBtn" aria-label="Открыть меню">' + icon("menu") + "</button>" +
    '<form class="search" id="globalSearch" role="search">' + icon("search") +
      '<input type="search" name="q" placeholder="Поиск помещения или устройства…" aria-label="Глобальный поиск">' +
    "</form>" +
    '<div class="top-actions">' +
      '<button class="icon-btn" id="themeButton" aria-label="Сменить тему" title="Сменить тему">' + icon(theme === "light" ? "moon" : "sun") + "</button>" +
      '<div class="dropdown" id="notifyDropdown">' +
        '<button class="icon-btn" id="notifyBtn" aria-label="Уведомления" title="Уведомления">' + icon("bell") + '<span class="dot-count hidden" id="notifyCount"></span></button>' +
        '<div class="dropdown-panel" id="notifyPanel"></div>' +
      "</div>" +
      '<div class="profile">' +
        '<span class="avatar">' + escapeHtml(initials(session.name)) + "</span>" +
        '<span class="profile-text"><b>' + escapeHtml(session.name) + "</b><small>" + role.label + "</small></span>" +
        '<button class="icon-btn" id="logoutBtn" style="width:32px;height:32px;border:0" aria-label="Выйти" title="Выйти">' + icon("logout") + "</button>" +
      "</div>" +
    "</div>";

  document.getElementById("burgerBtn").addEventListener("click", function () {
    document.body.classList.toggle("menu-open");
  });
  document.addEventListener("click", function (e) {
    if (document.body.classList.contains("menu-open") && !e.target.closest("#sidebar") && !e.target.closest("#burgerBtn")) {
      document.body.classList.remove("menu-open");
    }
    if (!e.target.closest("#notifyDropdown")) {
      document.getElementById("notifyDropdown").classList.remove("open");
    }
  });

  document.getElementById("globalSearch").addEventListener("submit", function (e) {
    e.preventDefault();
    const q = this.q.value.trim();
    if (!q) return;
    // ID устройства (TEMP-A101-01) → страница устройств, иначе → помещения
    const isDevice = /^(TEMP|CO2|PWR|CAM|ACC)/i.test(q) || /sensor|meter|camera|датчик|камера/i.test(q);
    window.location.href = (isDevice ? "devices.html" : "rooms.html") + "?q=" + encodeURIComponent(q);
  });

  document.getElementById("themeButton").addEventListener("click", function () {
    const next = getTheme() === "light" ? "dark" : "light";
    setTheme(next);
    this.innerHTML = icon(next === "light" ? "moon" : "sun");
    document.dispatchEvent(new CustomEvent("themechange"));
  });

  document.getElementById("notifyBtn").addEventListener("click", function () {
    document.getElementById("notifyDropdown").classList.toggle("open");
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
}

function alertHtml(n) {
  const tone = n.level === "critical" ? "tone-crit" : "tone-warn";
  return '<div class="alert"><span class="alert-icon ' + tone + '">' + icon(NOTIFY_ICON[n.kind] || "info") + "</span>" +
    "<div><b>" + escapeHtml(n.title) + "</b><p>" + escapeHtml(n.text) + "</p></div></div>";
}

function renderNotifications() {
  const list = buildNotifications(getRooms(), getDevices());
  const count = document.getElementById("notifyCount");
  const panel = document.getElementById("notifyPanel");
  if (!count || !panel) return list;
  count.textContent = list.length;
  count.classList.toggle("hidden", list.length === 0);
  panel.innerHTML =
    '<div class="dropdown-head"><span>Уведомления</span><a href="analytics.html" style="font-size:13px">Все аномалии →</a></div>' +
    (list.length
      ? '<div class="alert-list">' + list.map(alertHtml).join("") + "</div>"
      : '<div class="empty">Всё в норме — предупреждений нет.</div>');
  return list;
}

// Вызывается на каждой странице приложения
function initLayout(active) {
  const session = requireAuth();
  if (!session) return null;
  ensureData();
  setTheme(getTheme());
  renderSidebar(active);
  renderTopbar();
  renderNotifications();
  if (!document.querySelector(".toast-zone")) {
    const zone = document.createElement("div");
    zone.className = "toast-zone";
    zone.setAttribute("aria-live", "polite");
    document.body.appendChild(zone);
  }
  return session;
}

// Обновить счётчики в меню и уведомления после изменения данных
function refreshLayout(active) {
  renderSidebar(active);
  renderNotifications();
}

/* ---------- Сообщения и подтверждение ---------- */

function toast(message, type) {
  const zone = document.querySelector(".toast-zone");
  if (!zone) return;
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : "");
  el.textContent = message;
  zone.appendChild(el);
  setTimeout(function () { el.remove(); }, 3200);
}

// Своё окно подтверждения вместо confirm(): не блокирует страницу
function confirmDialog(title, text, okText) {
  return new Promise(function (resolve) {
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML =
      '<div class="modal-head"><h2>' + escapeHtml(title) + "</h2></div>" +
      '<div class="modal-body"><p style="margin:0">' + escapeHtml(text) + "</p></div>" +
      '<div class="modal-foot"><button class="btn ghost" value="cancel">Отмена</button>' +
      '<button class="btn danger" value="ok">' + escapeHtml(okText || "Удалить") + "</button></div>";
    document.body.appendChild(dlg);
    dlg.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { dlg.close(b.value); });
    });
    dlg.addEventListener("close", function () {
      resolve(dlg.returnValue === "ok");
      dlg.remove();
    });
    dlg.showModal();
  });
}

/* ---------- Chart.js ---------- */

const chartRegistry = {};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartPalette() {
  return {
    text: cssVar("--muted"), grid: cssVar("--border"), accent: cssVar("--accent"),
    ok: cssVar("--ok"), warn: cssVar("--warn"), crit: cssVar("--crit"), info: cssVar("--info"),
    surface: cssVar("--surface")
  };
}

function levelColor(level, p) {
  return level === "critical" ? p.crit : level === "warning" ? p.warn : p.ok;
}

// Создаёт (или пересоздаёт) график. Если Chart.js не загрузился — показывает подсказку.
function makeChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  if (typeof Chart === "undefined") {
    if (!canvas.parentNode.querySelector(".chart-fallback")) {
      const note = document.createElement("div");
      note.className = "chart-fallback";
      note.textContent = "График не загрузился: Chart.js подключается из интернета (CDN). Проверьте подключение.";
      canvas.parentNode.appendChild(note);
    }
    return null;
  }
  const p = chartPalette();
  Chart.defaults.color = p.text;
  Chart.defaults.borderColor = p.grid;
  Chart.defaults.font.family = cssVar("--font") || "sans-serif";
  if (chartRegistry[canvasId]) chartRegistry[canvasId].destroy();
  config.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 400 } }, config.options || {});
  chartRegistry[canvasId] = new Chart(canvas, config);
  return chartRegistry[canvasId];
}

/* ---------- Мелкие помощники ---------- */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function sum(list, fn) {
  return list.reduce(function (a, x) { return a + fn(x); }, 0);
}

const STATUS_TEXT = {
  normal: "Normal", warning: "Warning", critical: "Critical",
  online: "Online", offline: "Offline",
  open: "Открыт", in_progress: "В работе", resolved: "Решён",
  low: "Низкий", medium: "Средний", high: "Высокий"
};

function badge(value, text) {
  return '<span class="badge ' + escapeHtml(value) + '">' + escapeHtml(text || STATUS_TEXT[value] || value) + "</span>";
}
