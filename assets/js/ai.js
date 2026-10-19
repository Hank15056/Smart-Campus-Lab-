/* =========================================================
   ai.js — модуль AI Analytics
   1) пороговые правила (Normal / Warning / Critical);
   2) статистическое обнаружение аномалий по z-score;
   3) Recommendation Engine — рекомендации оператору.
   Это rule-based анализ, а не генеративный AI: каждое решение
   объяснимо и проверяемо.
   ========================================================= */

const THRESHOLDS = {
  temperature: { min: 18, warning: 27, critical: 32 },   // норма 18–27 °C, ≥32 — критично
  co2: { warning: 1000, critical: 1500 },                // ppm
  energy: { warning: 1.3, critical: 1.6 }                // доля от базовой линии (+30% / +60%)
};

const LEVEL_RANK = { normal: 0, low: 1, warning: 2, critical: 3 };

const METRICS = {
  temperature: { label: "Температура", unit: "°C" },
  co2: { label: "CO₂", unit: "ppm" },
  energy: { label: "Энергия", unit: "kWh" }
};

const LEVEL_TEXT = { normal: "Норма", warning: "Внимание", critical: "Критично" };
const RISK_TEXT = { critical: "Высокий", warning: "Средний", low: "Низкий" };

/* ---------- 1. Пороговые правила ---------- */

function temperatureLevel(t) {
  if (t >= THRESHOLDS.temperature.critical) return "critical";
  if (t > THRESHOLDS.temperature.warning || t < THRESHOLDS.temperature.min) return "warning";
  return "normal";
}

function co2Level(c) {
  if (c >= THRESHOLDS.co2.critical) return "critical";
  if (c >= THRESHOLDS.co2.warning) return "warning";
  return "normal";
}

function energyLevel(e, baseline) {
  const ratio = e / baseline;
  if (ratio >= THRESHOLDS.energy.critical) return "critical";
  if (ratio >= THRESHOLDS.energy.warning) return "warning";
  return "normal";
}

function metricLevel(room, metric) {
  if (metric === "temperature") return temperatureLevel(room.temperature);
  if (metric === "co2") return co2Level(room.co2);
  return energyLevel(room.energy, room.baseline);
}

// Общий статус помещения = худший из трёх показателей
function roomStatus(room) {
  let worst = "normal";
  Object.keys(METRICS).forEach(function (m) {
    const level = metricLevel(room, m);
    if (LEVEL_RANK[level] > LEVEL_RANK[worst]) worst = level;
  });
  return worst;
}

/* ---------- 2. Z-score ---------- */

function mean(values) {
  return values.reduce(function (a, b) { return a + b; }, 0) / values.length;
}

function stdDev(values) {
  const avg = mean(values);
  const variance = values.reduce(function (sum, v) { return sum + Math.pow(v - avg, 2); }, 0) / values.length;
  return Math.sqrt(variance);
}

function zScore(values, current) {
  const sd = stdDev(values);
  if (sd === 0) return 0;
  return Math.abs((current - mean(values)) / sd);
}

/* ---------- 3. Recommendation Engine ---------- */

function getRecommendation(room, metric, level, isStatistical) {
  if (metric === "co2") {
    if (level === "critical") return "Критический CO₂: включить вентиляцию на максимум и проветрить аудиторию, при необходимости объявить перерыв.";
    if (level === "warning") return "CO₂ выше нормы: открыть окна или усилить приточную вентиляцию.";
  }
  if (metric === "temperature") {
    if (level === "critical" && room.type === "Серверная") return "Перегрев серверной: проверить кондиционеры и нагрузку на оборудование, подготовить план аварийного отключения.";
    if (level === "critical") return "Перегрев: проверить кондиционер или систему вентиляции.";
    if (level === "warning" && room.temperature < THRESHOLDS.temperature.min) return "Температура ниже нормы: проверить отопление и закрыты ли окна.";
    if (level === "warning") return "Температура выше нормы: включить кондиционирование, закрыть жалюзи на солнечной стороне.";
  }
  if (metric === "energy") {
    if (room.occupancy === 0 && level !== "normal") return "В помещении нет людей, но энергопотребление высокое: проверить, выключены ли компьютеры, свет и оборудование.";
    if (level === "critical") return "Перерасход энергии более 60%: проверить оборудование на неисправность и утечки.";
    if (level === "warning") return "Энергопотребление выше базовой линии на 30%+: проверить режим работы оборудования.";
  }
  if (isStatistical) {
    return "Нетипичное резкое изменение показателя (" + METRICS[metric].label + "): проверить датчик и ситуацию в помещении, наблюдать за динамикой.";
  }
  return "Параметры в норме.";
}

/* ---------- Поиск аномалий ---------- */

function formatValue(metric, value) {
  return value + " " + METRICS[metric].unit;
}

function thresholdReason(room, metric, level) {
  const v = room[metric];
  if (metric === "temperature") {
    if (v < THRESHOLDS.temperature.min) return "Температура " + v + " °C ниже нормы (18 °C)";
    return level === "critical"
      ? "Температура " + v + " °C ≥ 32 °C (критический порог)"
      : "Температура " + v + " °C выше нормы 18–27 °C";
  }
  if (metric === "co2") {
    return level === "critical"
      ? "CO₂ " + v + " ppm ≥ 1500 ppm (критический порог)"
      : "CO₂ " + v + " ppm ≥ 1000 ppm (порог предупреждения)";
  }
  const pct = Math.round((v / room.baseline - 1) * 100);
  return "Энергия " + v + " kWh — на " + pct + "% выше базовой линии " + room.baseline + " kWh";
}

function detectAnomalies(rooms, devices, zLimit) {
  if (!zLimit) zLimit = 2;
  const result = [];
  const offlineByRoom = {};

  devices.forEach(function (d) {
    if (d.status === "offline") {
      (offlineByRoom[d.room] = offlineByRoom[d.room] || []).push(d);
    }
  });

  rooms.forEach(function (room) {
    Object.keys(METRICS).forEach(function (metric) {
      // данные с отключённого датчика не анализируем
      const sensorOffline = (offlineByRoom[room.id] || []).some(function (d) {
        return DEVICE_TYPES[d.type].field === metric;
      });
      if (sensorOffline) return;

      const value = room[metric];
      const level = metricLevel(room, metric);
      const previous = room.history[metric].slice(0, -1);   // все замеры, кроме текущего
      const z = previous.length >= 5 ? zScore(previous, value) : 0;
      // Для CO2 и энергии опасен только рост; для температуры — отклонение в любую сторону
      const risesOnly = metric !== "temperature";
      const isStatistical = z > zLimit && (!risesOnly || value > mean(previous));

      if (level === "normal" && !isStatistical) return;

      const reasons = [];
      if (level !== "normal") reasons.push(thresholdReason(room, metric, level));
      if (isStatistical) {
        reasons.push("z-score = " + z.toFixed(1) + " > " + zLimit + ": значение резко отличается от среднего " +
          mean(previous).toFixed(1) + " за последние " + previous.length + " замеров");
      }

      result.push({
        room: room.id,
        building: room.building,
        type: room.type,
        metric: metric,
        metricLabel: METRICS[metric].label,
        value: value,
        valueText: formatValue(metric, value),
        z: z,
        risk: level === "normal" ? "low" : level,
        method: level !== "normal" && isStatistical ? "Порог + z-score" : (isStatistical ? "z-score" : "Порог"),
        reason: reasons.join("; "),
        recommendation: getRecommendation(room, metric, level, isStatistical)
      });
    });
  });

  // Отключённые датчики — тоже повод для внимания
  devices.forEach(function (d) {
    if (d.status !== "offline") return;
    result.push({
      room: d.room, building: "", type: d.type, metric: "device",
      metricLabel: "Устройство " + d.id, value: null, valueText: "offline",
      z: 0, risk: "warning", method: "Мониторинг связи",
      reason: "Устройство не передаёт данные с " + formatDateTime(d.updatedAt),
      recommendation: "Проверить питание и сетевое подключение устройства " + d.id + ", при необходимости перезагрузить."
    });
  });

  result.sort(function (a, b) {
    return (LEVEL_RANK[b.risk] - LEVEL_RANK[a.risk]) || (b.z - a.z);
  });
  return result;
}

/* ---------- Уведомления для Topbar и Dashboard ---------- */

function buildNotifications(rooms, devices) {
  const list = [];
  rooms.forEach(function (room) {
    const t = temperatureLevel(room.temperature);
    const c = co2Level(room.co2);
    const e = energyLevel(room.energy, room.baseline);
    if (c !== "normal") list.push({ level: c, kind: "co2", title: "Высокий CO₂ — " + room.id, text: room.co2 + " ppm · " + room.type });
    if (t !== "normal") list.push({ level: t, kind: "temp", title: (room.temperature < 18 ? "Холодно — " : "Перегрев — ") + room.id, text: room.temperature + " °C · " + room.type });
    if (e !== "normal") list.push({ level: e, kind: "energy", title: "Перерасход энергии — " + room.id, text: room.energy + " kWh при норме " + room.baseline + " kWh" });
  });
  devices.forEach(function (d) {
    if (d.status === "offline") list.push({ level: "warning", kind: "offline", title: "Offline-датчик — " + d.id, text: d.type + " · " + d.room });
  });
  list.sort(function (a, b) { return LEVEL_RANK[b.level] - LEVEL_RANK[a.level]; });
  return list;
}
