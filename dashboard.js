/* Dashboard page */
document.addEventListener("DOMContentLoaded", () => {
  const user = Store.currentUser();
  if (!user) return;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  document.getElementById("greetingTitle").textContent = `${greeting}, ${user.name.split(" ")[0]} 👋`;

  const devices = Store.devices();
  const online = devices.filter((d) => d.online).length;
  const armed = Store.isArmed();
  document.getElementById("statTotal").textContent = devices.length;
  document.getElementById("statOnline").textContent = `${online}/${devices.length}`;
  document.getElementById("statEnergy").textContent = `${(Math.round((Math.random() * 4 + 4.5) * 10) / 10)} kWh`;
  document.getElementById("statSecurity").textContent = armed ? "Armed" : "Disarmed";
  document.getElementById("statSecurityIcon").className = `stat-icon ${armed ? "green" : "red"}`;

  const grid = document.getElementById("deviceGrid");
  grid.innerHTML = devices.length
    ? devices.map((d) => deviceCardHtml(d, false)).join("")
    : `<div class="empty-state"><i class="fa-solid fa-plug-circle-xmark"></i><p>No devices yet. Head to the Devices page to add your first one.</p></div>`;

  const recent = Store.activities(5);
  document.getElementById("recentActivity").innerHTML = recent.length
    ? `<ul class="activity-list">${recent.map((a) => `
      <li>
        <div class="activity-dot"></div>
        <div class="activity-content">
          <span class="activity-title">${a.deviceName ? escapeHtml(a.deviceName) + " — " : ""}${escapeHtml(a.action)}</span>
          <span class="activity-time">${fmtTime(a.time)}</span>
        </div>
        <span class="badge badge-success">${escapeHtml(a.status)}</span>
      </li>`).join("")}</ul>`
    : `<div class="empty-state"><i class="fa-solid fa-clock"></i><p>No activity recorded yet.</p></div>`;
});
