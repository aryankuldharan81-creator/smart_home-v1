/* =========================================================
   NestControl — Core JavaScript
   Shared functionality: auth guard, sidebar, toasts,
   notifications, device toggles. Loaded on every page.
   ========================================================= */

// ---------- Auth guard (runs immediately) ----------
(function () {
  const body = document.body;
  if (!body) return;
  const loggedIn = !!Store.currentUser();
  if (body.dataset.auth === "required" && !loggedIn) {
    Store.flashSet("Please log in to continue.", "warning");
    window.location.replace("login.html");
  } else if (body.dataset.auth === "guest" && loggedIn) {
    window.location.replace("dashboard.html");
  }
})();

// ---------- Helpers ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function fmtTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtDateTime(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) + ", " + fmtTime(d);
}
function fmtLongDate(d) {
  return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
}
function fmtISODate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

// ---------- Toast Notifications ----------
function showToast(message, type = "success") {
  const stack = document.getElementById("toastStack");
  if (!stack) return;

  const icons = { success: "fa-circle-check", danger: "fa-circle-exclamation", warning: "fa-triangle-exclamation" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// ---------- Flash messages (inline alerts) ----------
function showFlash(messages, type) {
  const host = document.getElementById("flashHost");
  if (!host) return;
  const list = Array.isArray(messages) ? messages : [messages];
  const icon = type === "success" ? "fa-circle-check" : type === "danger" ? "fa-circle-exclamation" : "fa-triangle-exclamation";
  host.innerHTML = `<div class="flash-stack">${list.map((m) => `
    <div class="alert alert-${type}">
      <i class="fa-solid ${icon}"></i>
      <span>${escapeHtml(m)}</span>
    </div>`).join("")}</div>`;
}

// ---------- Simple confirm dialog wrapper ----------
function confirmAction(message) {
  return window.confirm(message);
}

// ---------- Modals ----------
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add("show"); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove("show"); }

// ---------- Device card markup (dashboard + devices page) ----------
function deviceCardHtml(device, withRemove) {
  return `
  <div class="device-card" data-device-id="${device.id}">
    <div class="device-card-top">
      <div class="device-icon"><i class="fa-solid fa-${device.icon}"></i></div>
      ${withRemove ? '<div class="device-card-actions">' : ""}
        <label class="toggle-switch">
          <input type="checkbox" class="device-toggle" data-device-id="${device.id}" ${device.status ? "checked" : ""} ${device.online ? "" : "disabled"}>
          <span class="toggle-slider"></span>
        </label>
      ${withRemove ? "</div>" : ""}
    </div>
    <div class="device-name">${escapeHtml(device.name)}</div>
    <div class="device-room">${escapeHtml(device.roomName)}</div>
    <div class="device-status">
      <span class="status-dot ${device.online ? "online" : "offline"}"></span>
      <span>${device.online ? "Online" : "Offline"}</span>
    </div>
    ${withRemove ? `<button class="device-remove-btn" data-device-id="${device.id}" title="Remove device">
      <i class="fa-solid fa-trash"></i>
    </button>` : ""}
  </div>`;
}

// ---------- Shell refresh (badges) ----------
function refreshBadges() {
  const unread = Store.unreadCount();

  const dotHost = document.getElementById("notifBtn");
  if (dotHost) {
    const existing = dotHost.querySelector(".icon-dot");
    if (unread > 0 && !existing) {
      const dot = document.createElement("span");
      dot.className = "icon-dot";
      dotHost.appendChild(dot);
    } else if (unread === 0 && existing) {
      existing.remove();
    }
  }

  const navLink = document.getElementById("navNotifications");
  if (navLink) {
    let badge = navLink.querySelector(".nav-badge");
    if (unread > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "nav-badge";
        navLink.appendChild(badge);
      }
      badge.textContent = unread;
    } else if (badge) {
      badge.remove();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = Store.currentUser();

  // Flash message carried over from a previous page
  const flash = Store.flashTake();
  if (flash) showFlash(flash.message, flash.type);

  if (user) {
    const avatar = document.getElementById("userAvatar");
    const nameEl = document.getElementById("userNameLabel");
    if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.name;
    refreshBadges();
  }

  // ---------- Logout ----------
  document.querySelectorAll(".logout-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      Store.logout();
      Store.flashSet("You have been logged out successfully.", "success");
      window.location.href = "login.html";
    });
  });

  // ---------- Sidebar (mobile) ----------
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("hamburgerBtn");
  const closeBtn = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar && sidebar.classList.add("show");
    overlay && overlay.classList.add("show");
  }
  function closeSidebar() {
    sidebar && sidebar.classList.remove("show");
    overlay && overlay.classList.remove("show");
  }

  hamburger && hamburger.addEventListener("click", openSidebar);
  closeBtn && closeBtn.addEventListener("click", closeSidebar);
  overlay && overlay.addEventListener("click", closeSidebar);

  // ---------- Notifications dropdown ----------
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifBody = document.getElementById("notifDropdownBody");

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (notifDropdown.classList.contains("show")) {
        notifDropdown.classList.remove("show");
        return;
      }
      notifDropdown.classList.add("show");
      try {
        const notes = Store.notifications(6);
        if (notes.length === 0) {
          notifBody.innerHTML = '<div class="empty-mini">No notifications yet.</div>';
        } else {
          notifBody.innerHTML = notes.map((n) => `
            <div class="notif-mini-item ${n.isRead ? "" : "unread"}">
              <span>${escapeHtml(n.message)}</span>
            </div>
          `).join("");
        }
      } catch (err) {
        notifBody.innerHTML = '<div class="empty-mini">Could not load notifications.</div>';
      }
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove("show");
      }
    });
  }

  // ---------- Modal close buttons (works for dynamic pages too) ----------
  document.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (closer) closeModal(closer.dataset.close);
  });

  // ---------- Device toggle switches (dashboard + devices page) ----------
  document.addEventListener("change", (e) => {
    const checkbox = e.target;
    if (!checkbox.classList || !checkbox.classList.contains("device-toggle")) return;
    const result = Store.toggleDevice(checkbox.dataset.deviceId);
    if (result.success) {
      checkbox.checked = result.status;
      showToast(result.message, "success");
      refreshBadges();
    } else {
      checkbox.checked = !checkbox.checked;
      showToast(result.message || "Something went wrong.", "danger");
    }
  });
});
