import {
  applyCommand,
  createInitialSession,
  formatTime,
  getAllTrains,
  getStation,
  getStatusText,
  getTrainPosition,
  getTrainTarget,
  getVisibleTrains,
  stationBlueprint,
  tickSession
} from "./simulation.js";

const els = {
  landing: document.querySelector("#landing-screen"),
  game: document.querySelector("#game-screen"),
  canvas: document.querySelector("#network-canvas"),
  clock: document.querySelector("#clock-value"),
  punctuality: document.querySelector("#punctuality-value"),
  queue: document.querySelector("#queue-value"),
  balance: document.querySelector("#balance-value"),
  trainList: document.querySelector("#train-list"),
  context: document.querySelector("#context-panel"),
  lineStatus: document.querySelector("#line-status"),
  dispatchReserve: document.querySelector("#dispatch-reserve"),
  missionList: document.querySelector("#mission-list"),
  xp: document.querySelector("#xp-value"),
  alertTitle: document.querySelector("#alert-title"),
  alertDescription: document.querySelector("#alert-description"),
  alertSeverity: document.querySelector("#alert-severity"),
  eventLog: document.querySelector("#event-log"),
  live: document.querySelector("#live-region"),
  portrait: document.querySelector("#portrait-notice"),
  continueMessage: document.querySelector("#continue-message")
};

let session;
let selected = null;
let simTimer;
let saveTimer;
let commandSequence = 0;

const canvasContext = els.canvas.getContext("2d");

async function init() {
  const saved = await saveStore.load();
  if (saved) els.continueMessage.hidden = false;
  document.querySelectorAll("[data-start]").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.start));
  });
  document.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => setTimeScale(Number(button.dataset.time)));
  });
  els.dispatchReserve.addEventListener("click", () => runCommand({ type: "DISPATCH_RESERVE" }));
  document.querySelector("#continue-session").addEventListener("click", continueSavedSession);
  els.canvas.addEventListener("click", selectFromMap);
  window.addEventListener("resize", renderMap);
  window.addEventListener("keydown", handleKeyboard);
}

async function startGame(mode) {
  const saved = await saveStore.load();
  session = saved && saved.mode === mode ? saved : createInitialSession(mode);
  selected = { type: "station", id: session.metrics.criticalStationId };
  els.landing.hidden = true;
  els.game.hidden = false;
  setTimeScale(session.timeScale || 1);
  render();
  window.clearInterval(simTimer);
  simTimer = window.setInterval(() => {
    if (!session || session.timeScale === 0) return;
    tickSession(session, session.timeScale);
    render();
    scheduleSave();
  }, 250);
}

async function continueSavedSession() {
  const saved = await saveStore.load();
  if (!saved) {
    announce("Ainda não existe um turno salvo.");
    return;
  }
  session = saved;
  selected = { type: "station", id: session.metrics.criticalStationId };
  els.landing.hidden = true;
  els.game.hidden = false;
  setTimeScale(session.timeScale || 1);
  render();
  if (!simTimer) simTimer = window.setInterval(() => {
    if (session.timeScale === 0) return;
    tickSession(session, session.timeScale);
    render();
    scheduleSave();
  }, 250);
}

function setTimeScale(scale) {
  if (!session) return;
  session.timeScale = scale;
  document.querySelectorAll("[data-time]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.time) === scale);
  });
  announce(scale === 0 ? "Simulação pausada." : `Velocidade ajustada para ${scale} vezes.`);
  scheduleSave();
}

function runCommand(command) {
  if (!session) return;
  const result = applyCommand(session, { ...command, id: `cmd-${session.time}-${commandSequence++}` });
  announce(result.message);
  if (result.accepted && command.type === "HOLD_TRAIN") selected = { type: "train", id: command.trainId };
  render();
  scheduleSave();
}

function render() {
  if (!session) return;
  const critical = getStation(session, session.metrics.criticalStationId);
  els.clock.textContent = formatTime(session.time);
  els.punctuality.textContent = `${session.metrics.onTime}%`;
  els.queue.textContent = `${critical.name} · ${critical.queue}`;
  els.balance.textContent = formatCurrency(session.balanceCents);
  els.xp.textContent = `${session.xp} XP`;
  els.lineStatus.textContent = session.incidents.length ? "ATENÇÃO" : "EM OPERAÇÃO";
  els.lineStatus.className = `status-pill ${session.incidents.length ? "warning" : "good"}`;
  renderTrains();
  renderContext();
  renderMission();
  renderAlerts();
  renderLog();
  renderMap();
}

function renderTrains() {
  els.trainList.innerHTML = getAllTrains(session).map((train) => {
    const selectedClass = selected?.type === "train" && selected.id === train.id ? " selected" : "";
    const warning = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status) ? " warning" : "";
    const occupancy = train.visible ? `${Math.round(train.occupancy / train.capacity * 100)}%` : "Pronto";
    return `<button class="train-row${selectedClass}" data-select-train="${train.id}">
      <i class="train-indicator${warning}"></i>
      <span><strong>${train.id}</strong><small>${getStatusText(train.status)}</small></span>
      <b>${occupancy}</b>
    </button>`;
  }).join("");
  els.trainList.querySelectorAll("[data-select-train]").forEach((button) => {
    button.addEventListener("click", () => {
      selected = { type: "train", id: button.dataset.selectTrain };
      if (!session.missions.observe) runCommand({ type: "OBSERVE_NETWORK" });
      render();
    });
  });
}

function renderContext() {
  if (!selected) {
    els.context.innerHTML = `<div class="context-placeholder"><div class="context-icon">◎</div><h2>Selecione a rede</h2><p class="context-copy">Clique em um trem ou estação para emitir ordens válidas.</p></div>`;
    return;
  }
  if (selected.type === "train") {
    const train = getAllTrains(session).find((item) => item.id === selected.id);
    if (!train) return;
    const next = getStation(session, getTrainTarget(train));
    const canHold = train.visible && !["HELD", "DEPOT_READY", "DISPATCHING"].includes(train.status);
    els.context.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">TREM SELECIONADO</p><h2>${train.id}</h2></div><span class="status-pill ${train.status === "HELD" ? "warning" : "good"}">${getStatusText(train.status)}</span></div>
      <p class="context-copy">O comando é validado pelo motor e seus efeitos aparecem no mapa, na fila e no registro.</p>
      <ul class="key-value">
        <li><span>Próxima estação</span><strong>${next.name}</strong></li>
        <li><span>Ocupação</span><strong>${train.occupancy} / ${train.capacity}</strong></li>
        <li><span>Atraso</span><strong>+${train.delaySec}s</strong></li>
        <li><span>Intervalo</span><strong>${session.metrics.onTime >= 93 ? "regular" : "sob pressão"}</strong></li>
      </ul>
      <div class="action-stack">
        ${train.status === "HELD"
          ? `<button class="button primary" data-command="release" data-train="${train.id}">Liberar trem</button>`
          : `<button class="button warn" data-command="hold" data-train="${train.id}" ${canHold ? "" : "disabled"}>Segurar no próximo ponto</button>`}
        <button class="button secondary" data-focus="critical">Ver estação prioritária</button>
      </div>`;
  } else {
    const station = getStation(session, selected.id);
    const pressure = Math.round(station.queue / station.capacity * 100);
    const risky = pressure >= 100;
    els.context.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">ESTAÇÃO SELECIONADA</p><h2>${station.name}</h2></div><span class="status-pill ${risky ? "warning" : "good"}">${pressure}% DA CAPACIDADE</span></div>
      <p class="context-copy">Demanda, embarques e lotação são calculados durante o turno.</p>
      <ul class="key-value">
        <li><span>Fila na plataforma</span><strong>${station.queue} passageiros</strong></li>
        <li><span>Capacidade operacional</span><strong>${station.capacity}</strong></li>
        <li><span>Entradas neste turno</span><strong>${station.arrivals}</strong></li>
        <li><span>Embarques neste turno</span><strong>${station.departures}</strong></li>
      </ul>
      <div class="action-stack">
        <button class="button primary" data-command="reserve">Enviar trem reserva</button>
        <button class="button secondary" data-command="observe">Analisar rede</button>
      </div>`;
  }
  els.context.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const { command, train } = button.dataset;
      if (command === "hold") runCommand({ type: "HOLD_TRAIN", trainId: train });
      if (command === "release") runCommand({ type: "RELEASE_TRAIN", trainId: train });
      if (command === "reserve") runCommand({ type: "DISPATCH_RESERVE" });
      if (command === "observe") runCommand({ type: "OBSERVE_NETWORK" });
    });
  });
  els.context.querySelector("[data-focus]")?.addEventListener("click", () => {
    selected = { type: "station", id: session.metrics.criticalStationId };
    render();
  });
}

function renderMission() {
  const missions = [
    [session.missions.observe, "Selecione um trem ou analise a rede"],
    [session.missions.hold, "Regule o intervalo com uma retenção"],
    [session.missions.reserve, "Envie o trem reserva para aliviar a demanda"]
  ];
  els.missionList.innerHTML = missions.map(([done, text]) => `<li class="${done ? "done" : ""}">${text}</li>`).join("");
}

function renderAlerts() {
  const incident = session.incidents[0];
  const critical = getStation(session, session.metrics.criticalStationId);
  if (incident) {
    els.alertTitle.textContent = `Fila elevada em ${critical.name}`;
    els.alertDescription.textContent = `${critical.queue} passageiros aguardam para uma capacidade de ${critical.capacity}. Considere reforçar a oferta.`;
    els.alertSeverity.textContent = "ATENÇÃO";
    els.alertSeverity.className = "status-pill warning";
  } else {
    els.alertTitle.textContent = "Rede estabilizando";
    els.alertDescription.textContent = `${critical.name} tem a maior fila atual (${critical.queue}), mas permanece abaixo do limite operacional.`;
    els.alertSeverity.textContent = "NORMAL";
    els.alertSeverity.className = "status-pill good";
  }
}

function renderLog() {
  els.eventLog.innerHTML = session.log.slice(0, 4).map((event) => `<li><time>${formatTime(event.at)}</time>${event.text}</li>`).join("");
}

function renderMap() {
  if (!session || els.game.hidden) return;
  const rect = els.canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (els.canvas.width !== width * scale || els.canvas.height !== height * scale) {
    els.canvas.width = width * scale;
    els.canvas.height = height * scale;
  }
  canvasContext.setTransform(scale, 0, 0, scale, 0, 0);
  canvasContext.clearRect(0, 0, width, height);
  drawGrid(width, height);
  drawTrack(width, height);
  drawStations(width, height);
  drawTrains(width, height);
}

function drawGrid(width, height) {
  const gradient = canvasContext.createRadialGradient(width * 0.48, height * 0.44, 20, width * 0.48, height * 0.44, width * 0.8);
  gradient.addColorStop(0, "#0a3453");
  gradient.addColorStop(1, "#041221");
  canvasContext.fillStyle = gradient;
  canvasContext.fillRect(0, 0, width, height);
  canvasContext.strokeStyle = "rgba(98, 196, 240, 0.08)";
  canvasContext.lineWidth = 1;
  for (let x = 0; x < width; x += 32) { canvasContext.beginPath(); canvasContext.moveTo(x, 0); canvasContext.lineTo(x, height); canvasContext.stroke(); }
  for (let y = 0; y < height; y += 32) { canvasContext.beginPath(); canvasContext.moveTo(0, y); canvasContext.lineTo(width, y); canvasContext.stroke(); }
}

function mapPoint(node, width, height) {
  return { x: node.x * width, y: node.y * height };
}

function drawTrack(width, height) {
  canvasContext.save();
  canvasContext.lineCap = "round";
  canvasContext.lineJoin = "round";
  canvasContext.beginPath();
  stationBlueprint.forEach((station, index) => {
    const point = mapPoint(station, width, height);
    if (index === 0) canvasContext.moveTo(point.x, point.y); else canvasContext.lineTo(point.x, point.y);
  });
  canvasContext.strokeStyle = "rgba(7, 52, 84, 0.95)";
  canvasContext.lineWidth = 18;
  canvasContext.stroke();
  canvasContext.strokeStyle = "rgba(25, 179, 255, 0.88)";
  canvasContext.lineWidth = 5;
  canvasContext.shadowBlur = 16;
  canvasContext.shadowColor = "#19bfff";
  canvasContext.stroke();
  canvasContext.restore();
}

function drawStations(width, height) {
  for (const station of session.stations) {
    const point = mapPoint(station, width, height);
    const selectedStation = selected?.type === "station" && selected.id === station.id;
    const risk = station.queue >= station.capacity;
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.arc(point.x, point.y, selectedStation ? 14 : 10, 0, Math.PI * 2);
    canvasContext.fillStyle = risk ? "#ffbf45" : "#e6f5ff";
    canvasContext.shadowBlur = selectedStation || risk ? 20 : 8;
    canvasContext.shadowColor = risk ? "#ffb013" : "#4edbff";
    canvasContext.fill();
    canvasContext.beginPath();
    canvasContext.arc(point.x, point.y, selectedStation ? 7 : 5, 0, Math.PI * 2);
    canvasContext.fillStyle = "#07335b";
    canvasContext.fill();
    canvasContext.shadowBlur = 0;
    canvasContext.fillStyle = "#eaf7ff";
    canvasContext.font = "700 12px Inter, system-ui, sans-serif";
    canvasContext.fillText(station.name, point.x + 13, point.y - 12);
    canvasContext.font = "600 10px Inter, system-ui, sans-serif";
    canvasContext.fillStyle = risk ? "#ffcf74" : "#a9cde1";
    canvasContext.fillText(`${station.queue} em fila`, point.x + 13, point.y + 4);
    canvasContext.restore();
  }
}

function drawTrains(width, height) {
  for (const train of getVisibleTrains(session)) {
    const position = getTrainPosition(session, train);
    const point = { x: position.x * width, y: position.y * height };
    const isSelected = selected?.type === "train" && selected.id === train.id;
    const paused = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status);
    canvasContext.save();
    canvasContext.translate(point.x, point.y);
    canvasContext.rotate(0.32);
    canvasContext.shadowBlur = isSelected ? 22 : 12;
    canvasContext.shadowColor = paused ? "#ffbf45" : "#1bd4ff";
    canvasContext.fillStyle = paused ? "#f5be48" : "#daf5ff";
    canvasContext.fillRect(-8, -5, 16, 10);
    canvasContext.fillStyle = "#0c6ba7";
    canvasContext.fillRect(-3, -3, 9, 6);
    canvasContext.restore();
    if (isSelected) {
      canvasContext.strokeStyle = "#ffffff";
      canvasContext.lineWidth = 1.5;
      canvasContext.beginPath();
      canvasContext.arc(point.x, point.y, 15, 0, Math.PI * 2);
      canvasContext.stroke();
    }
  }
}

function selectFromMap(event) {
  const rect = els.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const train = getVisibleTrains(session).find((item) => {
    const position = getTrainPosition(session, item);
    return Math.hypot(position.x - x, position.y - y) < 0.05;
  });
  if (train) {
    selected = { type: "train", id: train.id };
    if (!session.missions.observe) runCommand({ type: "OBSERVE_NETWORK" }); else render();
    return;
  }
  const station = session.stations.find((item) => Math.hypot(item.x - x, item.y - y) < 0.06);
  if (station) {
    selected = { type: "station", id: station.id };
    if (!session.missions.observe) runCommand({ type: "OBSERVE_NETWORK" }); else render();
  }
}

function handleKeyboard(event) {
  if (!session || els.game.hidden || event.target.matches("button")) return;
  if (event.code === "Space") { event.preventDefault(); setTimeScale(session.timeScale === 0 ? 1 : 0); render(); }
  if (["Digit1", "Digit2", "Digit4"].includes(event.code)) { setTimeScale(Number(event.code.at(-1))); render(); }
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

function announce(message) { els.live.textContent = message; }

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveStore.save(session), 700);
}

const saveStore = {
  async database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("vale-metro-control", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("sessions");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async load() {
    try {
      const db = await this.database();
      return await new Promise((resolve, reject) => {
        const request = db.transaction("sessions", "readonly").objectStore("sessions").get("active");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  },
  async save(value) {
    try {
      const db = await this.database();
      await new Promise((resolve, reject) => {
        const request = db.transaction("sessions", "readwrite").objectStore("sessions").put(value, "active");
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
    } catch {
      localStorage.setItem("vale-metro-control-active", JSON.stringify(value));
    }
  }
};

init();
