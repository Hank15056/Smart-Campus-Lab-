/* =========================================================
   simulation.js — имитация показаний IoT-датчиков
   Реальных датчиков нет, поэтому JavaScript генерирует
   правдоподобные значения. Иногда (≈7% замеров) происходит
   резкий скачок — так AI-модулю есть что обнаруживать.
   ========================================================= */

const MAX_HISTORY = 20;

function random(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(1);
}

function pushHistory(list, value) {
  list.push(value);
  while (list.length > MAX_HISTORY) list.shift();
}

function simulateRoom(room) {
  // Обычный замер по той же модели, что и стартовые данные (data.js)
  room.occupancy = sampleOccupancy(room, Math.random);
  const reading = sampleReading(room, room.occupancy, Math.random);
  let temperature = reading.temperature;
  let co2 = reading.co2;
  let energy = reading.energy;

  // Редкие скачки — имитация реальных проблем
  if (Math.random() < 0.07) {
    const what = Math.floor(Math.random() * 3);
    if (what === 0) temperature += random(5, 10);
    if (what === 1) co2 += random(500, 900);
    if (what === 2) energy *= random(1.4, 1.8);
  }

  room.temperature = Math.round(temperature * 10) / 10;
  room.co2 = Math.round(co2);
  room.energy = Math.round(energy * 10) / 10;

  pushHistory(room.history.temperature, room.temperature);
  pushHistory(room.history.co2, room.co2);
  pushHistory(room.history.energy, room.energy);
  return room;
}

// Один «тик» симуляции для всего кампуса
function simulateAll() {
  const rooms = getRooms();
  const devices = getDevices();
  const meta = getMeta();
  const now = new Date().toISOString();

  rooms.forEach(simulateRoom);

  devices.forEach(function (d) {
    // небольшой шанс потери или восстановления связи
    if (d.status === "online" && Math.random() < 0.01) d.status = "offline";
    else if (d.status === "offline" && Math.random() < 0.08) d.status = "online";
    if (d.status === "online") d.updatedAt = now;
  });

  meta.ticks = meta.ticks || [];
  pushHistory(meta.ticks, now);

  saveRooms(rooms);
  saveDevices(devices);
  saveMeta(meta);
  return { rooms: rooms, devices: devices, meta: meta };
}

// Автообновление показаний по таймеру (настраивается в Settings)
let simulationTimer = null;

function startAutoSimulation(onTick) {
  stopAutoSimulation();
  const s = getSettings();
  if (!s.autoSimulate) return false;
  const ms = Math.max(5, Number(s.interval) || 15) * 1000;
  simulationTimer = setInterval(function () {
    simulateAll();
    if (onTick) onTick();
  }, ms);
  return true;
}

function stopAutoSimulation() {
  if (simulationTimer) clearInterval(simulationTimer);
  simulationTimer = null;
}
