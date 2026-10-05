/* Automation page: create, toggle, delete rules */
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addAutomationBtn");
  const saveBtn = document.getElementById("saveAutomationBtn");
  const nameInput = document.getElementById("autoNameInput");
  const conditionInput = document.getElementById("autoConditionInput");
  const actionInput = document.getElementById("autoActionInput");
  const list = document.getElementById("automationList");

  function render() {
    const rules = Store.automations();
    list.innerHTML = rules.length ? rules.map((rule) => `
      <div class="automation-card" data-rule-id="${rule.id}">
        <div class="automation-card-main">
          <h3>${escapeHtml(rule.name)}</h3>
          <div class="automation-rule">
            <span class="automation-tag if-tag">IF</span>
            <span>${escapeHtml(rule.condition)}</span>
          </div>
          <div class="automation-rule">
            <span class="automation-tag then-tag">THEN</span>
            <span>${escapeHtml(rule.action)}</span>
          </div>
        </div>
        <div class="automation-card-actions">
          <label class="toggle-switch">
            <input type="checkbox" class="automation-toggle" data-rule-id="${rule.id}" ${rule.enabled ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
          <button class="icon-btn-sm automation-delete-btn" data-rule-id="${rule.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
      : `<div class="empty-state">
          <i class="fa-solid fa-gears"></i>
          <p>No automations yet. Click "New Automation" to create your first rule.</p>
        </div>`;
  }
  render();

  addBtn.addEventListener("click", () => {
    nameInput.value = "";
    conditionInput.value = "";
    actionInput.value = "";
    openModal("automationModal");
    nameInput.focus();
  });

  function save() {
    const name = nameInput.value.trim();
    const condition = conditionInput.value.trim();
    const action = actionInput.value.trim();
    if (!name || !condition || !action) {
      showToast("Please fill in all fields.", "danger");
      return;
    }
    const res = Store.addAutomation(name, condition, action);
    if (res.success) {
      showToast(res.message, "success");
      closeModal("automationModal");
      render();
    } else {
      showToast(res.message, "danger");
    }
  }
  saveBtn.addEventListener("click", save);
  [nameInput, conditionInput, actionInput].forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); }));

  list.addEventListener("change", (e) => {
    const toggle = e.target;
    if (!toggle.classList.contains("automation-toggle")) return;
    const res = Store.toggleAutomation(toggle.dataset.ruleId);
    if (res.success) {
      toggle.checked = res.enabled;
      showToast(`Automation ${res.enabled ? "enabled" : "disabled"}.`, "success");
    } else {
      toggle.checked = !toggle.checked;
      showToast(res.message, "danger");
    }
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".automation-delete-btn");
    if (!btn) return;
    if (!confirmAction("Delete this automation rule?")) return;
    const res = Store.deleteAutomation(btn.dataset.ruleId);
    showToast(res.message, res.success ? "success" : "danger");
    if (res.success) render();
  });
});
