/* Environment page: temperature/humidity chart with live refresh */
document.addEventListener("DOMContentLoaded", () => {
  const env = Store.environmentData();
  document.getElementById("tempValue").textContent = `${env.temperature}°C`;
  document.getElementById("humidityValue").textContent = `${env.humidityNow}%`;

  const envCtx = document.getElementById("envChart");
  if (envCtx && typeof Chart !== "undefined") {
    new Chart(envCtx, {
      type: "line",
      data: {
        labels: env.hours,
        datasets: [
          { label: "Temperature (°C)", data: env.temps, borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.08)", fill: true, tension: 0.35, yAxisID: "y" },
          { label: "Humidity (%)", data: env.humidity, borderColor: "#4f46e5", backgroundColor: "rgba(79, 70, 229, 0.08)", fill: true, tension: 0.35, yAxisID: "y1" },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { type: "linear", position: "left", grid: { color: "#eef0f7" } },
          y1: { type: "linear", position: "right", grid: { display: false } },
        },
      },
    });
  }

  // Simulate live sensor refresh every 15 seconds
  setInterval(() => {
    const cur = Store.currentEnvironment();
    document.getElementById("tempValue").textContent = `${cur.temperature}°C`;
    document.getElementById("humidityValue").textContent = `${cur.humidity}%`;
  }, 15000);
});
