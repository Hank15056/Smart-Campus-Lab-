/* =========================================================
   data.js — тестовые данные кампуса
   Помещения, IoT-устройства и инциденты.
   Данные генерируются функцией createSeedData() и затем
   хранятся в localStorage (см. storage.js).
   ========================================================= */

// Генератор псевдослучайных чисел с «зерном»:
// при сбросе данных всегда получаются одинаковые стартовые значения.
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// id, корпус, этаж, тип помещения, вместимость, базовое потребление (кВт·ч за час)
const ROOM_LIST = [
  ["A-101", "Корпус A", 1, "Компьютерный класс", 24, 3.6],
  ["A-102", "Корпус A", 1, "Лекционная аудитория", 60, 2.8],
  ["A-205", "Корпус A", 2, "Аудитория", 30, 2.2],
  ["A-210", "Корпус A", 2, "Лаборатория сетей", 20, 4.2],
  ["B-104", "Корпус B", 1, "Библиотека", 50, 3.0],
  ["B-204", "Корпус B", 2, "Серверная", 2, 7.5],
  ["B-206", "Корпус B", 2, "Компьютерный класс", 24, 3.8],
  ["B-301", "Корпус B", 3, "Административный кабинет", 6, 1.4],
  ["C-110", "Корпус C", 1, "Лаборатория электроники", 18, 3.2],
  ["C-115", "Корпус C", 1, "Мастерская", 15, 5.0],
  ["C-220", "Корпус C", 2, "Аудитория", 32, 2.0],
  ["D-101", "Корпус D", 1, "Спортивный зал", 80, 4.5],
  ["D-205", "Корпус D", 2, "Конференц-зал", 40, 2.6],
  ["D-301", "Корпус D", 3, "Аудитория", 30, 2.1]
];

const BUILDINGS = ["Корпус A", "Корпус B", "Корпус C", "Корпус D"];

const DEVICE_TYPES = {
  "Temperature Sensor": { prefix: "TEMP", unit: "°C", field: "temperature" },
  "CO2 Sensor": { prefix: "CO2", unit: "ppm", field: "co2" },
  "Energy Meter": { prefix: "PWR", unit: "kWh", field: "energy" },
  "Camera": { prefix: "CAM", unit: "", field: null },
  "Access Control": { prefix: "ACC", unit: "", field: null }
};

const HISTORY_LENGTH = 12;   // сколько замеров хранится для каждого показателя
const TICK_MINUTES = 10;     // интервал между стартовыми замерами

// Базовая температура помещения (серверная — прохладнее)
function baseTemperature(room) {
  return room.type === "Серверная" ? 20.5 : 22.3;
}

function round1(x) { return Math.round(x * 10) / 10; }

// Модель показаний помещения. Используется и для стартовой истории,
// и для симуляции (simulation.js), поэтому данные согласованы между собой.
// rnd — функция, возвращающая случайное число от 0 до 1.
function sampleOccupancy(room, rnd) {
  if (room.type === "Серверная") return rnd() < 0.3 ? 1 : 0;
  return rnd() < 0.12 ? 0 : Math.round(room.capacity * (0.3 + rnd() * 0.65));
}

function sampleReading(room, occupancy, rnd) {
  const isServer = room.type === "Серверная";
  const load = isServer ? 0.5 : occupancy / room.capacity;
  const noise = function (amplitude) { return (rnd() * 2 - 1) * amplitude; };
  return {
    temperature: round1(baseTemperature(room) + load * 1.2 + noise(0.6)),
    co2: Math.round(430 + load * 650 + noise(45)),
    energy: round1(isServer
      ? room.baseline * (1 + noise(0.05))
      : room.baseline * (0.62 + load * 0.4 + noise(0.06)))
  };
}

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU") + " " + formatTime(d);
}

function createSeedData() {
  const rnd = seededRandom(2026);
  const now = Date.now();

  // Метки времени замеров (последняя — «сейчас»)
  const ticks = [];
  for (let i = HISTORY_LENGTH - 1; i >= 0; i--) {
    ticks.push(new Date(now - i * TICK_MINUTES * 60000).toISOString());
  }

  const rooms = ROOM_LIST.map(function (r) {
    const room = {
      id: r[0], building: r[1], floor: r[2], type: r[3],
      capacity: r[4], baseline: r[5],
      temperature: 0, co2: 0, energy: 0, occupancy: 0,
      history: { temperature: [], co2: [], energy: [] }
    };

    for (let i = 0; i < HISTORY_LENGTH; i++) {
      room.occupancy = sampleOccupancy(room, rnd);
      const reading = sampleReading(room, room.occupancy, rnd);
      room.history.temperature.push(reading.temperature);
      room.history.co2.push(reading.co2);
      room.history.energy.push(reading.energy);
    }
    return room;
  });

  // Особые ситуации, чтобы AI-модулю было что обнаружить сразу
  function setCurrent(id, field, value, occupancy) {
    const room = rooms.find(function (x) { return x.id === id; });
    room.history[field][HISTORY_LENGTH - 1] = value;
    if (occupancy !== undefined) room.occupancy = occupancy;
  }
  setCurrent("A-205", "co2", 1620, 30);        // критический CO2
  setCurrent("B-204", "temperature", 33.4);    // перегрев серверной
  setCurrent("C-110", "energy", 5.5, 0);       // людей нет, а энергия высокая
  setCurrent("D-301", "co2", 1180);            // CO2 выше нормы
  setCurrent("A-210", "temperature", 28.6);    // температура выше нормы
  setCurrent("B-104", "temperature", 25.9);    // в пределах нормы, но резкий скачок (z-score)

  // Текущие значения = последний замер истории
  rooms.forEach(function (room) {
    room.temperature = room.history.temperature[HISTORY_LENGTH - 1];
    room.co2 = room.history.co2[HISTORY_LENGTH - 1];
    room.energy = room.history.energy[HISTORY_LENGTH - 1];
  });

  // IoT-устройства: в каждом помещении датчик температуры, CO2 и счётчик энергии
  const updatedAt = ticks[ticks.length - 1];
  const devices = [];
  rooms.forEach(function (room) {
    const code = room.id.replace("-", "");
    ["Temperature Sensor", "CO2 Sensor", "Energy Meter"].forEach(function (type) {
      devices.push({
        id: DEVICE_TYPES[type].prefix + "-" + code + "-01",
        room: room.id, type: type, status: "online", updatedAt: updatedAt
      });
    });
  });
  devices.push({ id: "CAM-A102-01", room: "A-102", type: "Camera", status: "online", updatedAt: updatedAt });
  devices.push({ id: "CAM-D101-01", room: "D-101", type: "Camera", status: "offline", updatedAt: ticks[3] });
  devices.push({ id: "ACC-B204-01", room: "B-204", type: "Access Control", status: "online", updatedAt: updatedAt });
  devices.push({ id: "ACC-A101-01", room: "A-101", type: "Access Control", status: "online", updatedAt: updatedAt });

  // Несколько датчиков не в сети
  ["CO2-C220-01", "TEMP-D101-01"].forEach(function (id) {
    const d = devices.find(function (x) { return x.id === id; });
    d.status = "offline";
    d.updatedAt = ticks[5];
  });

  const incidents = [
    { id: 1, title: "Высокий уровень CO2", room: "A-205", priority: "high", status: "open",
      assignee: "Hank V. (инженер)", comment: "Жалобы на духоту во время пары.", createdAt: ticks[9] },
    { id: 2, title: "Перегрев серверной", room: "B-204", priority: "high", status: "in_progress",
      assignee: "Sanford B. (инженер)", comment: "Проверить кондиционер №2.", createdAt: ticks[8] },
    { id: 3, title: "Датчик CO2 не передаёт данные", room: "C-220", priority: "medium", status: "open",
      assignee: "Deimos V (оператор)", comment: "", createdAt: ticks[5] },
    { id: 4, title: "Камера не передаёт изображение", room: "D-101", priority: "medium", status: "open",
      assignee: "Hank V. (инженер)", comment: "Возможно, нет питания PoE.", createdAt: ticks[3] },
    { id: 5, title: "Мерцает освещение", room: "D-205", priority: "low", status: "resolved",
      assignee: "Sanford B. (инженер)", comment: "Заменён драйвер светильника.", createdAt: ticks[0] }
  ];

  return { rooms: rooms, devices: devices, incidents: incidents, meta: { ticks: ticks, nextIncidentId: 6 } };
}
