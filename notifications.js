/* Notifications page */
document.addEventListener("DOMContentLoaded", () => {
  const notes = Store.notifications(50);
  const icons = { success: "fa-check", warning: "fa-triangle-exclamation", danger: "fa-circle-exclamation" };
  const host = document.getElementById("notificationHolder");

  host.innerHTML = notes.length
    ? `<ul class="notification-list">${notes.map((n) => `
      <li class="notification-item ${n.isRead ? "" : "unread"}">
        <div class="notif-icon ${escapeHtml(n.type)}"><i class="fa-solid ${icons[n.type] || "fa-circle-info"}"></i></div>
        <div class="notification-content">
          <span class="notification-message">${escapeHtml(n.message)}</span>
          <span class="notification-time">${fmtDateTime(n.time)}</span>
        </div>
      </li>`).join("")}</ul>`
    : `<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><p>You're all caught up. No notifications yet.</p></div>`;

  // Opening this page marks everything as read (same as before)
  Store.markAllRead();
  refreshBadges();
});
