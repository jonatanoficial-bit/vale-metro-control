import {
  applyCommand,
  cityProfiles,
  createInitialSession,
  formatTime,
  getCareerRank,
  getPreventiveMaintenanceCost,
  getAllTrains,
  getActiveIncidents,
  getStation,
  getStatusText,
  getTrainPosition,
  getTrainTarget,
  getVisibleTrains,
  normalizeSession,
  specializationCatalog,
  tickSession
} from "./simulation.js?v=6";

const els = {
  landing: document.querySelector("#landing-screen"),
  citySelection: document.querySelector("#city-selection"),
  cityOptions: document.querySelector("#city-options"),
  backToLanding: document.querySelector("#back-to-landing"),
  game: document.querySelector("#game-screen"),
  centralView: document.querySelector("#central-view"),
  networkView: document.querySelector("#network-view"),
  detailScreen: document.querySelector("#game-detail-screen"),
  navigation: document.querySelector(".game-navigation"),
  networkOverview: document.querySelector("#network-overview"),
  dispatchFeed: document.querySelector("#dispatch-feed"),
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
  campaignContent: document.querySelector("#campaign-content"),
  accessibilityToggle: document.querySelector("#accessibility-toggle"),
  accessibilityPanel: document.querySelector("#accessibility-panel"),
  accessibilityClose: document.querySelector("#accessibility-close"),
  completeTurn: document.querySelector("#complete-turn"),
  turnSummary: document.querySelector("#turn-summary"),
  turnSummaryContent: document.querySelector("#turn-summary-content"),
  nextTurn: document.querySelector("#next-turn"),
  returnToCities: document.querySelector("#return-to-cities"),
  live: document.querySelector("#live-region"),
  continueMessage: document.querySelector("#continue-message"),
  resumeSaved: document.querySelector("#resume-saved"),
  tutorialCoach: document.querySelector("#tutorial-coach"),
  tutorialOverlay: document.querySelector("#tutorial-overlay"),
  tutorialTitle: document.querySelector("#tutorial-title"),
  tutorialCopy: document.querySelector("#tutorial-copy"),
  tutorialPrimary: document.querySelector("#tutorial-primary"),
  tutorialSkip: document.querySelector("#tutorial-skip")
};

let session;
let selected = null;
let simTimer;
let saveTimer;
let commandSequence = 0;
let careerProfiles = {};
let audioContext;
let activeGameView = "central";

const accessibilityStorageKey = "vale-metro-control-accessibility";
let accessibility = loadAccessibilityPreferences();

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
  els.navigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game-view]");
    if (button) setGameView(button.dataset.gameView);
  });
  els.dispatchReserve.addEventListener("click", () => runCommand({ type: "DISPATCH_RESERVE" }));
  els.activateSupportLine.addEventListener("click", () => runCommand({ type: "ACTIVATE_SUPPORT_LINE" }));
  els.policyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-policy-command]");
    if (!button || button.disabled) return;
    runCommand({ type: button.dataset.policyCommand });
  });
  els.campaignContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-campaign-command], [data-career-command]");
    if (!button || button.disabled) return;
    if (button.dataset.campaignCommand === "station-team") {
      runCommand({ type: "DEPLOY_STATION_TEAM", stationId: button.dataset.stationId });
    }
    if (button.dataset.careerCommand === "specialization") {
      runCommand({ type: "SELECT_SPECIALIZATION", specializationId: button.dataset.specialization });
    }
  });
  els.accessibilityToggle.addEventListener("click", () => setAccessibilityPanel(els.accessibilityPanel.hidden));
  els.accessibilityClose.addEventListener("click", () => setAccessibilityPanel(false));
  els.accessibilityPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-accessibility-setting]");
    if (!button) return;
    const setting = button.dataset.accessibilitySetting;
    accessibility[setting] = !accessibility[setting];
    saveAccessibilityPreferences();
    applyAccessibilityPreferences();
    if (setting === "audio" && accessibility.audio) playOperationalCue("enabled");
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
  els.tutorialPrimary.addEventListener("click", handleTutorialPrimary);
  els.tutorialSkip.addEventListener("click", () => {
    if (!session?.tutorial) return;
    session.tutorial.status = "skipped";
    session.tutorial.promptOpen = false;
    announce("Orientação pausada. Camila ficará disponível durante este turno.");
    render();
    scheduleSave();
  });
  els.tutorialCoach.addEventListener("click", () => {
    if (!session?.tutorial || session.tutorial.status !== "active") return;
    session.tutorial.promptOpen = true;
    renderTutorial();
  });
  els.canvas.addEventListener("click", selectFromMap);
  window.addEventListener("resize", renderMap);
  window.addEventListener("keydown", handleKeyboard);
  applyAccessibilityPreferences();
  registerServiceWorker();
}

function renderCityOptions() {
  els.cityOptions.innerHTML = cityProfiles.map((city) => {
    const career = careerProfiles[city.id];
    const rank = getCareerRank(career?.totalXp ?? 0);
    const completedContracts = career?.campaignState?.completedContracts?.length ?? 0;
    const nextChapter = city.campaign[(career?.campaignState?.chapterIndex ?? 0) % city.campaign.length];
    const progress = career
      ? `Dia ${career.day} · ${career.completedTurns} turno${career.completedTurns === 1 ? "" : "s"} concluído${career.completedTurns === 1 ? "" : "s"}`
      : "Nova carreira";
    return `<button class="city-card" data-city="${city.id}">
      <span class="city-difficulty">${city.difficulty}</span>
      <strong>${city.name}</strong>
      <p>${city.description}</p>
      <small>${city.lineName} · caixa inicial ${formatCurrency(career?.balanceCents ?? city.startingBalanceCents)}<br>${rank.title} · nível ${rank.level}<br>Próximo contrato: ${nextChapter.contract.title} · ${completedContracts}/${city.campaign.length} concluídos</small>
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
  setGameView("central");
  setTimeScale(session.timeScale || 1);
  render();
  window.clearInterval(simTimer);
  simTimer = window.setInterval(() => {
    if (!session || session.timeScale === 0) return;
    tickSession(session, session.timeScale);
    render();
    scheduleSave();
  }, 1000);
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
  setGameView("central");
  setTimeScale(session.timeScale || 1);
  render();
  if (!simTimer) simTimer = window.setInterval(() => {
    if (session.timeScale === 0) return;
    tickSession(session, session.timeScale);
    render();
    scheduleSave();
  }, 1000);
}

function setGameView(view) {
  if (!['central', 'network', 'missions', 'career'].includes(view)) return;
  activeGameView = view;
  els.centralView.hidden = view !== 'central';
  els.networkView.hidden = view !== 'network';
  const showDetails = view === 'missions' || view === 'career';
  els.detailScreen.hidden = !showDetails;
  els.detailScreen.querySelectorAll('[data-game-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.gamePanel !== view;
  });
  els.navigation.querySelectorAll('[data-game-view]').forEach((button) => {
    const active = button.dataset.gameView === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (session) {
    renderTutorial();
    if (view === 'network') renderNetworkOverview();
    if (view === 'central') window.requestAnimationFrame(renderMap);
  }
}

function handleTutorialPrimary() {
  if (!session?.tutorial) return;
  const tutorial = session.tutorial;
  if (tutorial.status === 'intro') {
    tutorial.status = 'active';
    tutorial.step = 1;
    tutorial.promptOpen = false;
    selected = { type: 'station', id: session.metrics.criticalStationId };
    setGameView('central');
    announce('Camila Rocha: comece pela leitura da rede.');
  } else if (tutorial.status === 'active') {
    tutorial.promptOpen = false;
  } else if (tutorial.status === 'complete') {
    tutorial.status = 'acknowledged';
    tutorial.promptOpen = false;
    announce('Certificação operacional registrada. Continue a campanha para desbloquear novas rotinas.');
  }
  render();
  scheduleSave();
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
  playOperationalCue(result.accepted ? "success" : "warning");
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
      policyState: session.career.policyState,
      campaignState: session.career.campaignState,
      tutorialCompleted: session.career.tutorialCompleted
    };
    careerProfiles[session.cityId] = nextProfile;
    await saveStore.saveCareerProfiles(careerProfiles);
    renderTurnSummary(result.summary);
  }
  render();
  scheduleSave();
}

function renderTurnSummary(summary) {
  const contract = summary.contract;
  const contractText = contract?.completed
    ? `Contrato concluído: ${contract.title} · ${formatCurrency(contract.rewardCents)} · +${contract.xpReward} XP`
    : `Contrato pendente: ${contract?.title || "municipal"} · ${contract?.progress || "meta não atingida"}`;
  const weeklyText = summary.weeklyRewards?.length
    ? `<p class="contract-result success">Meta semanal concluída: ${summary.weeklyRewards.map((reward) => `${reward.title} · ${formatCurrency(reward.rewardCents)} · +${reward.rewardXp} XP`).join(" · ")}</p>`
    : "";
  const operatorText = summary.operatorLevel ? `<p class="turn-rank">Carreira: nível ${summary.operatorLevel} · ${summary.operatorTitle}</p>` : "";
  els.turnSummaryContent.innerHTML = `<div class="turn-grade"><b>${summary.grade}</b><div><strong>${summary.score}% de desempenho operacional</strong><p>${summary.onTime}% de pontualidade · ${summary.incidentsOpen} ocorrência${summary.incidentsOpen === 1 ? "" : "s"} em aberto</p><p>Recompensa: ${formatCurrency(summary.rewardCents)} · +${summary.xpReward} XP de desempenho</p><p class="contract-result ${contract?.completed ? "success" : "pending"}">${contractText}</p>${weeklyText}${operatorText}</div></div>`;
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
  renderCampaign();
  renderNetworkOverview();
  renderDispatchFeed();
  renderTutorial();
  renderMap();
}

function renderNetworkOverview() {
  if (!session) return;
  const visibleTrains = getVisibleTrains(session);
  const critical = getStation(session, session.metrics.criticalStationId);
  const incidents = getActiveIncidents(session);
  const trains = getAllTrains(session);
  els.networkOverview.innerHTML = `<div class="network-status-grid">
    <article><span>EM SERVIÇO</span><strong>${visibleTrains.length}</strong><small>${session.metrics.activeLines} corredor${session.metrics.activeLines === 1 ? "" : "es"} ativo${session.metrics.activeLines === 1 ? "" : "s"}</small></article>
    <article><span>PONTUALIDADE</span><strong>${session.metrics.onTime}%</strong><small>${incidents.length ? `${incidents.length} ocorrência${incidents.length === 1 ? "" : "s"} em gestão` : "sem bloqueios ativos"}</small></article>
    <article><span>PRESSÃO</span><strong>${critical.queue}</strong><small>${critical.name} · maior fila</small></article>
  </div>
  <div class="network-table-heading"><div><p class="eyebrow">COMPOSIÇÕES</p><h2>Frota em tempo real</h2></div><span>${session.lineName}</span></div>
  <div class="network-train-list">${trains.map((train) => {
    const occupancy = train.visible ? `${Math.round(train.occupancy / train.capacity * 100)}%` : "Pátio";
    const warning = train.faultActive || ["HELD", "WAITING_SIGNAL", "MAINTENANCE"].includes(train.status);
    const authority = getRouteAuthorizationLabel(train);
    return `<button class="network-train${warning ? " warning" : ""}" data-network-train="${train.id}">
      <span class="service-dot"></span><strong>${train.id}</strong><span>${getTrainLineLabel(train)}</span><span>${getStatusText(train.status)} · ${authority}</span><b>${occupancy}</b>
    </button>`;
  }).join("")}</div>`;
  els.networkOverview.querySelectorAll("[data-network-train]").forEach((button) => {
    button.addEventListener("click", () => {
      selected = { type: "train", id: button.dataset.networkTrain };
      setGameView("central");
      render();
    });
  });
}

function renderDispatchFeed() {
  if (!session?.dispatch) return;
  const messages = session.dispatch.messages.slice(0, 6);
  els.dispatchFeed.innerHTML = messages.map((message) => {
    const route = message.direction === "outgoing" ? "OCC → trem" : message.direction === "incoming" ? "trem → OCC" : "sistema";
    return `<article class="dispatch-message ${message.priority}">
      <div><span>${formatTime(message.at)} · ${route}</span><strong>${message.from} <i>›</i> ${message.to}</strong></div>
      <p>${message.text}</p>
    </article>`;
  }).join("");
}

function renderTutorial() {
  if (!session?.tutorial) return;
  const tutorial = session.tutorial;
  const isIntro = tutorial.status === "intro";
  const isComplete = tutorial.status === "complete";
  const isActivePrompt = tutorial.status === "active" && tutorial.promptOpen;
  const showOverlay = isIntro || isComplete || isActivePrompt;
  els.tutorialOverlay.hidden = !showOverlay;

  if (showOverlay) {
    let title = "Bem-vindo à central";
    let copy = "Eu sou Camila Rocha, supervisora de operações. Vamos construir uma rotina segura em dois passos curtos: ler a rede e preparar uma composição antes do pico.";
    let primary = "Começar orientação";
    if (tutorial.status === "active" && tutorial.step === 1) {
      title = "Primeiro, leia a rede";
      copy = "No painel da estação, use Analisar rede. Uma boa decisão de despacho começa com a leitura de filas, oferta e situação da via.";
      primary = "Mostrar tarefa";
    } else if (tutorial.status === "active" && tutorial.step === 2) {
      title = "Agora, prepare a frota";
      copy = "Selecione o VM-102 destacado na Central e agende a manutenção preventiva. A central valida a disponibilidade da equipe antes de transmitir a ordem.";
      primary = "Mostrar VM-102";
    } else if (isComplete) {
      title = "Certificação operacional concluída";
      copy = "Você leu a rede e abriu a manutenção preventiva no momento certo. A certificação foi registrada: +25 XP.";
      primary = "Continuar operação";
    }
    els.tutorialTitle.textContent = title;
    els.tutorialCopy.textContent = copy;
    els.tutorialPrimary.textContent = primary;
    els.tutorialSkip.hidden = !isIntro;
    const completedSteps = isComplete ? 2 : tutorial.step >= 2 ? 1 : 0;
    els.tutorialOverlay.querySelectorAll(".tutorial-progress i").forEach((step, index) => {
      step.classList.toggle("done", index < completedSteps);
    });
  }

  const showCoach = tutorial.status === "active" && activeGameView === "central";
  els.tutorialCoach.hidden = !showCoach;
  if (showCoach) {
    const task = tutorial.step === 1
      ? "Abra Analisar rede para confirmar a leitura operacional."
      : "Selecione o VM-102 destacado e programe a manutenção preventiva.";
    els.tutorialCoach.innerHTML = `<img src="./assets/camila-rocha-mentor.png" alt=""><div><span>Camila Rocha · supervisão</span><strong>Etapa ${Math.min(tutorial.step, 2)} de 2</strong><p>${task}</p></div><button class="text-button" type="button">Ver orientação</button>`;
  }
}

function renderTrains() {
  els.trainList.innerHTML = getAllTrains(session).map((train) => {
    const selectedClass = selected?.type === "train" && selected.id === train.id ? " selected" : "";
    const tutorialTarget = session.tutorial?.status === "active" && session.tutorial.step === 2 && train.id === "VM-102" ? " tutorial-target" : "";
    const warning = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status) || train.faultActive ? " warning" : "";
    const occupancy = train.visible ? `${Math.round(train.occupancy / train.capacity * 100)}%` : "Pronto";
    return `<button class="train-row${selectedClass}${tutorialTarget}" data-select-train="${train.id}">
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
    const routeStatus = getRouteAuthorizationLabel(train);
    const routePending = train.dispatch.routeStatus === "awaiting-confirmation";
    const routeAuthorized = train.dispatch.routeStatus === "authorized" && train.dispatch.authorizationRemaining > 0;
    const canRequestRoute = train.visible && train.status === "DWELLING" && !routePending && !routeAuthorized;
    const priorityActive = train.dispatch.priorityRemaining > 0;
    els.context.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">TREM SELECIONADO</p><h2>${train.id}</h2></div><span class="status-pill ${train.status === "HELD" || incident ? "warning" : "good"}">${incident ? incidentStatus : getStatusText(train.status)}</span></div>
      <p class="context-copy">O comando é validado pelo motor e seus efeitos aparecem no mapa, na fila e no registro.</p>
      <ul class="key-value">
        <li><span>Próxima estação</span><strong>${next.name}</strong></li>
        <li><span>Ocupação</span><strong>${train.occupancy} / ${train.capacity}</strong></li>
        <li><span>Condição da frota</span><strong>${train.condition}% ${train.condition < 70 ? "· atenção" : ""}</strong></li>
        <li><span>Atraso</span><strong>+${train.delaySec}s</strong></li>
        <li><span>Intervalo</span><strong>${session.metrics.onTime >= 93 ? "regular" : "sob pressão"}</strong></li>
        <li><span>Via</span><strong>${routeStatus}</strong></li>
        ${incident ? `<li><span>Ocorrência</span><strong>${incident.type}</strong></li>` : ""}
      </ul>
      <section class="dispatch-control">
        <div><p class="eyebrow">DESPACHO DO TREM</p><strong>${priorityActive ? "Prioridade de recuperação ativa" : "Canal seguro com condutor"}</strong></div>
        <p>${routePending ? `Aguardando confirmação do condutor · ${train.dispatch.acknowledgementRemaining}s` : routeAuthorized ? `Via confirmada por mais ${train.dispatch.authorizationRemaining}s.` : "Confirme estado, solicite via e só então aplique prioridade."}</p>
        <div class="dispatch-actions">
          <button class="button secondary" data-command="status" data-train="${train.id}" ${train.dispatch.statusCheckRemaining > 0 ? "disabled" : ""}>${train.dispatch.statusCheckRemaining > 0 ? "Consulta enviada" : "Solicitar status"}</button>
          <button class="button primary" data-command="route" data-train="${train.id}" ${canRequestRoute ? "" : "disabled"}>${routePending ? "Aguardando condutor" : routeAuthorized ? "Via autorizada" : "Solicitar via"}</button>
          <button class="button secondary" data-command="priority" data-train="${train.id}" ${routeAuthorized && !priorityActive ? "" : "disabled"}>${priorityActive ? `Prioridade · ${train.dispatch.priorityRemaining}s` : "Dar prioridade"}</button>
        </div>
      </section>
      <div class="action-stack">
        ${incident ? `<button class="button danger" data-command="maintenance" data-incident="${incident.id}" ${incident.status === "responding" ? "disabled" : ""}>${incident.status === "responding" ? "Equipe em resposta" : "Enviar manutenção"}</button>` : ""}
        ${maintenanceRecommended ? `<button class="button primary" data-command="preventive" data-train="${train.id}">Manutenção preventiva · ${formatCurrency(getPreventiveMaintenanceCost(session))}</button>` : ""}
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
        <button class="button secondary" data-command="station-team" data-station="${station.id}" ${session.teamSupport.remaining > 0 ? "disabled" : ""}>${session.teamSupport.remaining > 0 ? `Equipe em campo · ${session.teamSupport.remaining}s` : `Mobilizar equipe · ${formatCurrency(1_200_00)}`}</button>
        <button class="button primary" data-command="reserve">Enviar trem reserva</button>
        <button class="button secondary ${session.tutorial?.status === "active" && session.tutorial.step === 1 ? "tutorial-target" : ""}" data-command="observe">Analisar rede</button>
      </div>`;
  }
  els.context.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const { command, train } = button.dataset;
      if (command === "hold") runCommand({ type: "HOLD_TRAIN", trainId: train });
      if (command === "release") runCommand({ type: "RELEASE_TRAIN", trainId: train });
      if (command === "status") runCommand({ type: "REQUEST_STATUS_UPDATE", trainId: train });
      if (command === "route") runCommand({ type: "REQUEST_ROUTE_AUTHORIZATION", trainId: train });
      if (command === "priority") runCommand({ type: "SET_DISPATCH_PRIORITY", trainId: train });
      if (command === "reserve") runCommand({ type: "DISPATCH_RESERVE" });
      if (command === "observe") runCommand({ type: "OBSERVE_NETWORK" });
      if (command === "maintenance") runCommand({ type: "ASSIGN_MAINTENANCE", incidentId: button.dataset.incident });
      if (command === "preventive") runCommand({ type: "SCHEDULE_PREVENTIVE_MAINTENANCE", trainId: train });
      if (command === "expansion") runCommand({ type: "APPROVE_EXPANSION", projectId: button.dataset.project });
      if (command === "station-team") runCommand({ type: "DEPLOY_STATION_TEAM", stationId: button.dataset.station });
    });
  });
  els.context.querySelector("[data-focus]")?.addEventListener("click", () => {
    selected = { type: "station", id: session.metrics.criticalStationId };
    render();
  });
}

function renderMission() {
  const contract = session.campaign?.contract;
  const missions = [
    [session.missions.contract, `Contrato municipal: ${contract?.title || "em preparação"} · ${getCampaignProgressLabel(contract)}`],
    [session.missions.observe, "Selecione um trem ou analise a rede"],
    [session.missions.hold, "Regule o intervalo com uma retenção"],
    [session.missions.reserve, "Envie o trem reserva para aliviar a demanda"],
    [session.missions.maintenance, "Coordene a resposta a uma falha leve"],
    [session.missions.signal, "Isole uma falha de sinal crítica"],
    [session.missions.passengers, "Direcione passageiros durante uma emergência"],
    [session.missions.expansion, "Entregue uma expansão urbana na estação prioritária"],
    [session.missions.supportLine, "Ative uma segunda linha para ampliar a rede"],
    [session.missions.preventiveMaintenance, "Programe manutenção preventiva da frota"],
    [session.missions.peakService, "Aplique uma política de reforço no pico"],
    [session.missions.stationTeam, "Mobilize uma equipe de estação"],
    [session.missions.routeAuthorization, "Conclua uma autorização de via confirmada pelo condutor"],
    [session.missions.dispatchPriority, "Aplique prioridade depois da liberação de via"],
    [session.missions.contract, "Conclua um contrato municipal"]
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

function renderCampaign() {
  const campaign = session.campaign;
  if (!campaign) return;
  const station = getStation(session, campaign.stationId);
  const contract = campaign.contract;
  const teamActive = session.teamSupport.remaining > 0;
  const goal = getCampaignGoalLabel(contract);
  const career = session.career;
  if (!career) {
    els.campaignContent.innerHTML = `<article class="campaign-item"><strong>Modo sandbox</strong><p>Contratos e cenários podem ser testados livremente. Inicie uma carreira para liberar níveis, especializações e metas semanais.</p></article>`;
    return;
  }
  const rank = getCareerRank(career.totalXp);
  const specialization = specializationCatalog.find((item) => item.id === career.operator.specialization);
  const xpUntilNext = rank.next ? Math.max(0, rank.next.minXp - career.totalXp) : 0;
  const progressPercent = Math.round(rank.progress * 100);
  const weeklyGoals = career.weekly.goals.map((item) => `<li class="weekly-goal ${item.completed ? "done" : ""}">
    <div><strong>${item.title}</strong><span>${item.description}</span></div>
    <b>${item.progress}/${item.target}</b>
    <small>${item.completed ? `Recompensa liberada · ${item.badge}` : `${formatCurrency(item.rewardCents)} · +${item.rewardXp} XP`}</small>
  </li>`).join("");
  const specializationSection = specialization
    ? `<section class="specialization-active"><span>ESPECIALIZAÇÃO ATIVA</span><strong>${specialization.title}</strong><p>${specialization.perk}</p></section>`
    : rank.level >= 2
      ? `<section class="specialization-choice"><div><span>ESCOLHA DE CARREIRA</span><strong>Defina seu foco operacional</strong><p>A escolha vale para esta carreira e libera uma vantagem permanente.</p></div><div class="specialization-options">${specializationCatalog.map((item) => `<button class="specialization-option" data-career-command="specialization" data-specialization="${item.id}"><strong>${item.shortTitle}</strong><span>${item.perk}</span></button>`).join("")}</div></section>`
      : `<section class="specialization-locked"><span>PRÓXIMO DESBLOQUEIO</span><strong>Especialização no nível 2</strong><p>Faltam ${xpUntilNext} XP de carreira para escolher entre Despacho, Frota ou Estações.</p></section>`;
  const badges = career.operator.badges.length
    ? `<p class="career-badges"><span>DISTINTIVOS</span>${career.operator.badges.map((badge) => `<b>${badge}</b>`).join("")}</p>`
    : "";
  els.campaignContent.innerHTML = `<section class="career-progress-card">
      <div class="career-rank"><span>NÍVEL ${rank.level}</span><strong>${rank.title}</strong><small>${career.totalXp} XP total${rank.next ? ` · ${xpUntilNext} XP para ${rank.next.title}` : " · nível máximo"}</small></div>
      <div class="rank-progress" role="progressbar" aria-label="Progresso do nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}"><i style="width:${progressPercent}%"></i></div>
      ${badges}
    </section>
    ${specializationSection}
    <section class="weekly-card"><div><span>METAS DA SEMANA ${career.weekly.week}</span><strong>Rotina de operador</strong></div><ul>${weeklyGoals}</ul></section>
    <article class="campaign-item">
    <strong>${campaign.title}</strong>
    <p>Pressão especial em ${station?.name || "estação prioritária"} · demanda ${Math.round((campaign.demandMultiplier - 1) * 100)}% acima da base.</p>
    <div class="contract-item ${contract.status === "completed" ? "active" : ""}"><span>CONTRATO</span><strong>${contract.title}</strong><p>${goal}</p><p class="contract-progress">${getCampaignProgressLabel(contract)}</p><small>Prêmio: ${formatCurrency(contract.rewardCents)} · +${contract.xpReward} XP</small></div>
    <button class="text-button campaign-action" data-campaign-command="station-team" data-station-id="${station?.id || session.metrics.criticalStationId}" ${teamActive ? "disabled" : ""}>${teamActive ? `Equipe em campo · ${session.teamSupport.remaining}s` : `Mobilizar equipe · ${formatCurrency(1_200_00)}`}</button>
  </article>`;
}

function getCampaignGoalLabel(contract) {
  if (contract.goalType === "on_time") return `Meta: ${contract.targetValue}% de pontualidade`;
  if (contract.goalType === "support_line") return "Meta: ativar a linha complementar";
  if (contract.goalType === "green_energy") return "Meta: aprovar energia eficiente";
  if (contract.goalType === "social_fare") return "Meta: ativar tarifa social";
  if (contract.goalType === "station_team") return "Meta: mobilizar equipe no território";
  return contract.description;
}

function getCampaignProgressLabel(contract) {
  if (!contract) return "Aguardando contrato";
  if (contract.goalType === "on_time") return `Agora: ${session.metrics.onTime}% / meta ${contract.targetValue}%`;
  if (contract.goalType === "support_line") return session.network.supportLineStatus === "operating" ? "Linha complementar em operação" : "Aguardando despacho da linha complementar";
  if (contract.goalType === "green_energy") return session.policies.greenEnergy ? "Programa já aprovado" : "Aguardando aprovação no conselho";
  if (contract.goalType === "social_fare") return session.policies.farePlan === "social" ? "Tarifa social em vigor" : "Aguardando aprovação no conselho";
  if (contract.goalType === "station_team") return session.missions.stationTeam ? "Equipe mobilizada: meta alcançada" : "Aguardando mobilização da equipe";
  return contract.progress || contract.description;
}

function getTrainLineLabel(train) {
  if (train.line === "SUPORTE") return session.supportLineName;
  if (train.line === "RESERVA") return "Reserva";
  return session.lineName;
}

function getRouteAuthorizationLabel(train) {
  const dispatch = train.dispatch;
  if (!dispatch || dispatch.routeStatus === "not-requested") return "sem solicitação";
  if (dispatch.routeStatus === "awaiting-confirmation") return "aguardando condutor";
  if (dispatch.routeStatus === "authorized") return `autorizada · ${dispatch.authorizationRemaining}s`;
  if (dispatch.routeStatus === "consumed") return "confirmada";
  if (dispatch.routeStatus === "denied") return "negada";
  if (dispatch.routeStatus === "expired") return "expirada";
  return "sem solicitação";
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
  drawNetworkNodes(width, height);
  drawStations(width, height);
  drawTrains(width, height);
}

function drawGrid(width, height) {
  const gradient = canvasContext.createRadialGradient(width * 0.48, height * 0.44, 20, width * 0.48, height * 0.44, width * 0.8);
  gradient.addColorStop(0, "#0a3453");
  gradient.addColorStop(1, "#041221");
  canvasContext.fillStyle = gradient;
  canvasContext.fillRect(0, 0, width, height);
  canvasContext.save();
  canvasContext.fillStyle = "rgba(22, 119, 153, 0.18)";
  canvasContext.beginPath();
  canvasContext.moveTo(width * 0.74, 0);
  canvasContext.bezierCurveTo(width * 0.66, height * 0.22, width * 0.92, height * 0.46, width, height * 0.54);
  canvasContext.lineTo(width, height);
  canvasContext.lineTo(width * 0.82, height);
  canvasContext.bezierCurveTo(width * 0.7, height * 0.78, width * 0.88, height * 0.54, width * 0.74, 0);
  canvasContext.fill();
  canvasContext.restore();
  canvasContext.strokeStyle = "rgba(98, 196, 240, 0.08)";
  canvasContext.lineWidth = 1;
  for (let x = 0; x < width; x += 32) { canvasContext.beginPath(); canvasContext.moveTo(x, 0); canvasContext.lineTo(x, height); canvasContext.stroke(); }
  for (let y = 0; y < height; y += 32) { canvasContext.beginPath(); canvasContext.moveTo(0, y); canvasContext.lineTo(width, y); canvasContext.stroke(); }
}

function mapPoint(node, width, height) {
  return { x: node.x * width, y: node.y * height };
}

function drawTrack(width, height) {
  const layout = getMetroLayout();
  layout.routes.filter((line) => line.id !== "main" && line.id !== "support").forEach((line) => {
    drawRoute(line.stops.map((id) => layout.nodes[id]), "rgba(4, 24, 41, 0.82)", line.color, 10, 2.5, width, height, true);
  });
  drawRoute(session.stations, "rgba(7, 52, 84, 0.98)", "rgba(25, 179, 255, 0.98)", 19, 5.5, width, height);
  const supportStations = session.supportTrain.route.map((id) => getStation(session, id));
  drawRoute(supportStations, "rgba(53, 17, 86, 0.72)", session.supportTrain?.visible ? "rgba(208, 119, 255, 0.98)" : "rgba(145, 83, 181, 0.58)", 13, session.supportTrain?.visible ? 3.8 : 2, width, height, !session.supportTrain?.visible);
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

function getMetroLayout() {
  const activeNodes = Object.fromEntries(session.stations.map((station) => [station.id, station]));
  const additions = {
    "vale-central": {
      oeste: { name: "Jardins", x: 0.08, y: 0.28 }, universidade: { name: "Universidade", x: 0.33, y: 0.17 },
      museu: { name: "Museu", x: 0.53, y: 0.15 }, leste: { name: "Praia Leste", x: 0.86, y: 0.20 },
      sul: { name: "Mercado", x: 0.31, y: 0.82 }, aeroporto: { name: "Aeroporto", x: 0.76, y: 0.78 }, anel: { name: "Parque", x: 0.62, y: 0.72 }
    },
    "porto-dourado": {
      oeste: { name: "Farol", x: 0.09, y: 0.22 }, universidade: { name: "Arsenal", x: 0.38, y: 0.18 },
      museu: { name: "Alfândega", x: 0.56, y: 0.16 }, leste: { name: "Baía Norte", x: 0.87, y: 0.17 },
      sul: { name: "Marina Sul", x: 0.28, y: 0.84 }, aeroporto: { name: "Aeroporto", x: 0.79, y: 0.79 }, anel: { name: "Ilha Cívica", x: 0.67, y: 0.72 }
    },
    "serra-clara": {
      oeste: { name: "Jardim Alto", x: 0.09, y: 0.20 }, universidade: { name: "Campus", x: 0.37, y: 0.16 },
      museu: { name: "Mirante", x: 0.55, y: 0.14 }, leste: { name: "Colinas", x: 0.87, y: 0.17 },
      sul: { name: "Terminal Sul", x: 0.31, y: 0.84 }, aeroporto: { name: "Estação Aérea", x: 0.79, y: 0.82 }, anel: { name: "Lago", x: 0.67, y: 0.73 }
    }
  }[session.cityId] || {};
  return {
    nodes: { ...activeNodes, ...additions },
    routes: [
      { id: "main", color: "#18b5ff", stops: ["depot", "norte", "central", "riverside", "porto"] },
      { id: "support", color: "#d077ff", stops: ["norte", "central", "porto"] },
      { id: "civic", color: "#ffbf45", stops: ["oeste", "norte", "universidade", "central", "anel", "riverside", "leste"] },
      { id: "orbital", color: "#50e39a", stops: ["sul", "central", "museu", "riverside", "aeroporto"] },
      { id: "airport", color: "#ff6478", stops: ["depot", "sul", "anel", "porto", "aeroporto"] }
    ]
  };
}

function drawRoute(stations, underlay, color, underlayWidth, lineWidth, width, height, dashed = false) {
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
  if (dashed) canvasContext.setLineDash([7, 8]);
  canvasContext.shadowBlur = 16;
  canvasContext.shadowColor = color;
  canvasContext.stroke();
  canvasContext.restore();
}

function drawNetworkNodes(width, height) {
  const layout = getMetroLayout();
  const activeStationIds = new Set(session.stations.map((station) => station.id));
  Object.entries(layout.nodes).forEach(([id, node]) => {
    if (activeStationIds.has(id)) return;
    const point = mapPoint(node, width, height);
    canvasContext.save();
    canvasContext.fillStyle = "#0c314d";
    canvasContext.strokeStyle = "rgba(216, 242, 255, 0.72)";
    canvasContext.lineWidth = 1.2;
    canvasContext.beginPath();
    canvasContext.arc(point.x, point.y, 5.2, 0, Math.PI * 2);
    canvasContext.fill();
    canvasContext.stroke();
    canvasContext.fillStyle = "rgba(203, 231, 247, 0.84)";
    canvasContext.font = "600 9px Inter, system-ui, sans-serif";
    canvasContext.fillText(node.name, point.x + 8, point.y - 7);
    canvasContext.restore();
  });
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
    const nextStation = getStation(session, getTrainTarget(train));
    const direction = Math.atan2(nextStation.y - position.y, nextStation.x - position.x);
    const isSelected = selected?.type === "train" && selected.id === train.id;
    const paused = ["HELD", "WAITING_SIGNAL", "DISPATCHING"].includes(train.status) || train.faultActive;
    canvasContext.save();
    canvasContext.translate(point.x, point.y);
    canvasContext.rotate(direction);
    canvasContext.shadowBlur = isSelected ? 22 : 12;
    canvasContext.shadowColor = train.faultActive ? "#ff596b" : paused ? "#ffbf45" : "#1bd4ff";
    canvasContext.fillStyle = train.faultActive ? "#ff8797" : paused ? "#f5be48" : "#daf5ff";
    canvasContext.beginPath();
    canvasContext.roundRect(-11, -5.5, 22, 11, 4);
    canvasContext.fill();
    canvasContext.fillStyle = "#0c6ba7";
    canvasContext.beginPath();
    canvasContext.roundRect(1, -3.5, 7, 7, 2);
    canvasContext.fill();
    canvasContext.fillStyle = "#48dcff";
    canvasContext.fillRect(7, -2.4, 2.5, 4.8);
    canvasContext.fillStyle = "rgba(3, 28, 52, 0.78)";
    canvasContext.fillRect(-7, -3.5, 5.5, 7);
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

function loadAccessibilityPreferences() {
  const defaults = { highContrast: false, reducedMotion: false, largeText: false, audio: false };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(accessibilityStorageKey) || "{}") };
  } catch {
    return defaults;
  }
}

function saveAccessibilityPreferences() {
  try { localStorage.setItem(accessibilityStorageKey, JSON.stringify(accessibility)); } catch { /* Preferências são opcionais. */ }
}

function applyAccessibilityPreferences() {
  const root = document.documentElement;
  root.classList.toggle("high-contrast", accessibility.highContrast);
  root.classList.toggle("reduced-motion", accessibility.reducedMotion);
  root.classList.toggle("large-text", accessibility.largeText);
  document.querySelectorAll("[data-accessibility-setting]").forEach((button) => {
    const enabled = Boolean(accessibility[button.dataset.accessibilitySetting]);
    button.setAttribute("aria-pressed", String(enabled));
    button.classList.toggle("active", enabled);
  });
}

function setAccessibilityPanel(open) {
  els.accessibilityPanel.hidden = !open;
  els.accessibilityToggle.setAttribute("aria-expanded", String(open));
  if (open) els.accessibilityPanel.querySelector("[data-accessibility-setting]")?.focus();
  else els.accessibilityToggle.focus();
}

function playOperationalCue(kind) {
  if (!accessibility.audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const frequency = kind === "warning" ? 220 : kind === "enabled" ? 660 : 520;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === "warning" ? 0.75 : 1.25), now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.16);
  } catch { /* Navegadores podem bloquear áudio até uma interação válida. */ }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}), { once: true });
}

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
