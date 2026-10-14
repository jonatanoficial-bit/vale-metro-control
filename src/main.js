import {
  applyCommand,
  cityProfiles,
  createInitialSession,
  formatTime,
  getAllTrains,
  getActiveIncidents,
  getStation,
  getStatusText,
  getTrainPosition,
  getTrainTarget,
  getVisibleTrains,
  normalizeSession,
  tickSession
} from "./simulation.js";

const els = {
  landing: document.querySelector("#landing-screen"),
  citySelection: document.querySelector("#city-selection"),
  cityOptions: document.querySelector("#city-options"),
  backToLanding: document.querySelector("#back-to-landing"),
  game: document.querySelector("#game-screen"),
  canvas: document.querySelector("#network-canvas"),
  clock: document.querySelector("#clock-value"),
  punctuality: document.querySelector("#punctuality-value"),
  queue: document.querySelector("#queue-value"),
  balance: document.querySelector("#balance-value"),
  career: document.querySelector("#career-value"),
  fleet: document.querySelector("#fleet-value"),
  cityName: document.querySelector("#city-name"),
  lineName: document.querySelector("#line-name"),
  lineSummary: document.querySelector("#line-summary"),
  corridorName: document.querySelector("#corridor-name"),
  trainList: document.querySelector("#train-list"),
  context: document.querySelector("#context-panel"),
  lineStatus: document.querySelector("#line-status"),
  dispatchReserve: document.querySelector("#dispatch-reserve"),
  activateSupportLine: document.querySelector("#activate-support-line"),
  supportLineCopy: document.querySelector("#support-line-copy"),
  missionList: document.querySelector("#mission-list"),
  xp: document.querySelector("#xp-value"),
  alertTitle: document.querySelector("#alert-title"),
  alertDescription: document.querySelector("#alert-description"),
  alertSeverity: document.querySelector("#alert-severity"),
  alertActions: document.querySelector("#alert-actions"),
  eventLog: document.querySelector("#event-log"),
  policyList: document.querySelector("#policy-list"),
  completeTurn: document.querySelector("#complete-turn"),
  turnSummary: document.querySelector("#turn-summary"),
  turnSummaryContent: document.querySelector("#turn-summary-content"),
  nextTurn: document.querySelector("#next-turn"),
  returnToCities: document.querySelector("#return-to-cities"),
  live: document.querySelector("#live-region"),
  portrait: document.querySelector("#portrait-notice"),
  continueMessage: document.querySelector("#continue-message"),
  resumeSaved: document.querySelector("#resume-saved")
};

let session;
let selected = null;
let simTimer;
let saveTimer;
let commandSequence = 0;
let careerProfiles = {};

const canvasContext = els.canvas.getContext("2d");

async function init() {
  const [saved, savedCareers] = await Promise.all([saveStore.load(), saveStore.loadCareerProfiles()]);
  careerProfiles = savedCareers;
  renderCityOptions();
  if (saved) {
    els.continueMessage.hidden = false;
    els.resumeSaved.hidden = false;
  }
  document.querySelectorAll("[data-start]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.start === "career") openCitySelection();
      else startGame("sandbox", "vale-central");
    });
  });
  document.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => setTimeScale(Number(button.dataset.time)));
  });
  els.dispatchReserve.addEventListener("click", () => runCommand({ type: "DISPATCH_RESERVE" }));
  els.activateSupportLine.addEventListener("click", () => runCommand({ type: "ACTIVATE_SUPPORT_LINE" }));
  els.policyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-policy-command]");
    if (!button || button.disabled) return;
    runCommand({ type: button.dataset.policyCommand });
  });
  els.alertActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-alert-command]");
    if (!button || button.disabled) return;
    if (button.dataset.alertCommand === "signal") runCommand({ type: "ISOLATE_SIGNAL", incidentId: button.dataset.incident });
    if (button.dataset.alertCommand === "passengers") runCommand({ type: "DIRECT_PASSENGERS", incidentId: button.dataset.incident });
  });
  els.resumeSaved.addEventListener("click", continueSavedSession);
  els.backToLanding.addEventListener("click", showLanding);
  els.completeTurn.addEventListener("click", completeCurrentTurn);
  els.nextTurn.addEventListener("click", startNextTurn);
  els.returnToCities.addEventListener("click", () => {
    els.turnSummary.hidden = true;
    showLanding();
    openCitySelection();
  });
  els.canvas.addEventListener("click", selectFromMap);
  window.addEventListener("resize", renderMap);
  window.addEventListener("keydown", handleKeyboard);
}

function renderCityOptions() {
  els.cityOptions.innerHTML = cityProfiles.map((city) => {
    const career = careerProfiles[city.id];
    const progress = career
      ? `Dia ${career.day} · ${career.completedTurns} turno${career.completedTurns === 1 ? "" : "s"} concluído${career.completedTurns === 1 ? "" : "s"}`
      : "Nova carreira";
    return `<button class="city-card" data-city="${city.id}">
      <span class="city-difficulty">${city.difficulty}</span>
      <strong>${city.name}</strong>
      <p>${city.description}</p>
      <small>${city.lineName} · caixa inicial ${formatCurrency(career?.balanceCents ?? city.startingBalanceCents)}</small>
      <em>${progress}</em>
    </button>`;
  }).join("");
  els.cityOptions.querySelectorAll("[data-city]").forEach((button) => {
    button.addEventListener("click", () => startCareer(button.dataset.city));
  });
}

function openCitySelection() {
  els.landing.hidden = true;
  els.citySelection.hidden = false;
  els.game.hidden = true;
  els.turnSummary.hidden = true;
  renderCityOptions();
}

function showLanding() {
  window.clearInterval(simTimer);
  simTimer = undefined;
  els.citySelection.hidden = true;
  els.game.hidden = true;
  els.landing.hidden = false;
}

async function startCareer(cityId) {
  await startGame("career", cityId, careerProfiles[cityId] || null);
}

async function startGame(mode, cityId = "vale-central", careerProfile = null) {
  session = createInitialSession(mode, cityId, careerProfile);
  selected = { type: "station", id: session.metrics.criticalStationId };
  els.landing.hidden = true;
  els.citySelection.hidden = true;
  els.turnSummary.hidden = true;
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
  session = normalizeSession(saved);
  selected = { type: "station", id: session.metrics.criticalStationId };
  els.landing.hidden = true;
  els.citySelection.hidden = true;
  els.turnSummary.hidden = true;
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
  if (!session || session.turn?.status === "complete") return;
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

async function completeCurrentTurn() {
  if (!session) return;
  const result = applyCommand(session, { id: `cmd-${session.time}-${commandSequence++}`, type: "COMPLETE_TURN" });
  announce(result.message);
  if (result.accepted) {
    const nextProfile = {
      ...session.career,
      day: session.career.day + 1,
      balanceCents: session.balanceCents,
      reputation: session.reputation,
      totalXp: session.career.totalXp,
      completedTurns: session.career.completedTurns,
      completedProjectIds: session.career.completedProjectIds,
      policyState: session.career.policyState
    };
    careerProfiles[session.cityId] = nextProfile;
    await saveStore.saveCareerProfiles(careerProfiles);
    renderTurnSummary(result.summary);
  }
  render();
  scheduleSave();
}

function renderTurnSummary(summary) {
  els.turnSummaryContent.innerHTML = `<div class="turn-grade"><b>${summary.grade}</b><div><strong>${summary.score}% de desempenho operacional</strong><p>${summary.onTime}% de pontualidade · ${summary.incidentsOpen} ocorrência${summary.incidentsOpen === 1 ? "" : "s"} em aberto</p><p>Recompensa: ${formatCurrency(summary.rewardCents)} · +${summary.xpReward} XP de desempenho</p></div></div>`;
  els.turnSummary.hidden = false;
}

async function startNextTurn() {
  if (!session?.career) return;
  const cityId = session.cityId;
  await startGame("career", cityId, careerProfiles[cityId]);
}

function render() {
  if (!session) return;
  const critical = getStation(session, session.metrics.criticalStationId);
  els.clock.textContent = formatTime(session.time);
  els.punctuality.textContent = `${session.metrics.onTime}%`;
  els.queue.textContent = `${critical.name} · ${critical.queue}`;
  els.balance.textContent = formatCurrency(session.balanceCents);
  els.xp.textContent = `${session.xp} XP`;
  els.cityName.textContent = session.city;
  els.lineName.textContent = session.lineName;
  els.corridorName.textContent = `Corredor ${session.corridor}`;
  els.canvas.setAttribute("aria-label", `Mapa de ${session.lineName} com estações e trens selecionáveis`);
  els.career.textContent = session.mode === "career" ? `Dia ${session.career.day}` : "Sandbox";
  const visibleFleet = getAllTrains(session).filter((train) => train.visible);
  const averageCondition = Math.round(visibleFleet.reduce((sum, train) => sum + train.condition, 0) / Math.max(visibleFleet.length, 1));
  els.fleet.textContent = `${averageCondition}% · ${session.metrics.activeLines} linha${session.metrics.activeLines === 1 ? "" : "s"}`;
  const supportOperating = session.network.supportLineStatus === "operating";
  const supportActivating = session.network.supportLineStatus === "activating";
  els.lineSummary.textContent = supportOperating
    ? `${session.lineName} e ${session.supportLineName} operam em conjunto, com ${getVisibleTrains(session).length} composições em serviço.`
    : `Uma linha, cinco estações, quatro composições e uma reserva no pátio. ${session.supportLineName} está disponível.`;
  els.activateSupportLine.disabled = supportOperating || supportActivating;
  els.activateSupportLine.textContent = supportOperating
    ? `${session.supportLineName} em operação`
    : supportActivating
      ? `${session.supportLineName} em preparação`
      : `Ativar ${session.supportLineName} · ${formatCurrency(6_800_00)}`;
  els.supportLineCopy.textContent = supportOperating
    ? `VM-201 reforça as conexões expressas entre as estações-chave.`
    : `R$ 6.800 · libera VM-201 em uma rota expressa de conexão.`;
  const remainingTurnTime = Math.max(0, session.turn.minimumDuration - (session.time - session.turn.startedAt));
  els.completeTurn.disabled = session.mode !== "career" || session.turn.status === "complete";
  els.completeTurn.textContent = session.turn.status === "complete"
    ? "Turno concluído"
    : remainingTurnTime > 0
      ? `Encerrar em ${remainingTurnTime}s`
      : "Encerrar turno";
  const activeIncidents = getActiveIncidents(session);
  const emergency = activeIncidents.some((incident) => incident.severity === "critical");
  els.lineStatus.textContent = emergency ? "EMERGÊNCIA" : activeIncidents.length ? "ATENÇÃO" : "EM OPERAÇÃO";
  els.lineStatus.className = `status-pill ${emergency ? "danger" : activeIncidents.length ? "warning" : "good"}`;
  renderTrains();
  renderContext();
  renderMission();
  renderAlerts();
  renderLog();
  renderPolicies();
  renderMap();
}

function renderTrains() {
  els.trainList.innerHTML = getAllTrains(session).map((train) => {
    const selectedClass = selected?.type === "train" && selected.id === train.id ? " selected" : "";
    const warning = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status) || train.faultActive ? " warning" : "";
    const occupancy = train.visible ? `${Math.round(train.occupancy / train.capacity * 100)}%` : "Pronto";
    return `<button class="train-row${selectedClass}" data-select-train="${train.id}">
      <i class="train-indicator${warning}"></i>
      <span><strong>${train.id}</strong><small>${getTrainLineLabel(train)} · ${getStatusText(train.status)}</small></span>
      <b>${occupancy}<small>${train.condition}%</small></b>
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
    const incident = getActiveIncidents(session).find((item) => item.trainId === train.id);
    const incidentStatus = incident?.status === "responding" ? `Equipe a caminho · ${incident.responseRemaining}s` : "Falha de porta ativa";
    const maintenanceRecommended = train.condition < 92 && !incident && train.status !== "MAINTENANCE" && train.visible;
    els.context.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">TREM SELECIONADO</p><h2>${train.id}</h2></div><span class="status-pill ${train.status === "HELD" || incident ? "warning" : "good"}">${incident ? incidentStatus : getStatusText(train.status)}</span></div>
      <p class="context-copy">O comando é validado pelo motor e seus efeitos aparecem no mapa, na fila e no registro.</p>
      <ul class="key-value">
        <li><span>Próxima estação</span><strong>${next.name}</strong></li>
        <li><span>Ocupação</span><strong>${train.occupancy} / ${train.capacity}</strong></li>
        <li><span>Condição da frota</span><strong>${train.condition}% ${train.condition < 70 ? "· atenção" : ""}</strong></li>
        <li><span>Atraso</span><strong>+${train.delaySec}s</strong></li>
        <li><span>Intervalo</span><strong>${session.metrics.onTime >= 93 ? "regular" : "sob pressão"}</strong></li>
        ${incident ? `<li><span>Ocorrência</span><strong>${incident.type}</strong></li>` : ""}
      </ul>
      <div class="action-stack">
        ${incident ? `<button class="button danger" data-command="maintenance" data-incident="${incident.id}" ${incident.status === "responding" ? "disabled" : ""}>${incident.status === "responding" ? "Equipe em resposta" : "Enviar manutenção"}</button>` : ""}
        ${maintenanceRecommended ? `<button class="button primary" data-command="preventive" data-train="${train.id}">Manutenção preventiva · ${formatCurrency(2_200_00)}</button>` : ""}
        ${train.status === "MAINTENANCE" ? `<button class="button secondary" disabled>Manutenção em curso · ${train.maintenanceRemaining}s</button>` : ""}
        ${train.status === "HELD"
          ? `<button class="button primary" data-command="release" data-train="${train.id}">Liberar trem</button>`
          : `<button class="button warn" data-command="hold" data-train="${train.id}" ${canHold ? "" : "disabled"}>Segurar no próximo ponto</button>`}
        <button class="button secondary" data-focus="critical">Ver estação prioritária</button>
      </div>`;
  } else {
    const station = getStation(session, selected.id);
    const project = Object.values(session.projects).find((item) => item.stationId === station.id);
    const pressure = Math.round(station.queue / station.capacity * 100);
    const risky = pressure >= 100;
    const projectCopy = project?.status === "available"
      ? `Pronta · +${project.capacityGain} de capacidade`
      : project?.status === "building"
        ? `Obra em andamento · ${project.constructionRemaining}s`
        : `Concluída · +${project.capacityGain} de capacidade`;
    els.context.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">ESTAÇÃO SELECIONADA</p><h2>${station.name}</h2></div><span class="status-pill ${risky ? "warning" : "good"}">${pressure}% DA CAPACIDADE</span></div>
      <p class="context-copy">Demanda, embarques e lotação são calculados durante o turno.</p>
      <ul class="key-value">
        <li><span>Fila na plataforma</span><strong>${station.queue} passageiros</strong></li>
        <li><span>Capacidade operacional</span><strong>${station.capacity}</strong></li>
        <li><span>Entradas neste turno</span><strong>${station.arrivals}</strong></li>
        <li><span>Embarques neste turno</span><strong>${station.departures}</strong></li>
      </ul>
      ${project ? `<div class="project-summary"><strong>${project.title}</strong><p>${projectCopy}</p></div>` : ""}
      <div class="action-stack">
        ${project?.status === "available" ? `<button class="button primary" data-command="expansion" data-project="${project.id}">Aprovar expansão · ${formatCurrency(project.costCents)}</button>` : ""}
        ${project?.status === "building" ? `<button class="button secondary" disabled>Obra em andamento · ${project.constructionRemaining}s</button>` : ""}
        ${project?.status === "complete" ? `<button class="button secondary" disabled>Expansão concluída</button>` : ""}
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
      if (command === "maintenance") runCommand({ type: "ASSIGN_MAINTENANCE", incidentId: button.dataset.incident });
      if (command === "preventive") runCommand({ type: "SCHEDULE_PREVENTIVE_MAINTENANCE", trainId: train });
      if (command === "expansion") runCommand({ type: "APPROVE_EXPANSION", projectId: button.dataset.project });
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
    [session.missions.reserve, "Envie o trem reserva para aliviar a demanda"],
    [session.missions.maintenance, "Coordene a resposta a uma falha leve"],
    [session.missions.signal, "Isole uma falha de sinal crítica"],
    [session.missions.passengers, "Direcione passageiros durante uma emergência"],
    [session.missions.expansion, "Entregue uma expansão urbana na estação prioritária"],
    [session.missions.supportLine, "Ative uma segunda linha para ampliar a rede"],
    [session.missions.preventiveMaintenance, "Programe manutenção preventiva da frota"],
    [session.missions.peakService, "Aplique uma política de reforço no pico"]
  ];
  els.missionList.innerHTML = missions.map(([done, text]) => `<li class="${done ? "done" : ""}">${text}</li>`).join("");
}

function renderAlerts() {
  const incident = getActiveIncidents(session).find((item) => item.type === "Falha de sinal")
    || getActiveIncidents(session).find((item) => item.type === "Falha de porta")
    || getActiveIncidents(session)[0];
  const critical = getStation(session, session.metrics.criticalStationId);
  els.alertActions.innerHTML = "";
  if (incident) {
    if (incident.type === "Falha de sinal") {
      const isolating = incident.status === "responding";
      els.alertTitle.textContent = `Falha de sinal — ${getStation(session, "central").name}–${getStation(session, "riverside").name}`;
      els.alertDescription.textContent = isolating
        ? `Centro de sinal em resposta: ${incident.responseRemaining}s restantes. O trecho permanece isolado.`
        : "O corredor foi bloqueado. Isole o sinal e reduza a pressão nas plataformas com agentes de estação.";
      els.alertSeverity.textContent = "CRÍTICO";
      els.alertSeverity.className = "status-pill danger";
      els.alertActions.innerHTML = `<button class="button danger" data-alert-command="signal" data-incident="${incident.id}" ${isolating ? "disabled" : ""}>${isolating ? "Centro de sinal em resposta" : "Isolar sinal"}</button>
        <button class="button secondary" data-alert-command="passengers" data-incident="${incident.id}" ${incident.passengerPlanActive ? "disabled" : ""}>${incident.passengerPlanActive ? "Passageiros direcionados" : "Direcionar passageiros"}</button>`;
    } else {
      if (incident.type === "Falha de porta") {
        const response = incident.status === "responding" ? `Equipe em resposta: ${incident.responseRemaining}s restantes.` : "Selecione o trem e envie a equipe de manutenção.";
        els.alertTitle.textContent = `${incident.type} — ${incident.trainId}`;
        els.alertDescription.textContent = `A composição terá permanência adicional em plataforma. ${response}`;
      } else {
        els.alertTitle.textContent = `Fila elevada em ${critical.name}`;
        els.alertDescription.textContent = `${critical.queue} passageiros aguardam para uma capacidade de ${critical.capacity}. Considere reforçar a oferta.`;
      }
      els.alertSeverity.textContent = "ATENÇÃO";
      els.alertSeverity.className = "status-pill warning";
    }
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

function renderPolicies() {
  const policies = [
    {
      command: "ACTIVATE_PEAK_SERVICE",
      title: "Reforço de pico",
      copy: session.policies.peakBoostRemaining > 0
        ? `Ativo por mais ${session.policies.peakBoostRemaining}s de simulação.`
        : "Acelera embarques durante 150 s para reduzir a pressão nas plataformas.",
      button: session.policies.peakBoostRemaining > 0 ? "Reforço ativo" : `Ativar · ${formatCurrency(3_600_00)}`,
      active: session.policies.peakBoostRemaining > 0
    },
    {
      command: "ACTIVATE_GREEN_ENERGY",
      title: "Energia eficiente",
      copy: session.policies.greenEnergy
        ? "Ativa: o custo operacional por segundo já está reduzido."
        : "Moderniza a matriz energética e reduz o custo recorrente da rede.",
      button: session.policies.greenEnergy ? "Programa ativo" : `Aprovar · ${formatCurrency(8_400_00)}`,
      active: session.policies.greenEnergy
    },
    {
      command: "SET_SOCIAL_FARE",
      title: "Tarifa social",
      copy: session.policies.farePlan === "social"
        ? "Ativa: mais reputação, com menor receita por embarque."
        : "Aumenta acesso e reputação, reduzindo a receita unitária.",
      button: session.policies.farePlan === "social" ? "Tarifa ativa" : "Aprovar plano",
      active: session.policies.farePlan === "social"
    }
  ];
  els.policyList.innerHTML = policies.map((policy) => `<article class="policy-item ${policy.active ? "active" : ""}">
    <div><strong>${policy.title}</strong><p>${policy.copy}</p></div>
    <button class="text-button" data-policy-command="${policy.command}" ${policy.active ? "disabled" : ""}>${policy.button}</button>
  </article>`).join("");
}

function getTrainLineLabel(train) {
  if (train.line === "SUPORTE") return session.supportLineName;
  if (train.line === "RESERVA") return "Reserva";
  return session.lineName;
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
  drawRoute(session.stations, "rgba(7, 52, 84, 0.95)", "rgba(25, 179, 255, 0.88)", 18, 5, width, height);
  if (session.supportTrain?.visible) {
    const supportStations = session.supportTrain.route.map((id) => getStation(session, id));
    drawRoute(supportStations, "rgba(53, 17, 86, 0.94)", "rgba(194, 105, 255, 0.94)", 13, 3.5, width, height);
  }
  if (session.network.blockedSegments.includes("central:riverside")) {
    const central = mapPoint(session.stations.find((station) => station.id === "central"), width, height);
    const riverside = mapPoint(session.stations.find((station) => station.id === "riverside"), width, height);
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.moveTo(central.x, central.y);
    canvasContext.lineTo(riverside.x, riverside.y);
    canvasContext.strokeStyle = "#ff596b";
    canvasContext.lineWidth = 7;
    canvasContext.shadowBlur = 18;
    canvasContext.shadowColor = "#ff596b";
    canvasContext.stroke();
    canvasContext.restore();
  }
}

function drawRoute(stations, underlay, color, underlayWidth, lineWidth, width, height) {
  canvasContext.save();
  canvasContext.lineCap = "round";
  canvasContext.lineJoin = "round";
  canvasContext.beginPath();
  stations.forEach((station, index) => {
    const point = mapPoint(station, width, height);
    if (index === 0) canvasContext.moveTo(point.x, point.y); else canvasContext.lineTo(point.x, point.y);
  });
  canvasContext.strokeStyle = underlay;
  canvasContext.lineWidth = underlayWidth;
  canvasContext.stroke();
  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = lineWidth;
  canvasContext.shadowBlur = 16;
  canvasContext.shadowColor = color;
  canvasContext.stroke();
  canvasContext.restore();
}

function drawStations(width, height) {
  for (const station of session.stations) {
    const point = mapPoint(station, width, height);
    const selectedStation = selected?.type === "station" && selected.id === station.id;
    const risk = station.queue >= station.capacity;
    const expanded = station.expansionLevel > 0;
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.arc(point.x, point.y, selectedStation ? 14 : 10, 0, Math.PI * 2);
    canvasContext.fillStyle = risk ? "#ffbf45" : expanded ? "#50e39a" : "#e6f5ff";
    canvasContext.shadowBlur = selectedStation || risk || expanded ? 20 : 8;
    canvasContext.shadowColor = risk ? "#ffb013" : expanded ? "#50e39a" : "#4edbff";
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
    const paused = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status) || train.faultActive;
    canvasContext.save();
    canvasContext.translate(point.x, point.y);
    canvasContext.rotate(0.32);
    canvasContext.shadowBlur = isSelected ? 22 : 12;
    canvasContext.shadowColor = train.faultActive ? "#ff596b" : paused ? "#ffbf45" : "#1bd4ff";
    canvasContext.fillStyle = train.faultActive ? "#ff8797" : paused ? "#f5be48" : "#daf5ff";
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
  },
  async loadCareerProfiles() {
    try {
      const db = await this.database();
      return await new Promise((resolve, reject) => {
        const request = db.transaction("sessions", "readonly").objectStore("sessions").get("career-profiles");
        request.onsuccess = () => resolve(request.result || {});
        request.onerror = () => reject(request.error);
      });
    } catch {
      return JSON.parse(localStorage.getItem("vale-metro-control-careers") || "{}");
    }
  },
  async saveCareerProfiles(value) {
    try {
      const db = await this.database();
      await new Promise((resolve, reject) => {
        const request = db.transaction("sessions", "readwrite").objectStore("sessions").put(value, "career-profiles");
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
    } catch {
      localStorage.setItem("vale-metro-control-careers", JSON.stringify(value));
    }
  }
};

init();
