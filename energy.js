/* Energy page: Chart.js line/bar charts */
document.addEventListener("DOMContentLoaded", () => {
  const data = Store.energyData();
  document.getElementById("todayUsage").textContent = `${data.today} kWh`;
  document.getElementById("weekUsage").textContent = `${data.week} kWh`;
  document.getElementById("monthUsage").textContent = `${data.month} kWh`;

  if (typeof Chart === "undefined") return;

  const dailyCtx = document.getElementById("dailyChart");
  const weeklyCtx = document.getElementById("weeklyChart");

  if (dailyCtx) {
    new Chart(dailyCtx, {
      type: "bar",
      data: {
        labels: data.dailyLabels,
        datasets: [{ label: "kWh", data: data.dailyValues, backgroundColor: "#4f46e5", borderRadius: 8, maxBarThickness: 36 }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: "#eef0f7" } }, x: { grid: { display: false } } },
      },
    });
  }

  if (weeklyCtx) {
    new Chart(weeklyCtx, {
      type: "line",
      data: {
        labels: data.weeklyLabels,
        datasets: [{
          label: "kWh", data: data.weeklyValues, borderColor: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.1)",
          fill: true, tension: 0.35, pointBackgroundColor: "#16a34a",
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: "#eef0f7" } }, x: { grid: { display: false } } },
      },
    });
  }
});
