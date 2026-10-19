/* =========================================================
   dashboard.js — главная панель: KPI, графики, уведомления
   ========================================================= */

(function () {
  if (!initLayout("dashboard")) return;

  const simulateBtn = document.getElementById("simulateBtn");
  simulateBtn.innerHTML = icon("refresh") + " Обновить показания";

  function kpi(iconName, tone, label, value, note) {
    return '<article class="card kpi">' +
      '<div class="kpi-top"><span>' + label + '</span><span class="kpi-icon ' + tone + '">' + icon(iconName) + "</span></div>" +
      '<div class="kpi-value mono">' + value + "</div>" +
      '<div class="kpi-note">' + note + "</div></article>";
  }

  function renderKpi(rooms, devices, incidents, notifications) {
    const statuses = rooms.map(roomStatus);
    const countOf = function (s) { return statuses.filter(function (x) { return x === s; }).length; };
    const online = devices.filter(function (d) { return d.status === "online"; }).length;
    const open = incidents.filter(function (i) { return i.status !== "resolved"; });
    const highOpen = open.filter(function (i) { return i.priority === "high"; }).length;
    const energy = sum(rooms, function (r) { return r.energy; });
    const baseline = sum(rooms, function (r) { return r.baseline; });
    const diff = Math.round((energy / baseline - 1) * 100);
    const avgTemp = sum(rooms, function (r) { return r.temperature; }) / rooms.length;
    const avgCo2 = sum(rooms, function (r) { return r.co2; }) / rooms.length;
    const critical = notifications.filter(function (n) { return n.level === "critical"; }).length;

    document.getElementById("kpiGrid").innerHTML =
      kpi("rooms", "tone-accent", "Помещения", rooms.length,
        countOf("normal") + " в норме · " + countOf("warning") + " внимание · " + countOf("critical") + " критично") +
      kpi("devices", "tone-ok", "Устройства online", online + "<small>/" + devices.length + "</small>",
        (devices.length - online) + " не в сети") +
      kpi("incidents", "tone-warn", "Открытые инциденты", open.length,
        "высокий приоритет: " + highOpen) +
      kpi("bolt", "tone-info", "Энергия сейчас", energy.toFixed(1) + "<small> kWh</small>",
        (diff >= 0 ? "+" : "") + diff + "% к базовой линии") +
      kpi("bell", "tone-crit", "Предупреждения", notifications.length,
        "критических: " + critical) +
      kpi("thermo", "tone-accent", "Средняя температура", avgTemp.toFixed(1) + "<small> °C</small>",
        "CO₂ в среднем " + Math.round(avgCo2) + " ppm");
  }

  function renderCharts(rooms, devices, meta) {
    const p = chartPalette();

    // 1. Энергия по корпусам
    const byBuilding = BUILDINGS.map(function (b) {
      const list = rooms.filter(function (r) { return r.building === b; });
      const fact = sum(list, function (r) { return r.energy; });
      const base = sum(list, function (r) { return r.baseline; });
      return { name: b, fact: +fact.toFixed(1), level: energyLevel(fact, base) };
    });
    makeChart("energyChart", {
      type: "bar",
      data: {
        labels: byBuilding.map(function (b) { return b.name; }),
        datasets: [{
          label: "Энергия, kWh",
          data: byBuilding.map(function (b) { return b.fact; }),
          backgroundColor: byBuilding.map(function (b) { return b.level === "normal" ? p.accent : levelColor(b.level, p); }),
          borderRadius: 8, maxBarThickness: 56
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: p.grid } }, x: { grid: { display: false } } } }
    });

    // 2. Статус устройств
    const online = devices.filter(function (d) { return d.status === "online"; }).length;
    const offline = devices.length - online;
    document.getElementById("deviceStatusNote").textContent = Math.round(online / devices.length * 100) + "% в сети";
    makeChart("deviceChart", {
      type: "doughnut",
      data: {
        labels: ["Online", "Offline"],
        datasets: [{ data: [online, offline], backgroundColor: [p.ok, p.crit], borderColor: p.surface, borderWidth: 3 }]
      },
      options: { cutout: "68%", plugins: { legend: { position: "bottom" } } }
    });

    // 3. Тренд средней температуры и CO2
    const len = Math.min(meta.ticks.length, rooms[0].history.temperature.length);
    const labels = meta.ticks.slice(-len).map(formatTime);
    const avgAt = function (field, i) {
      return sum(rooms, function (r) { const h = r.history[field]; return h[h.length - len + i]; }) / rooms.length;
    };
    const temps = [], co2 = [];
    for (let i = 0; i < len; i++) {
      temps.push(+avgAt("temperature", i).toFixed(1));
      co2.push(Math.round(avgAt("co2", i)));
    }
    makeChart("tempChart", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Температура, °C", data: temps, borderColor: p.warn, backgroundColor: p.warn, tension: .35, yAxisID: "y", pointRadius: 3 },
          { label: "CO₂, ppm", data: co2, borderColor: p.accent, backgroundColor: p.accent, tension: .35, yAxisID: "y1", pointRadius: 3, borderDash: [6, 4] }
        ]
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: { position: "left", title: { display: true, text: "°C" }, grid: { color: p.grid } },
          y1: { position: "right", title: { display: true, text: "ppm" }, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderLists(rooms, incidents, notifications) {
    document.getElementById("alertList").innerHTML = notifications.length
      ? notifications.slice(0, 6).map(alertHtml).join("") +
        (notifications.length > 6 ? '<p class="muted" style="margin:4px 0 0;font-size:13px">и ещё ' + (notifications.length - 6) + " — см. колокольчик или AI Analytics</p>" : "")
      : '<div class="empty">Предупреждений нет — все показатели в норме.</div>';

    const attention = rooms
      .map(function (r) { return { room: r, status: roomStatus(r) }; })
      .filter(function (x) { return x.status !== "normal"; })
      .sort(function (a, b) { return LEVEL_RANK[b.status] - LEVEL_RANK[a.status]; });

    document.getElementById("attentionBody").innerHTML = attention.length
      ? attention.slice(0, 7).map(function (x) {
          const r = x.room;
          return "<tr><td><b>" + r.id + '</b><br><small class="muted">' + escapeHtml(r.type) + "</small></td>" +
            '<td class="mono val-' + temperatureLevel(r.temperature) + '">' + r.temperature + "</td>" +
            '<td class="mono val-' + co2Level(r.co2) + '">' + r.co2 + "</td>" +
            '<td class="mono val-' + energyLevel(r.energy, r.baseline) + '">' + r.energy + "</td>" +
            "<td>" + badge(x.status) + "</td></tr>";
        }).join("")
      : '<tr><td colspan="5" class="empty">Все помещения в норме</td></tr>';

    const recent = incidents.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 5);
    document.getElementById("recentIncidents").innerHTML = recent.length
      ? recent.map(function (i) {
          return "<tr><td class=\"mono\">" + i.id + "</td><td>" + escapeHtml(i.title) + "</td><td>" + escapeHtml(i.room) + "</td>" +
            "<td>" + badge(i.priority) + "</td><td>" + badge(i.status) + "</td></tr>";
        }).join("")
      : '<tr><td colspan="5" class="empty">Инцидентов нет</td></tr>';
  }

  function render() {
    const rooms = getRooms();
    const devices = getDevices();
    const incidents = getIncidents();
    const meta = getMeta();
    const settings = getSettings();
    const notifications = buildNotifications(rooms, devices);

    document.getElementById("campusLine").textContent = settings.campusName + " · данные на " + formatTime(meta.ticks[meta.ticks.length - 1]);
    renderKpi(rooms, devices, incidents, notifications);
    renderCharts(rooms, devices, meta);
    renderLists(rooms, incidents, notifications);
  }

  function updateLive() {
    const s = getSettings();
    const live = document.getElementById("liveStatus");
    live.classList.toggle("paused", !s.autoSimulate);
    live.textContent = s.autoSimulate ? "Автообновление каждые " + s.interval + " с" : "Автообновление выключено";
  }

  function tick() {
    render();
    refreshLayout("dashboard");
  }

  simulateBtn.addEventListener("click", function () {
    simulateAll();
    tick();
    toast("Показания датчиков обновлены");
  });

  document.addEventListener("themechange", render);

  render();
  updateLive();
  startAutoSimulation(tick);
})();
