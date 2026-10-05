/* =========================================================
   NestControl — Data layer (browser only, no backend)
   All data is saved in the browser's localStorage so the app
   works by simply opening the HTML files.
   ========================================================= */

const Store = (function () {
  const mem = {};

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return mem["l_" + k] !== undefined ? mem["l_" + k] : null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { mem["l_" + k] = v; } }
  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return mem["s_" + k] !== undefined ? mem["s_" + k] : null; } }
  function ssSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { mem["s_" + k] = v; } }
  function ssDel(k) { try { window.sessionStorage.removeItem(k); } catch (e) { delete mem["s_" + k]; } }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { delete mem["l_" + k]; } }

  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const ICONS = { light: "lightbulb", fan: "fan", ac: "snowflake", tv: "tv", door: "lock", alarm: "shield", other: "plug" };

  // ---------- helpers ----------
  function readJSON(key, fallback) {
    try {
      const raw = lsGet(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) { lsSet(key, JSON.stringify(value)); }

  function hashPw(pw, salt) {
    // Simple non-cryptographic hash (demo project, no server).
    const str = salt + "::" + pw;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  function nextId() {
    const n = (readJSON("nc_next_id", 1000) || 1000) + 1;
    writeJSON("nc_next_id", n);
    return n;
  }

  function rand(min, max) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }

  // ---------- users & session ----------
  function users() { return readJSON("nc_users", []); }
  function saveUsers(list) { writeJSON("nc_users", list); }

  function sessionId() {
    const v = ssGet("nc_session") || lsGet("nc_session");
    return v ? Number(v) : null;
  }

  function currentUser() {
    const id = sessionId();
    if (!id) return null;
    return users().find((u) => u.id === id) || null;
  }

  function dataKey() { return "nc_data_" + sessionId(); }
  function load() { return readJSON(dataKey(), { rooms: [], devices: [], activities: [], automations: [], notifications: [], armed: true }); }
  function save(d) { writeJSON(dataKey(), d); }

  function log(d, action, status, device) {
    d.activities.push({
      id: nextId(),
      deviceId: device ? device.id : null,
      deviceName: device ? device.name : null,
      action: action,
      status: status || "Success",
      ts: new Date().toISOString(),
    });
  }
  function notify(d, message, type) {
    d.notifications.push({ id: nextId(), message: message, type: type || "success", isRead: false, ts: new Date().toISOString() });
  }

  function createDefaultData(userId, withSamples) {
    const roomData = {
      "Living Room": [["Living Room Light", "light"], ["Television", "tv"], ["Smart Door", "door"]],
      "Bedroom": [["Bedroom Light", "light"], ["Ceiling Fan", "fan"]],
      "Kitchen": [["Kitchen Light", "light"]],
      "Garage": [["Security Alarm", "alarm"]],
    };
    const d = { rooms: [], devices: [], activities: [], automations: [], notifications: [], armed: true };
    const now = Date.now();
    Object.keys(roomData).forEach((roomName) => {
      const room = { id: nextId(), name: roomName, createdAt: new Date(now).toISOString() };
      d.rooms.push(room);
      roomData[roomName].forEach((pair) => {
        d.devices.push({
          id: nextId(), name: pair[0], type: pair[1], roomId: room.id,
          status: Math.random() < 0.5, online: true, createdAt: new Date(now).toISOString(),
        });
      });
    });
    d.notifications.push({ id: nextId(), message: "Welcome to your Smart Home dashboard!", type: "success", isRead: false, ts: new Date(now).toISOString() });

    if (withSamples) {
      const ago = (min) => new Date(now - min * 60000).toISOString();
      [
        ["Living Room Light", "Turned ON", 120],
        ["Ceiling Fan", "Turned OFF", 105],
        ["Smart Door", "Locked", 90],
        [null, "Security System Armed", 80],
        [null, "Living Room Motion Detected", 60],
      ].forEach((e) => {
        d.activities.push({ id: nextId(), deviceId: null, deviceName: e[0], action: e[1], status: "Success", ts: ago(e[2]) });
      });
      d.automations.push(
        { id: nextId(), name: "Evening Lights", condition: "Time = 7:00 PM", action: "Living Room Light = ON", enabled: true, createdAt: ago(30) },
        { id: nextId(), name: "Auto Cooling", condition: "Temperature > 28°C", action: "AC = ON", enabled: true, createdAt: ago(20) }
      );
    }
    writeJSON("nc_data_" + userId, d);
  }

  function seedDemo() {
    const list = users();
    if (list.some((u) => u.email === "demo@example.com")) return;
    const salt = "demo";
    const user = { id: nextId(), name: "Demo User", email: "demo@example.com", salt: salt, hash: hashPw("Demo@123", salt), createdAt: new Date().toISOString() };
    list.push(user);
    saveUsers(list);
    createDefaultData(user.id, true);
  }

  // ---------- auth ----------
  function login(email, password, remember) {
    email = (email || "").trim().toLowerCase();
    const errors = [];
    if (!email || !EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
    if (!password) errors.push("Password is required.");
    if (errors.length) return { success: false, errors: errors };
    const user = users().find((u) => u.email === email);
    if (!user || user.hash !== hashPw(password, user.salt)) return { success: false, errors: ["Invalid email or password."] };
    ssDel("nc_session"); lsDel("nc_session");
    if (remember) lsSet("nc_session", String(user.id)); else ssSet("nc_session", String(user.id));
    return { success: true };
  }

  function register(name, email, password, confirm) {
    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    const errors = [];
    if (!name || name.length < 2) errors.push("Please enter your full name.");
    if (!email || !EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters long.");
    if (password !== confirm) errors.push("Passwords do not match.");
    if (email && users().some((u) => u.email === email)) errors.push("An account with this email already exists.");
    if (errors.length) return { success: false, errors: errors };
    const salt = String(Math.random()).slice(2, 10);
    const user = { id: nextId(), name: name, email: email, salt: salt, hash: hashPw(password, salt), createdAt: new Date().toISOString() };
    const list = users();
    list.push(user);
    saveUsers(list);
    createDefaultData(user.id, false);
    return { success: true };
  }

  function logout() { ssDel("nc_session"); lsDel("nc_session"); }

  function updateName(name) {
    name = (name || "").trim();
    if (name.length < 2) return { success: false, message: "Please enter a valid name." };
    const list = users();
    const u = list.find((x) => x.id === sessionId());
    if (!u) return { success: false, message: "Not logged in." };
    u.name = name;
    saveUsers(list);
    const d = load(); log(d, "Updated profile name"); save(d);
    return { success: true, message: "Profile updated successfully." };
  }

  function changePassword(current, next, confirm) {
    const list = users();
    const u = list.find((x) => x.id === sessionId());
    if (!u) return { success: false, message: "Not logged in." };
    if (u.hash !== hashPw(current, u.salt)) return { success: false, message: "Current password is incorrect." };
    if (!next || next.length < 6) return { success: false, message: "New password must be at least 6 characters." };
    if (next !== confirm) return { success: false, message: "New passwords do not match." };
    u.salt = String(Math.random()).slice(2, 10);
    u.hash = hashPw(next, u.salt);
    saveUsers(list);
    const d = load(); log(d, "Changed account password"); save(d);
    return { success: true, message: "Password changed successfully." };
  }

  // ---------- rooms ----------
  function rooms() {
    const d = load();
    return d.rooms.map((r) => Object.assign({}, r, { deviceCount: d.devices.filter((x) => x.roomId === r.id).length }));
  }
  function addRoom(name) {
    name = (name || "").trim();
    if (!name) return { success: false, message: "Room name is required." };
    const d = load();
    d.rooms.push({ id: nextId(), name: name, createdAt: new Date().toISOString() });
    log(d, "Added room '" + name + "'");
    save(d);
    return { success: true, message: "Room added." };
  }
  function renameRoom(id, name) {
    name = (name || "").trim();
    const d = load();
    const room = d.rooms.find((r) => r.id === Number(id));
    if (!room) return { success: false, message: "Room not found." };
    if (!name) return { success: false, message: "Room name is required." };
    room.name = name;
    log(d, "Renamed room to '" + name + "'");
    save(d);
    return { success: true, message: "Room renamed." };
  }
  function deleteRoom(id) {
    id = Number(id);
    const d = load();
    const room = d.rooms.find((r) => r.id === id);
    if (!room) return { success: false, message: "Room not found." };
    d.rooms = d.rooms.filter((r) => r.id !== id);
    d.devices = d.devices.filter((x) => x.roomId !== id);
    log(d, "Deleted room '" + room.name + "'");
    save(d);
    return { success: true, message: "Room deleted." };
  }

  // ---------- devices ----------
  function decorate(d, dev) {
    const room = d.rooms.find((r) => r.id === dev.roomId);
    return Object.assign({}, dev, { icon: ICONS[dev.type] || "plug", roomName: room ? room.name : "" });
  }
  function devices() { const d = load(); return d.devices.map((x) => decorate(d, x)); }
  function addDevice(name, type, roomId) {
    name = (name || "").trim();
    if (!name || !roomId) return { success: false, message: "Device name and room are required." };
    const d = load();
    const room = d.rooms.find((r) => r.id === Number(roomId));
    if (!room) return { success: false, message: "Invalid room selected." };
    d.devices.push({ id: nextId(), name: name, type: type || "other", roomId: room.id, status: false, online: true, createdAt: new Date().toISOString() });
    log(d, "Added device '" + name + "'");
    save(d);
    return { success: true, message: "Device added." };
  }
  function toggleDevice(id) {
    const d = load();
    const dev = d.devices.find((x) => x.id === Number(id));
    if (!dev) return { success: false, message: "Device not found." };
    if (!dev.online) return { success: false, message: "Device is offline." };
    dev.status = !dev.status;
    const word = dev.status ? "ON" : "OFF";
    log(d, "Turned " + word, "Success", dev);
    notify(d, dev.name + " turned " + word, "success");
    save(d);
    return { success: true, status: dev.status, message: dev.name + " turned " + word };
  }
  function deleteDevice(id) {
    id = Number(id);
    const d = load();
    const dev = d.devices.find((x) => x.id === id);
    if (!dev) return { success: false, message: "Device not found." };
    d.devices = d.devices.filter((x) => x.id !== id);
    log(d, "Removed device '" + dev.name + "'");
    save(d);
    return { success: true, message: "Device removed." };
  }

  // ---------- security ----------
  function isArmed() { return load().armed !== false; }
  function setArmed(armed) {
    const d = load();
    d.armed = armed;
    log(d, armed ? "Security System Armed" : "Security System Disarmed");
    notify(d, armed ? "Security system armed" : "Security system disarmed", armed ? "success" : "warning");
    save(d);
    return { success: true, armed: armed, message: armed ? "Security system armed." : "Security system disarmed." };
  }
  function door() {
    const d = load();
    const dev = d.devices.find((x) => x.type === "door");
    return dev ? decorate(d, dev) : null;
  }
  function doorAction(action) {
    if (action !== "lock" && action !== "unlock") return { success: false, message: "Invalid action." };
    const d = load();
    const dev = d.devices.find((x) => x.type === "door");
    if (!dev) return { success: false, message: "No smart door found." };
    dev.status = action === "lock";
    const label = dev.status ? "Front Door Locked" : "Front Door Unlocked";
    log(d, label, "Success", dev);
    notify(d, label, dev.status ? "success" : "warning");
    save(d);
    return { success: true, locked: dev.status, message: label };
  }
  function securityEvents() {
    return activities().filter((a) => /door|security|motion|armed|disarmed/i.test(a.action)).slice(0, 15);
  }

  // ---------- activity ----------
  function activities(limit) {
    const d = load();
    const list = d.activities.map((a) => Object.assign({}, a, { time: new Date(a.ts) }));
    list.sort((a, b) => (b.time - a.time) || (b.id - a.id));
    return limit ? list.slice(0, limit) : list;
  }

  // ---------- automations ----------
  function automations() {
    const list = load().automations.slice();
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id);
    return list;
  }
  function addAutomation(name, condition, action) {
    name = (name || "").trim(); condition = (condition || "").trim(); action = (action || "").trim();
    if (!name || !condition || !action) return { success: false, message: "All fields are required." };
    const d = load();
    d.automations.push({ id: nextId(), name: name, condition: condition, action: action, enabled: true, createdAt: new Date().toISOString() });
    log(d, "Created automation '" + name + "'");
    save(d);
    return { success: true, message: "Automation created." };
  }
  function toggleAutomation(id) {
    const d = load();
    const r = d.automations.find((x) => x.id === Number(id));
    if (!r) return { success: false, message: "Automation not found." };
    r.enabled = !r.enabled;
    save(d);
    return { success: true, enabled: r.enabled };
  }
  function deleteAutomation(id) {
    const d = load();
    const before = d.automations.length;
    d.automations = d.automations.filter((x) => x.id !== Number(id));
    if (d.automations.length === before) return { success: false, message: "Automation not found." };
    save(d);
    return { success: true, message: "Automation deleted." };
  }

  // ---------- notifications ----------
  function notifications(limit) {
    const list = load().notifications.map((n) => Object.assign({}, n, { time: new Date(n.ts) }));
    list.sort((a, b) => (b.time - a.time) || (b.id - a.id));
    return limit ? list.slice(0, limit) : list;
  }
  function unreadCount() { return load().notifications.filter((n) => !n.isRead).length; }
  function markAllRead() {
    const d = load();
    d.notifications.forEach((n) => { n.isRead = true; });
    save(d);
  }

  // ---------- simulated sensor / energy data ----------
  function energyData() {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = [];
    for (let i = 6; i >= 0; i--) labels.push(dayNames[new Date(Date.now() - i * 86400000).getDay()]);
    const dailyValues = labels.map(() => rand(4.0, 9.5));
    const weeklyValues = [1, 2, 3, 4].map(() => rand(30, 55));
    const sum = (a) => Math.round(a.reduce((x, y) => x + y, 0) * 10) / 10;
    return {
      dailyLabels: labels, dailyValues: dailyValues,
      weeklyLabels: ["Week 1", "Week 2", "Week 3", "Week 4"], weeklyValues: weeklyValues,
      today: dailyValues[dailyValues.length - 1], week: sum(dailyValues), month: sum(weeklyValues),
    };
  }
  function environmentData() {
    const hours = [];
    for (let h = 0; h < 24; h += 3) hours.push(String(h).padStart(2, "0") + ":00");
    const temps = hours.map(() => rand(20, 30));
    const humidity = hours.map(() => rand(40, 70));
    return { hours: hours, temps: temps, humidity: humidity, temperature: temps[temps.length - 1], humidityNow: humidity[humidity.length - 1] };
  }
  function currentEnvironment() { return { temperature: rand(20, 30), humidity: rand(40, 70) }; }

  seedDemo();

  return {
    EMAIL_RE: EMAIL_RE,
    sessionId: sessionId, currentUser: currentUser,
    login: login, register: register, logout: logout, updateName: updateName, changePassword: changePassword,
    rooms: rooms, addRoom: addRoom, renameRoom: renameRoom, deleteRoom: deleteRoom,
    devices: devices, addDevice: addDevice, toggleDevice: toggleDevice, deleteDevice: deleteDevice,
    isArmed: isArmed, setArmed: setArmed, door: door, doorAction: doorAction, securityEvents: securityEvents,
    activities: activities,
    automations: automations, addAutomation: addAutomation, toggleAutomation: toggleAutomation, deleteAutomation: deleteAutomation,
    notifications: notifications, unreadCount: unreadCount, markAllRead: markAllRead,
    energyData: energyData, environmentData: environmentData, currentEnvironment: currentEnvironment,
    flashSet: function (message, type) { ssSet("nc_flash", JSON.stringify({ message: message, type: type || "success" })); },
    flashTake: function () {
      const raw = ssGet("nc_flash");
      if (!raw) return null;
      ssDel("nc_flash");
      try { return JSON.parse(raw); } catch (e) { return null; }
    },
  };
})();
