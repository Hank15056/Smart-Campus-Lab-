/* =========================================================
   rooms.js — таблица помещений, поиск и фильтры
   ========================================================= */

(function () {
  if (!initLayout("rooms")) return;

  const search = document.getElementById("roomSearch");
  const buildingFilter = document.getElementById("buildingFilter");
  const statusFilter = document.getElementById("statusFilter");

  BUILDINGS.forEach(function (b) {
    buildingFilter.insertAdjacentHTML("beforeend", '<option value="' + b + '">' + b + "</option>");
  });

  // Поиск, пришедший из Topbar (rooms.html?q=...)
  const q = getQueryParam("q");
  if (q) search.value = q;

  function matches(room, text) {
    if (!text) return true;
    const hay = (room.id + " " + room.id.replace("-", "") + " " + room.building + " " + room.type).toLowerCase();
    return text.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function render() {
    const rooms = getRooms();
    const text = search.value.trim();
    const building = buildingFilter.value;
    const status = statusFilter.value;

    const list = rooms.filter(function (r) {
      return matches(r, text) &&
        (!building || r.building === building) &&
        (!status || roomStatus(r) === status);
    });

    document.getElementById("roomCount").textContent = "Найдено: " + list.length + " из " + rooms.length;

    document.getElementById("roomsBody").innerHTML = list.length
      ? list.map(function (r) {
          const load = Math.round(r.occupancy / r.capacity * 100);
          return "<tr>" +
            "<td><b>" + r.id + "</b></td>" +
            "<td>" + r.building + "</td>" +
            '<td class="mono">' + r.floor + "</td>" +
            "<td>" + escapeHtml(r.type) + "</td>" +
            '<td class="mono val-' + temperatureLevel(r.temperature) + '">' + r.temperature + " °C</td>" +
            '<td class="mono val-' + co2Level(r.co2) + '">' + r.co2 + " ppm</td>" +
            '<td class="mono val-' + energyLevel(r.energy, r.baseline) + '">' + r.energy + ' kWh<br><small class="muted">база ' + r.baseline + "</small></td>" +
            '<td class="mono">' + r.occupancy + "/" + r.capacity + ' <small class="muted">(' + load + "%)</small></td>" +
            "<td>" + badge(roomStatus(r)) + "</td>" +
            "</tr>";
        }).join("")
      : '<tr><td colspan="9" class="empty">Ничего не найдено. Измените запрос или сбросьте фильтры.</td></tr>';
  }

  [search, buildingFilter, statusFilter].forEach(function (el) {
    el.addEventListener("input", render);
  });

  render();
})();
