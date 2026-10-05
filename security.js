/* Security page: arm/disarm system, lock/unlock door */
document.addEventListener("DOMContentLoaded", () => {
  const armBtn = document.getElementById("armBtn");
  const disarmBtn = document.getElementById("disarmBtn");
  const doorHolder = document.getElementById("doorHolder");
  const eventsHolder = document.getElementById("eventsHolder");

  const statusIcon = document.querySelector(".security-icon");
  const statusText = document.getElementById("securityStatusText");
  const statusDesc = document.querySelector(".security-status-left p");

  function updateSecurityUI(armed) {
    statusIcon.classList.toggle("armed", armed);
    statusIcon.classList.toggle("disarmed", !armed);
    statusText.textContent = armed ? "System Armed" : "System Disarmed";
    statusDesc.textContent = armed ? "Your home is protected." : "Your home is currently unprotected.";
    armBtn.disabled = armed;
    disarmBtn.disabled = !armed;
  }

  function renderDoor() {
    const door = Store.door();
    if (!door) {
      doorHolder.innerHTML = `<div class="empty-state"><i class="fa-solid fa-door-closed"></i><p>No smart door configured yet.</p></div>`;
      return;
    }
    doorHolder.innerHTML = `
      <div class="door-control">
        <div class="door-icon-wrap">
          <i class="fa-solid ${door.status ? "fa-lock" : "fa-lock-open"}" id="doorIcon"></i>
        </div>
        <p id="doorStatusText">${door.status ? "Locked" : "Unlocked"}</p>
        <div class="door-buttons">
          <button class="btn-secondary" id="unlockBtn" ${door.status ? "" : "disabled"}>Unlock</button>
          <button class="btn-primary" id="lockBtn" ${door.status ? "disabled" : ""}>Lock Door</button>
        </div>
      </div>`;
  }

  function renderEvents() {
    const events = Store.securityEvents();
    eventsHolder.innerHTML = events.length
      ? `<ul class="activity-list">${events.map((e) => `
        <li>
          <div class="activity-dot"></div>
          <div class="activity-content">
            <span class="activity-title">${e.deviceName ? escapeHtml(e.deviceName) + " " : ""}${escapeHtml(e.action)}</span>
            <span class="activity-time">${fmtTime(e.time)}</span>
          </div>
        </li>`).join("")}</ul>`
      : `<div class="empty-state"><i class="fa-solid fa-list"></i><p>No security events yet.</p></div>`;
  }

  updateSecurityUI(Store.isArmed());
  renderDoor();
  renderEvents();

  armBtn.addEventListener("click", () => {
    const res = Store.setArmed(true);
    updateSecurityUI(true);
    showToast(res.message, "success");
    renderEvents();
    refreshBadges();
  });

  disarmBtn.addEventListener("click", () => {
    const res = Store.setArmed(false);
    updateSecurityUI(false);
    showToast(res.message, "warning");
    renderEvents();
    refreshBadges();
  });

  // Door buttons are re-rendered, so use delegation
  doorHolder.addEventListener("click", (e) => {
    const lock = e.target.closest("#lockBtn");
    const unlock = e.target.closest("#unlockBtn");
    if (!lock && !unlock) return;
    const res = Store.doorAction(lock ? "lock" : "unlock");
    if (res.success) {
      renderDoor();
      renderEvents();
      refreshBadges();
      showToast(res.message, lock ? "success" : "warning");
    } else {
      showToast(res.message, "danger");
    }
  });
});
