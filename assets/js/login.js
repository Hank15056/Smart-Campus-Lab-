/* =========================================================
   login.js — учебная форма входа с выбором роли
   ========================================================= */

(function () {
  // Уже вошли — сразу на Dashboard
  if (getSession()) {
    window.location.replace("dashboard.html");
    return;
  }

  document.getElementById("heroLogo").innerHTML = icon("logo");
  document.getElementById("heroPoints").innerHTML = [
    ["rooms", "14 помещений в 4 корпусах"],
    ["devices", "46 IoT-устройств: температура, CO₂, энергия"],
    ["brain", "Поиск аномалий: пороги + z-score"],
    ["incidents", "Заявки на ремонт с приоритетами"]
  ].map(function (p) {
    return '<div><span class="kpi-icon tone-accent">' + icon(p[0]) + "</span>" + p[1] + "</div>";
  }).join("");

  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");

  function nameFromEmail(email) {
    const words = email.split("@")[0].replace(/[._-]+/g, " ").trim().split(" ");
    return words.map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  function signIn(email, role) {
    setSession({ email: email, name: nameFromEmail(email), role: role, loginAt: new Date().toISOString() });
    ensureData();
    window.location.href = "dashboard.html";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = "Введите корректный email, например operator@campus.kg";
      form.email.focus();
      return;
    }
    if (password.length < 4) {
      error.textContent = "Пароль должен содержать не меньше 4 символов";
      form.password.focus();
      return;
    }
    error.textContent = "";
    signIn(email, form.role.value);
  });

  document.getElementById("demoBtn").addEventListener("click", function () {
    signIn("admin@campus.kg", "Administrator");
  });
})();
