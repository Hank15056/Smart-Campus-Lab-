/* =========================================================
   settings.js — тема, параметры кампуса, сброс данных
   ========================================================= */

(function () {
  const session = initLayout("settings");
  if (!session) return;

  const role = ROLES[session.role];
  const form = document.getElementById("settingsForm");
  const error = document.getElementById("settingsError");

  /* ---------- Тема ---------- */

  const themeButtons = document.querySelectorAll(".switch button");
  function markTheme() {
    const current = getTheme();
    themeButtons.forEach(function (b) {
      b.classList.toggle("on", b.dataset.theme === current);
      b.setAttribute("aria-pressed", b.dataset.theme === current);
    });
  }
  themeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(b.dataset.theme);
      markTheme();
      document.getElementById("themeButton").innerHTML = icon(b.dataset.theme === "light" ? "moon" : "sun");
      toast(b.dataset.theme === "light" ? "Включена светлая тема" : "Включена тёмная тема");
    });
  });
  document.addEventListener("themechange", markTheme);
  markTheme();

  /* ---------- Профиль ---------- */

  document.getElementById("profileName").textContent = session.name;
  document.getElementById("profileEmail").textContent = session.email;
  document.getElementById("profileRole").innerHTML = badge("info", session.role);
  document.getElementById("profileRights").textContent =
    "Создание заявок — да · изменение — " + (role.canEdit ? "да" : "нет") +
    " · удаление — " + (role.canDelete ? "да" : "нет") +
    " · сброс данных — " + (role.canReset ? "да" : "нет");
  document.getElementById("settingsLogout").addEventListener("click", logout);

  /* ---------- Параметры кампуса ---------- */

  function fillForm() {
    const s = getSettings();
    form.campusName.value = s.campusName;
    form.autoSimulate.value = String(s.autoSimulate);
    form.interval.value = s.interval;
    form.zThreshold.value = s.zThreshold;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = form.campusName.value.trim();
    const interval = Number(form.interval.value);
    const z = Number(form.zThreshold.value);

    if (name.length < 3) { error.textContent = "Название кампуса: минимум 3 символа"; return; }
    if (!Number.isInteger(interval) || interval < 5 || interval > 120) { error.textContent = "Интервал — целое число от 5 до 120 секунд"; return; }
    if (!(z >= 1.5 && z <= 4)) { error.textContent = "Порог z-score — от 1.5 до 4"; return; }

    error.textContent = "";
    saveSettings({ campusName: name, autoSimulate: form.autoSimulate.value === "true", interval: interval, zThreshold: z });
    refreshLayout("settings");
    toast("Параметры сохранены");
  });

  /* ---------- Тестовые данные ---------- */

  function showStorage() {
    document.getElementById("storageInfo").textContent = "в localStorage: " + (storageSize() / 1024).toFixed(1) + " КБ";
  }

  document.getElementById("simulateOnce").addEventListener("click", function () {
    simulateAll();
    refreshLayout("settings");
    showStorage();
    toast("Новые показания сгенерированы");
  });

  const resetBtn = document.getElementById("resetBtn");
  if (!role.canReset) {
    resetBtn.disabled = true;
    resetBtn.title = "Сброс доступен только администратору";
  }
  resetBtn.addEventListener("click", function () {
    if (resetBtn.disabled) return;
    confirmDialog("Сбросить тестовые данные?", "Помещения, устройства и все инциденты вернутся к исходному состоянию. Ваши заявки будут удалены.", "Сбросить")
      .then(function (ok) {
        if (!ok) return;
        resetData();
        refreshLayout("settings");
        showStorage();
        toast("Данные сброшены к исходным");
      });
  });

  fillForm();
  showStorage();
})();
