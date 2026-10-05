/* History page: client-side search, device/action/date filters */
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const deviceFilter = document.getElementById("deviceFilter");
  const actionFilter = document.getElementById("actionFilter");
  const dateFilter = document.getElementById("dateFilter");
  const tbody = document.querySelector("#historyTable tbody");

  const activities = Store.activities(200);
  const deviceNames = Array.from(new Set(activities.map((a) => a.deviceName).filter(Boolean))).sort();
  deviceFilter.innerHTML = '<option value="">All Devices</option>' +
    deviceNames.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

  tbody.innerHTML = activities.length
    ? activities.map((a) => `
      <tr data-device="${escapeHtml(a.deviceName || "")}" data-action="${escapeHtml(a.action)}" data-date="${fmtISODate(a.time)}">
        <td>${fmtTime(a.time)}</td>
        <td>${a.deviceName ? escapeHtml(a.deviceName) : "—"}</td>
        <td>${escapeHtml(a.action)}</td>
        <td><span class="badge badge-success">${escapeHtml(a.status)}</span></td>
      </tr>`).join("")
    : `<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-clock"></i><p>No activity recorded yet.</p></div></td></tr>`;

  const rows = document.querySelectorAll("#historyTable tbody tr[data-device]");

  function applyFilters() {
    const searchTerm = (searchInput.value || "").toLowerCase();
    const deviceVal = deviceFilter.value;
    const actionVal = actionFilter.value;
    const dateVal = dateFilter.value;

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const device = row.dataset.device;
      const action = row.dataset.action || "";
      const date = row.dataset.date;

      const matchesSearch = !searchTerm || text.includes(searchTerm);
      const matchesDevice = !deviceVal || device === deviceVal;
      const matchesAction = !actionVal || new RegExp("\\b" + actionVal + "\\b", "i").test(action);
      const matchesDate = !dateVal || date === dateVal;

      row.style.display = (matchesSearch && matchesDevice && matchesAction && matchesDate) ? "" : "none";
    });
  }

  [searchInput, deviceFilter, actionFilter, dateFilter].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });
});
