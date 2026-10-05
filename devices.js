/* Devices page: add and remove devices */
document.addEventListener("DOMContentLoaded", () => {
  const addDeviceBtn = document.getElementById("addDeviceBtn");
  const saveDeviceBtn = document.getElementById("saveDeviceBtn");
  const nameInput = document.getElementById("deviceNameInput");
  const typeSelect = document.getElementById("deviceTypeSelect");
  const roomSelect = document.getElementById("deviceRoomSelect");
  const grid = document.getElementById("deviceGrid");

  function render() {
    const devices = Store.devices();
    grid.innerHTML = devices.length
      ? devices.map((d) => deviceCardHtml(d, true)).join("")
      : `<div class="empty-state">
          <i class="fa-solid fa-plug-circle-xmark"></i>
          <p>No devices yet. Click "Add Device" to get started.</p>
        </div>`;
  }

  function renderRooms() {
    const rooms = Store.rooms();
    roomSelect.innerHTML = rooms.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join("");
    document.getElementById("noRoomHint").style.display = rooms.length ? "none" : "";
    saveDeviceBtn.disabled = rooms.length === 0;
  }

  render();
  renderRooms();

  addDeviceBtn.addEventListener("click", () => {
    nameInput.value = "";
    renderRooms();
    openModal("deviceModal");
    nameInput.focus();
  });

  function save() {
    const name = nameInput.value.trim();
    const roomId = roomSelect.value;
    if (!name) {
      showToast("Please enter a device name.", "danger");
      return;
    }
    if (!roomId) {
      showToast("Please select a room.", "danger");
      return;
    }
    const res = Store.addDevice(name, typeSelect.value, roomId);
    if (res.success) {
      showToast(res.message, "success");
      closeModal("deviceModal");
      render();
    } else {
      showToast(res.message, "danger");
    }
  }
  saveDeviceBtn.addEventListener("click", save);
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".device-remove-btn");
    if (!btn) return;
    if (!confirmAction("Remove this device?")) return;
    const res = Store.deleteDevice(btn.dataset.deviceId);
    showToast(res.message, res.success ? "success" : "danger");
    if (res.success) render();
  });
});
