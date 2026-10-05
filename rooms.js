/* Rooms page: add, rename, delete rooms */
document.addEventListener("DOMContentLoaded", () => {
  const roomModalTitle = document.getElementById("roomModalTitle");
  const roomNameInput = document.getElementById("roomNameInput");
  const saveRoomBtn = document.getElementById("saveRoomBtn");
  const addRoomBtn = document.getElementById("addRoomBtn");
  const roomGrid = document.getElementById("roomGrid");

  let editingRoomId = null;

  function render() {
    const rooms = Store.rooms();
    roomGrid.innerHTML = rooms.length ? rooms.map((room) => `
      <div class="room-card" data-room-id="${room.id}">
        <div class="room-card-top">
          <div class="room-icon"><i class="fa-solid fa-door-open"></i></div>
          <div class="room-menu">
            <button class="icon-btn-sm room-menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            <div class="room-menu-dropdown">
              <button class="room-rename-btn" data-room-id="${room.id}" data-room-name="${escapeHtml(room.name)}"><i class="fa-solid fa-pen"></i> Rename</button>
              <button class="room-delete-btn danger" data-room-id="${room.id}"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </div>
        </div>
        <h3 class="room-name">${escapeHtml(room.name)}</h3>
        <p class="room-device-count">${room.deviceCount} device${room.deviceCount !== 1 ? "s" : ""}</p>
      </div>`).join("")
      : `<div class="empty-state">
          <i class="fa-solid fa-door-closed"></i>
          <p>No rooms yet. Click "Add Room" to create your first one.</p>
        </div>`;
  }
  render();

  addRoomBtn.addEventListener("click", () => {
    editingRoomId = null;
    roomModalTitle.textContent = "Add Room";
    roomNameInput.value = "";
    openModal("roomModal");
    roomNameInput.focus();
  });

  // Menu / rename / delete via delegation (cards are re-rendered)
  roomGrid.addEventListener("click", (e) => {
    e.stopPropagation();
    const menuBtn = e.target.closest(".room-menu-btn");
    const renameBtn = e.target.closest(".room-rename-btn");
    const deleteBtn = e.target.closest(".room-delete-btn");

    if (menuBtn) {
      const dropdown = menuBtn.nextElementSibling;
      document.querySelectorAll(".room-menu-dropdown.show").forEach((d) => {
        if (d !== dropdown) d.classList.remove("show");
      });
      dropdown.classList.toggle("show");
      return;
    }
    document.querySelectorAll(".room-menu-dropdown.show").forEach((d) => d.classList.remove("show"));

    if (renameBtn) {
      editingRoomId = renameBtn.dataset.roomId;
      roomModalTitle.textContent = "Rename Room";
      roomNameInput.value = renameBtn.dataset.roomName;
      openModal("roomModal");
      roomNameInput.focus();
    } else if (deleteBtn) {
      if (!confirmAction("Delete this room and all its devices? This cannot be undone.")) return;
      const res = Store.deleteRoom(deleteBtn.dataset.roomId);
      showToast(res.message, res.success ? "success" : "danger");
      if (res.success) render();
    }
  });
  document.addEventListener("click", () => {
    document.querySelectorAll(".room-menu-dropdown.show").forEach((d) => d.classList.remove("show"));
  });

  function save() {
    const name = roomNameInput.value.trim();
    if (!name) {
      showToast("Please enter a room name.", "danger");
      return;
    }
    const res = editingRoomId ? Store.renameRoom(editingRoomId, name) : Store.addRoom(name);
    if (res.success) {
      showToast(res.message, "success");
      closeModal("roomModal");
      render();
    } else {
      showToast(res.message, "danger");
    }
  }
  saveRoomBtn.addEventListener("click", save);
  roomNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
});
