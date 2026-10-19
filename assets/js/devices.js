/* =========================================================
   devices.js — список IoT-устройств, статусы online/offline
   ========================================================= */

(function () {
  if (!initLayout("devices")) return;

  const search = document.getElementById("deviceSearch");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("deviceStatusFilter");

  Object.keys(DEVICE_TYPES).forEach(function (t) {
    typeFilter.insertAdjacentHTML("beforeend", '<option value="' + t + '">' + t + "</option>");
  });

  const q = getQueryParam("q");
  if (q) search.value = q;

  // Значение, которое сейчас передаёт устройство
  function deviceValue(device, roomsById) {
    if (device.status === "offline") return '<span class="muted">нет данных</span>';
    const info = DEVICE_TYPES[device.type];
    const room = roomsById[device.room];
    if (info.field && room) {
      const level = metricLevel(room, info.field);
      return '<span class="mono val-' + level + '">' + room[info.field] + " " + info.unit + "</span>";
    }
    return device.type === "Camera" ? "запись идёт" : "замок закрыт";
  }

  function renderKpi(devices) {
    const online = devices.filter(function (d) { return d.status === "online"; }).length;
    const sensors = devices.filter(function (d) { return DEVICE_TYPES[d.type].field; }).length;
    const card = function (ic, tone, label, value) {
      return '<article class="card kpi"><div class="kpi-top"><span>' + label + '</span><span class="kpi-icon ' + tone + '">' + icon(ic) +
        '</span></div><div class="kpi-value mono">' + value + "</div></article>";
    };
    document.getElementById("deviceKpi").innerHTML =
      card("devices", "tone-accent", "Всего устройств", devices.length) +
      card("check", "tone-ok", "Online", online) +
      card("wifiOff", "tone-crit", "Offline", devices.length - online) +
      card("thermo", "tone-info", "Датчиков с показаниями", sensors);
  }

  function render() {
    const devices = getDevices();
    const roomsById = {};
    getRooms().forEach(function (r) { roomsById[r.id] = r; });

    const text = search.value.trim().toLowerCase();
    const list = devices.filter(function (d) {
      const hay = (d.id + " " + d.room + " " + d.room.replace("-", "") + " " + d.type).toLowerCase();
      return (!text || text.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; })) &&
        (!typeFilter.value || d.type === typeFilter.value) &&
        (!statusFilter.value || d.status === statusFilter.value);
    });

    renderKpi(devices);
    document.getElementById("deviceCount").textContent = "Найдено: " + list.length + " из " + devices.length;

    const allowed = can("canEdit");
    document.getElementById("devicesBody").innerHTML = list.length
      ? list.map(function (d) {
          const action = d.status === "offline" ? "Перезапустить" : "Отключить";
          return "<tr>" +
            '<td class="mono"><b>' + d.id + "</b></td>" +
            "<td>" + d.room + "</td>" +
            "<td>" + d.type + "</td>" +
            "<td>" + deviceValue(d, roomsById) + "</td>" +
            "<td>" + badge(d.status) + "</td>" +
            '<td class="mono">' + formatDateTime(d.updatedAt) + "</td>" +
            '<td class="actions"><button class="btn ghost sm" data-id="' + d.id + '"' +
              (allowed ? "" : ' disabled title="Недоступно для роли Operator"') + ">" + action + "</button></td>" +
            "</tr>";
        }).join("")
      : '<tr><td colspan="7" class="empty">Устройства не найдены</td></tr>';
  }

  // Имитация перезапуска / отключения устройства
  document.getElementById("devicesBody").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-id]");
    if (!btn || btn.disabled) return;
    const devices = getDevices();
    const device = devices.find(function (d) { return d.id === btn.dataset.id; });
    if (!device) return;
    device.status = device.status === "online" ? "offline" : "online";
    if (device.status === "online") device.updatedAt = new Date().toISOString();
    saveDevices(devices);
    render();
    refreshLayout("devices");
    toast(device.id + (device.status === "online" ? " снова в сети" : " отключено"));
  });

  [search, typeFilter, statusFilter].forEach(function (el) {
    el.addEventListener("input", render);
  });

  render();
})();
