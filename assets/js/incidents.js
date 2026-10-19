/* =========================================================
   incidents.js — CRUD заявок и инцидентов
   Create — форма «Новый инцидент»
   Read   — таблица, поиск, фильтры
   Update — изменение статуса, приоритета, ответственного
   Delete — удаление с подтверждением
   ========================================================= */

(function () {
  const session = initLayout("incidents");
  if (!session) return;

  const modal = document.getElementById("incidentModal");
  const form = document.getElementById("incidentForm");
  const formError = document.getElementById("formError");
  const search = document.getElementById("incidentSearch");
  const statusFilter = document.getElementById("incStatusFilter");
  const priorityFilter = document.getElementById("priorityFilter");
  let editingId = null;

  const canEdit = can("canEdit");
  const canDelete = can("canDelete");
  const role = ROLES[session.role];

  document.getElementById("roleHint").textContent = "Вы вошли как " + role.label + ". " +
    (canDelete ? "Доступно: создание, изменение и удаление заявок."
      : canEdit ? "Доступно: создание и изменение заявок. Удаление — только у администратора."
        : "Доступно: просмотр и создание заявок. Изменять заявки может инженер, удалять — администратор.");

  // Список помещений для формы
  form.room.innerHTML = '<option value="">— выберите —</option>' + getRooms().map(function (r) {
    return '<option value="' + r.id + '">' + r.id + " · " + escapeHtml(r.type) + "</option>";
  }).join("");

  function renderKpi(incidents) {
    const count = function (s) { return incidents.filter(function (i) { return i.status === s; }).length; };
    const card = function (ic, tone, label, value) {
      return '<article class="card kpi"><div class="kpi-top"><span>' + label + '</span><span class="kpi-icon ' + tone + '">' + icon(ic) +
        '</span></div><div class="kpi-value mono">' + value + "</div></article>";
    };
    document.getElementById("incidentKpi").innerHTML =
      card("incidents", "tone-accent", "Всего заявок", incidents.length) +
      card("bell", "tone-crit", "Открыто", count("open")) +
      card("refresh", "tone-warn", "В работе", count("in_progress")) +
      card("check", "tone-ok", "Решено", count("resolved"));
  }

  function render() {
    const incidents = getIncidents();
    const text = search.value.trim().toLowerCase();

    const list = incidents
      .filter(function (i) {
        const hay = (i.title + " " + i.room + " " + i.assignee + " " + i.comment).toLowerCase();
        return (!text || hay.indexOf(text) !== -1) &&
          (!statusFilter.value || i.status === statusFilter.value) &&
          (!priorityFilter.value || i.priority === priorityFilter.value);
      })
      .sort(function (a, b) { return b.id - a.id; });

    renderKpi(incidents);
    document.getElementById("incidentCount").textContent = "Найдено: " + list.length + " из " + incidents.length;

    document.getElementById("incidentsBody").innerHTML = list.length
      ? list.map(function (i) {
          return "<tr>" +
            '<td class="mono">' + i.id + "</td>" +
            "<td><b>" + escapeHtml(i.title) + "</b>" + (i.comment ? '<br><small class="muted">' + escapeHtml(i.comment) + "</small>" : "") + "</td>" +
            "<td>" + escapeHtml(i.room) + "</td>" +
            "<td>" + badge(i.priority) + "</td>" +
            "<td>" + badge(i.status) + "</td>" +
            "<td>" + escapeHtml(i.assignee) + "</td>" +
            '<td class="mono">' + formatDateTime(i.createdAt) + "</td>" +
            '<td class="actions">' +
              '<button class="btn ghost sm" data-edit="' + i.id + '"' + (canEdit ? "" : ' disabled title="Недоступно для вашей роли"') + ">Изменить</button>" +
              '<button class="btn ghost sm" data-delete="' + i.id + '"' + (canDelete ? "" : ' disabled title="Удалять может только администратор"') + ">Удалить</button>" +
            "</td></tr>";
        }).join("")
      : '<tr><td colspan="8" class="empty">Заявок по заданным условиям нет</td></tr>';
  }

  /* ---------- Форма ---------- */

  function openModal(incident, preset) {
    editingId = incident ? incident.id : null;
    form.reset();
    formError.textContent = "";
    document.getElementById("incidentModalTitle").textContent = incident ? "Изменить инцидент #" + incident.id : "Новый инцидент";
    const data = incident || Object.assign({ priority: "medium", status: "open" }, preset || {});
    ["title", "room", "priority", "status", "assignee", "comment"].forEach(function (f) {
      if (data[f] !== undefined) form[f].value = data[f];
    });
    // Оператор создаёт заявку только в статусе «Открыт»
    form.status.disabled = !canEdit;
    modal.showModal();
    form.title.focus();
  }

  function closeModal() {
    modal.close();
    editingId = null;
  }

  function validate() {
    const title = form.title.value.trim();
    const assignee = form.assignee.value.trim();
    if (title.length < 3) return { field: "title", text: "Название: минимум 3 символа" };
    if (!form.room.value) return { field: "room", text: "Выберите помещение" };
    if (assignee.length < 3) return { field: "assignee", text: "Укажите ответственного (минимум 3 символа)" };
    return null;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const error = validate();
    if (error) {
      formError.textContent = error.text;
      form[error.field].focus();
      return;
    }

    const incidents = getIncidents();
    const values = {
      title: form.title.value.trim(),
      room: form.room.value,
      priority: form.priority.value,
      status: canEdit ? form.status.value : "open",
      assignee: form.assignee.value.trim(),
      comment: form.comment.value.trim()
    };

    if (editingId === null) {
      const meta = getMeta();
      const id = meta.nextIncidentId || (Math.max.apply(null, incidents.map(function (i) { return i.id; }).concat(0)) + 1);
      meta.nextIncidentId = id + 1;
      saveMeta(meta);
      incidents.push(Object.assign({ id: id, createdAt: new Date().toISOString() }, values));
      toast("Инцидент #" + id + " создан");
    } else {
      const item = incidents.find(function (i) { return i.id === editingId; });
      Object.assign(item, values, { updatedAt: new Date().toISOString() });
      toast("Инцидент #" + editingId + " обновлён");
    }

    saveIncidents(incidents);
    closeModal();
    render();
    refreshLayout("incidents");
  });

  document.getElementById("addIncidentBtn").addEventListener("click", function () { openModal(null); });
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("cancelModal").addEventListener("click", closeModal);

  /* ---------- Изменить / удалить ---------- */

  document.getElementById("incidentsBody").addEventListener("click", function (e) {
    const editBtn = e.target.closest("button[data-edit]");
    const delBtn = e.target.closest("button[data-delete]");

    if (editBtn && !editBtn.disabled) {
      const item = getIncidents().find(function (i) { return i.id === Number(editBtn.dataset.edit); });
      if (item) openModal(item);
    }

    if (delBtn && !delBtn.disabled) {
      const id = Number(delBtn.dataset.delete);
      const item = getIncidents().find(function (i) { return i.id === id; });
      if (!item) return;
      confirmDialog("Удалить инцидент #" + id + "?", "«" + item.title + "» будет удалён без возможности восстановления.", "Удалить")
        .then(function (ok) {
          if (!ok) return;
          saveIncidents(getIncidents().filter(function (i) { return i.id !== id; }));
          render();
          refreshLayout("incidents");
          toast("Инцидент #" + id + " удалён");
        });
    }
  });

  [search, statusFilter, priorityFilter].forEach(function (el) {
    el.addEventListener("input", render);
  });

  render();

  // Переход из AI Analytics: incidents.html?new=1&room=A-205&title=...
  if (getQueryParam("new")) {
    openModal(null, {
      room: getQueryParam("room") || "",
      title: getQueryParam("title") || "",
      priority: getQueryParam("priority") || "medium",
      comment: getQueryParam("comment") || ""
    });
    history.replaceState(null, "", "incidents.html");
  }
})();
