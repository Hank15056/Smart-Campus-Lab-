/* =========================================================
   analytics.js — страница AI Analytics
   Список аномалий (причина, уровень риска, рекомендация)
   и графики: CO₂ по помещениям, история температуры,
   энергия относительно базовой линии.
   ========================================================= */

(function () {
  if (!initLayout("analytics")) return;

  const riskFilter = document.getElementById("riskFilter");
  const roomSelect = document.getElementById("roomSelect");

  getRooms().forEach(function (r) {
    roomSelect.insertAdjacentHTML("beforeend", '<option value="' + r.id + '">' + r.id + " · " + escapeHtml(r.type) + "</option>");
  });
  roomSelect.value = "B-204";   // серверная — самый показательный пример

  const RISK_TONE = { critical: "critical", warning: "warning", low: "low" };
  const PRIORITY_BY_RISK = { critical: "high", warning: "medium", low: "low" };

  function renderKpi(anomalies, rooms) {
    const count = function (r) { return anomalies.filter(function (a) { return a.risk === r; }).length; };
    const card = function (ic, tone, label, value, note) {
      return '<article class="card kpi"><div class="kpi-top"><span>' + label + '</span><span class="kpi-icon ' + tone + '">' + icon(ic) +
        '</span></div><div class="kpi-value mono">' + value + '</div><div class="kpi-note">' + note + "</div></article>";
    };
    const affected = {};
    anomalies.forEach(function (a) { affected[a.room] = true; });
    document.getElementById("aiKpi").innerHTML =
      card("brain", "tone-accent", "Найдено аномалий", anomalies.length, "в " + Object.keys(affected).length + " из " + rooms.length + " помещений") +
      card("incidents", "tone-crit", "Высокий риск", count("critical"), "требуют немедленных действий") +
      card("bell", "tone-warn", "Средний риск", count("warning"), "превышен порог или датчик offline") +
      card("analytics", "tone-info", "Низкий риск", count("low"), "резкий скачок по z-score");
  }

  function anomalyHtml(a) {
    const title = a.metric === "device" ? a.metricLabel : a.room + " · " + a.metricLabel;
    const sub = a.metric === "device" ? "Помещение " + a.room : escapeHtml(a.type) + " · " + a.building;
    const link = "incidents.html?new=1" +
      "&room=" + encodeURIComponent(a.room) +
      "&priority=" + PRIORITY_BY_RISK[a.risk] +
      "&title=" + encodeURIComponent(a.metric === "device" ? "Устройство offline: " + a.metricLabel.replace("Устройство ", "") : "Аномалия: " + a.metricLabel + " " + a.valueText) +
      "&comment=" + encodeURIComponent("AI: " + a.reason + ". Рекомендация: " + a.recommendation);

    return '<article class="anomaly ' + RISK_TONE[a.risk] + '">' +
      "<div><h3>" + escapeHtml(title) + '</h3><p class="reason" style="margin-top:2px">' + sub + "</p>" +
        '<p class="reason"><b>Причина:</b> ' + escapeHtml(a.reason) + "</p></div>" +
      '<div class="anomaly-side">' + badge(RISK_TONE[a.risk], "Риск: " + RISK_TEXT[a.risk]) +
        '<span class="mono" style="font-weight:800">' + escapeHtml(a.valueText) + "</span>" +
        '<small class="muted">' + a.method + "</small></div>" +
      '<div class="rec">' + icon("brain") + "<div><b>Рекомендация:</b> " + escapeHtml(a.recommendation) +
        ' <a href="' + link + '" style="white-space:nowrap">Создать заявку →</a></div></div>' +
    "</article>";
  }

  function renderList(anomalies) {
    const risk = riskFilter.value;
    const list = anomalies.filter(function (a) { return !risk || a.risk === risk; });
    const s = getSettings();
    document.getElementById("anomalyNote").textContent = "z-score > " + s.zThreshold + " · показано " + list.length;
    document.getElementById("anomalyList").innerHTML = list.length
      ? list.map(anomalyHtml).join("")
      : '<div class="empty">Аномалий не обнаружено — все показатели в пределах нормы.</div>';
  }

  function renderCharts(rooms, meta) {
    const p = chartPalette();

    // CO2 по помещениям
    makeChart("co2Chart", {
      type: "bar",
      data: {
        labels: rooms.map(function (r) { return r.id; }),
        datasets: [{
          label: "CO₂, ppm",
          data: rooms.map(function (r) { return r.co2; }),
          backgroundColor: rooms.map(function (r) { return levelColor(co2Level(r.co2), p); }),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, suggestedMax: 1700, grid: { color: p.grid } }, y: { grid: { display: false } } }
      }
    });

    // История температуры выбранного помещения + пороги
    const room = rooms.find(function (r) { return r.id === roomSelect.value; }) || rooms[0];
    const h = room.history.temperature;
    const labels = meta.ticks.slice(-h.length).map(formatTime);
    const line = function (value) { return h.map(function () { return value; }); };
    makeChart("historyChart", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: room.id + ", °C", data: h, borderColor: p.accent, backgroundColor: p.accent, tension: .3, pointRadius: 3, fill: false },
          { label: "Порог Warning (27 °C)", data: line(THRESHOLDS.temperature.warning), borderColor: p.warn, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.5 },
          { label: "Порог Critical (32 °C)", data: line(THRESHOLDS.temperature.critical), borderColor: p.crit, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.5 }
        ]
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { position: "bottom" } },
        scales: { y: { suggestedMin: 16, suggestedMax: 35, grid: { color: p.grid } }, x: { grid: { display: false } } }
      }
    });

    // Энергия: факт и базовая линия по корпусам
    const fact = [], base = [];
    BUILDINGS.forEach(function (b) {
      const list = rooms.filter(function (r) { return r.building === b; });
      fact.push(+sum(list, function (r) { return r.energy; }).toFixed(1));
      base.push(+sum(list, function (r) { return r.baseline; }).toFixed(1));
    });
    makeChart("baselineChart", {
      type: "bar",
      data: {
        labels: BUILDINGS,
        datasets: [
          { label: "Факт, kWh", data: fact, backgroundColor: p.accent, borderRadius: 6, maxBarThickness: 46 },
          { label: "Базовая линия, kWh", data: base, backgroundColor: p.grid, borderRadius: 6, maxBarThickness: 46 }
        ]
      },
      options: { plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, grid: { color: p.grid } }, x: { grid: { display: false } } } }
    });
  }

  function render() {
    const rooms = getRooms();
    const devices = getDevices();
    const meta = getMeta();
    const settings = getSettings();
    const anomalies = detectAnomalies(rooms, devices, Number(settings.zThreshold));

    document.getElementById("zLimit").textContent = settings.zThreshold;
    renderKpi(anomalies, rooms);
    renderList(anomalies);
    renderCharts(rooms, meta);
    return anomalies;
  }

  function updateLive() {
    const s = getSettings();
    const live = document.getElementById("liveStatus");
    live.classList.toggle("paused", !s.autoSimulate);
    live.textContent = s.autoSimulate ? "Анализ каждые " + s.interval + " с" : "Автообновление выключено";
  }

  function tick() {
    render();
    refreshLayout("analytics");
  }

  document.getElementById("analyzeBtn").addEventListener("click", function () {
    simulateAll();
    const anomalies = render();
    refreshLayout("analytics");
    toast("Анализ выполнен: найдено аномалий — " + anomalies.length);
  });

  riskFilter.addEventListener("input", function () {
    renderList(detectAnomalies(getRooms(), getDevices(), Number(getSettings().zThreshold)));
  });
  roomSelect.addEventListener("input", function () { renderCharts(getRooms(), getMeta()); });
  document.addEventListener("themechange", render);

  render();
  updateLive();
  startAutoSimulation(tick);
})();
