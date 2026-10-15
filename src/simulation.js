const route = ["depot", "norte", "central", "riverside", "porto"];
const supportRoute = ["norte", "central", "porto"];

export const cityProfiles = [
  {
    id: "vale-central",
    name: "Vale Central",
    lineName: "Linha Vale",
    supportLineName: "Linha Horizonte",
    corridor: "Vale Norte — Porto Azul",
    description: "Rede equilibrada, indicada para construir a primeira carreira.",
    difficulty: "Operação moderada",
    startingBalanceCents: 128_400_00,
    demandMultiplier: 1,
    capacityMultiplier: 1,
    queueMultiplier: 1,
    stationNames: ["Pátio Vale", "Vale Norte", "Central", "Riverside", "Porto Azul"],
    mapPositions: {
      depot: { x: 0.08, y: 0.76 }, norte: { x: 0.23, y: 0.52 }, central: { x: 0.43, y: 0.49 },
      riverside: { x: 0.62, y: 0.27 }, porto: { x: 0.88, y: 0.46 }
    },
    campaign: [
      { id: "vale-civica", title: "Cúpula cívica", stationId: "central", demandMultiplier: 1.12, contract: { title: "Pontualidade cívica", description: "Mantenha a rede acima de 87% de pontualidade.", goalType: "on_time", targetValue: 87, rewardCents: 8_500_00, xpReward: 24 } },
      { id: "vale-conexao", title: "Conexão de bairros", stationId: "riverside", demandMultiplier: 1.2, contract: { title: "Conexão Horizonte", description: "Coloque a Linha Horizonte em operação neste turno.", goalType: "support_line", rewardCents: 11_000_00, xpReward: 30 } },
      { id: "vale-verde", title: "Pacto de mobilidade verde", stationId: "norte", demandMultiplier: 1.08, contract: { title: "Matriz eficiente", description: "Aprove o programa de energia eficiente.", goalType: "green_energy", rewardCents: 12_000_00, xpReward: 32 } }
    ]
  },
  {
    id: "porto-dourado",
    name: "Porto Dourado",
    lineName: "Linha da Marina",
    supportLineName: "Linha Costeira",
    corridor: "Estaleiro — Terminal Oceano",
    description: "Cidade portuária de alto fluxo: mais receita, pressão maior nos picos.",
    difficulty: "Demanda intensa",
    startingBalanceCents: 154_000_00,
    demandMultiplier: 1.18,
    capacityMultiplier: 0.94,
    queueMultiplier: 1.16,
    stationNames: ["Pátio Marina", "Estaleiro", "Mercado Velho", "Distrito do Porto", "Terminal Oceano"],
    mapPositions: {
      depot: { x: 0.08, y: 0.72 }, norte: { x: 0.25, y: 0.38 }, central: { x: 0.47, y: 0.54 },
      riverside: { x: 0.67, y: 0.29 }, porto: { x: 0.90, y: 0.42 }
    },
    campaign: [
      { id: "porto-janela", title: "Janela portuária", stationId: "riverside", demandMultiplier: 1.22, contract: { title: "Operação de atracação", description: "Sustente ao menos 84% de pontualidade sob alta demanda.", goalType: "on_time", targetValue: 84, rewardCents: 10_500_00, xpReward: 28 } },
      { id: "porto-acesso", title: "Acordo de acesso", stationId: "central", demandMultiplier: 1.14, contract: { title: "Tarifa de conexão", description: "Ative a tarifa social para os trabalhadores do porto.", goalType: "social_fare", rewardCents: 9_000_00, xpReward: 25 } },
      { id: "porto-costeira", title: "Corredor costeiro", stationId: "porto", demandMultiplier: 1.25, contract: { title: "Linha Costeira", description: "Coloque a Linha Costeira em operação neste turno.", goalType: "support_line", rewardCents: 12_500_00, xpReward: 32 } }
    ]
  },
  {
    id: "serra-clara",
    name: "Serra Clara",
    lineName: "Linha das Serras",
    supportLineName: "Linha das Colinas",
    corridor: "Parque Alto — Vale do Sol",
    description: "Corredor residencial com orçamento menor e necessidade de regularidade.",
    difficulty: "Orçamento restrito",
    startingBalanceCents: 102_000_00,
    demandMultiplier: 0.86,
    capacityMultiplier: 1.08,
    queueMultiplier: 0.82,
    stationNames: ["Pátio da Serra", "Parque Alto", "Centro Cívico", "Hospital Regional", "Vale do Sol"],
    mapPositions: {
      depot: { x: 0.08, y: 0.78 }, norte: { x: 0.24, y: 0.34 }, central: { x: 0.48, y: 0.52 },
      riverside: { x: 0.66, y: 0.25 }, porto: { x: 0.91, y: 0.58 }
    },
    campaign: [
      { id: "serra-hospital", title: "Plantão hospitalar", stationId: "riverside", demandMultiplier: 1.16, contract: { title: "Prioridade clínica", description: "Sustente ao menos 86% de pontualidade no acesso ao hospital.", goalType: "on_time", targetValue: 86, rewardCents: 8_000_00, xpReward: 24 } },
      { id: "serra-equipe", title: "Feira das colinas", stationId: "central", demandMultiplier: 1.2, contract: { title: "Apoio de estação", description: "Mobilize uma equipe de estação no ponto de maior demanda.", goalType: "station_team", rewardCents: 7_500_00, xpReward: 23 } },
      { id: "serra-verde", title: "Vale sustentável", stationId: "porto", demandMultiplier: 1.1, contract: { title: "Energia das Serras", description: "Aprove o programa de energia eficiente.", goalType: "green_energy", rewardCents: 11_000_00, xpReward: 30 } }
    ]
  }
];

export const stationBlueprint = [
  { id: "depot", name: "Pátio Vale", x: 0.10, y: 0.70, capacity: 75, demand: 0.18, queue: 8 },
  { id: "norte", name: "Vale Norte", x: 0.28, y: 0.30, capacity: 115, demand: 0.58, queue: 32 },
  { id: "central", name: "Central", x: 0.49, y: 0.59, capacity: 150, demand: 1.06, queue: 94 },
  { id: "riverside", name: "Riverside", x: 0.71, y: 0.34, capacity: 135, demand: 1.54, queue: 126 },
  { id: "porto", name: "Porto Azul", x: 0.90, y: 0.61, capacity: 105, demand: 0.72, queue: 46 }
];

const trainBlueprint = [
  { id: "VM-101", segmentIndex: 0, progress: 0.26, status: "EN_ROUTE", occupancy: 72, delaySec: 0, condition: 94 },
  { id: "VM-102", segmentIndex: 1, progress: 0.43, status: "EN_ROUTE", occupancy: 108, delaySec: 16, condition: 78 },
  { id: "VM-103", segmentIndex: 2, progress: 0, status: "DWELLING", occupancy: 133, delaySec: 0, dwellRemaining: 11, condition: 88 },
  { id: "VM-104", segmentIndex: 3, progress: 0.52, status: "EN_ROUTE", occupancy: 64, delaySec: 8, condition: 91 }
];

const supportTrainBlueprint = {
  id: "VM-201",
  segmentIndex: 0,
  progress: 0,
  status: "DEPOT_READY",
  occupancy: 0,
  delaySec: 0,
  condition: 86
};

const statusText = {
  DEPOT_READY: "No pátio",
  DISPATCHING: "Em despacho",
  MAINTENANCE: "Em manutenção",
  EN_ROUTE: "Em rota",
  DWELLING: "Em plataforma",
  HELD: "Retido",
  WAITING_SIGNAL: "Aguardando via"
};

function createTrainDispatchState() {
  return {
    routeStatus: "not-requested",
    routeSegment: null,
    acknowledgementRemaining: 0,
    authorizationRemaining: 0,
    statusCheckRemaining: 0,
    priority: "normal",
    priorityRemaining: 0
  };
}

function createDispatchBoard() {
  return { nextId: 1, messages: [] };
}

export function createInitialSession(mode = "career", cityId = "vale-central", careerProfile = null) {
  const city = getCityProfile(cityId);
  const balanceCents = mode === "sandbox" ? 999_999_00 : careerProfile?.balanceCents ?? city.startingBalanceCents;
  const stations = createCityStations(city);
  const projects = { riversideExpansion: createRiversideExpansionProject(city.stationNames[3]) };
  const completedProjectIds = careerProfile?.completedProjectIds ?? [];
  const policyState = careerProfile?.policyState ?? {};
  const campaign = createCampaign(city, careerProfile?.campaignState);
  if (mode === "career" && completedProjectIds.includes(projects.riversideExpansion.id)) {
    projects.riversideExpansion.status = "complete";
    const station = stations.find((item) => item.id === projects.riversideExpansion.stationId);
    if (station) station.capacity += projects.riversideExpansion.capacityGain;
  }
  const session = {
    schemaVersion: 10,
    mode,
    time: 6 * 3600,
    timeScale: 1,
    city: city.name,
    cityId: city.id,
    lineName: city.lineName,
    supportLineName: city.supportLineName,
    corridor: city.corridor,
    balanceCents,
    revenueCents: 0,
    operatingCostCents: 0,
    reputation: careerProfile?.reputation ?? 76,
    xp: 0,
    stations,
    trains: trainBlueprint.map((train) => ({
      ...train,
      route: [...route],
      capacity: 180,
      delaySec: train.delaySec + (city.id === "porto-dourado" ? 4 : city.id === "serra-clara" ? 1 : 0),
      holdRequested: false,
      line: "PRINCIPAL",
      maintenanceRemaining: 0,
      dispatch: createTrainDispatchState(),
      visible: true
    })),
    supportTrain: {
      ...supportTrainBlueprint,
      route: [...supportRoute],
      capacity: 160,
      line: "SUPORTE",
      dispatchRemaining: 0,
      maintenanceRemaining: 0,
      dispatch: createTrainDispatchState(),
      holdRequested: false,
      visible: false
    },
    reserve: {
      id: "VM-R01",
      route: [...route],
      segmentIndex: 0,
      progress: 0,
      status: "DEPOT_READY",
      occupancy: 0,
      capacity: 180,
      delaySec: 0,
      condition: 93,
      line: "RESERVA",
      dispatchRemaining: 0,
      maintenanceRemaining: 0,
      dispatch: createTrainDispatchState(),
      visible: false,
      holdRequested: false
    },
    missions: {
      observe: false, hold: false, reserve: false, maintenance: false, signal: false, passengers: false, expansion: false,
      supportLine: false, preventiveMaintenance: false, greenEnergy: false, socialFare: false, peakService: false,
      stationTeam: false, contract: false, routeAuthorization: false, dispatchPriority: false
    },
    tutorial: careerProfile?.tutorialCompleted
      ? { status: "acknowledged", step: 3, rewardGranted: true }
      : { status: "intro", step: 0, rewardGranted: false },
    incidents: [],
    incidentHistory: [],
    staff: { maintenanceAvailable: 1, signalAvailable: 1, passengerGuides: 2, stationTeams: 2 },
    scenario: {
      doorFaultAt: 6 * 3600 + 180,
      doorFaultTriggered: false,
      signalFaultAt: 6 * 3600 + 360,
      signalFaultTriggered: false
    },
    network: { blockedSegments: [], supportLineStatus: "available" },
    policies: {
      farePlan: policyState.farePlan ?? "balanced",
      greenEnergy: policyState.greenEnergy ?? false,
      peakBoostRemaining: 0,
      peakServiceDeployed: false
    },
    passengerTransfers: 0,
    teamSupport: { stationId: null, remaining: 0 },
    dispatch: createDispatchBoard(),
    campaign,
    projects,
    career: mode === "career" ? {
      cityId: city.id,
      day: careerProfile?.day ?? 1,
      totalXp: careerProfile?.totalXp ?? 0,
      completedTurns: careerProfile?.completedTurns ?? 0,
      completedProjectIds,
      policyState,
      campaignState: careerProfile?.campaignState ?? { chapterIndex: 0, completedContracts: [] },
      tutorialCompleted: careerProfile?.tutorialCompleted ?? false,
      balanceCents
    } : null,
    turn: {
      status: "active",
      startedAt: 6 * 3600,
      minimumDuration: 300,
      summary: null
    },
    log: [],
    commandIds: [],
    metrics: { totalQueue: 0, criticalStationId: "riverside", onTime: 100, activeTrains: 4, activeLines: 1 }
  };
  pushLog(session, `${mode === "career" ? `Dia ${session.career.day} da carreira em ${city.name}` : "Sandbox"}: rede em operação às 06:00.`, "info");
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: "REDE",
    priority: "normal",
    direction: "system",
    text: "Turno iniciado. Todas as composições reportam prontidão operacional."
  });
  recalculate(session);
  return normalizeSession(session);
}

export function normalizeSession(session) {
  const city = getCityProfile(session.cityId || "vale-central");
  session.schemaVersion = 10;
  session.cityId ??= city.id;
  session.city ??= city.name;
  session.lineName ??= city.lineName;
  session.supportLineName ??= city.supportLineName;
  session.corridor ??= city.corridor;
  session.stations?.forEach((station) => {
    const position = city.mapPositions?.[station.id];
    if (position) Object.assign(station, position);
  });
  session.missions = {
    observe: false, hold: false, reserve: false, maintenance: false, signal: false, passengers: false, expansion: false,
    supportLine: false, preventiveMaintenance: false, greenEnergy: false, socialFare: false, peakService: false,
    stationTeam: false, contract: false, routeAuthorization: false, dispatchPriority: false,
    ...session.missions
  };
  session.incidents ??= [];
  session.incidentHistory ??= [];
  session.staff = { maintenanceAvailable: 1, signalAvailable: 1, passengerGuides: 2, stationTeams: 2, ...session.staff };
  session.scenario = {
    doorFaultAt: 6 * 3600 + 180,
    doorFaultTriggered: false,
    signalFaultAt: 6 * 3600 + 360,
    signalFaultTriggered: false,
    ...session.scenario
  };
  session.network = { blockedSegments: [], supportLineStatus: "available", ...session.network };
  session.policies = { farePlan: "balanced", greenEnergy: false, peakBoostRemaining: 0, peakServiceDeployed: false, ...session.policies };
  session.passengerTransfers ??= 0;
  session.teamSupport = { stationId: null, remaining: 0, ...session.teamSupport };
  session.dispatch = { ...createDispatchBoard(), ...session.dispatch };
  session.dispatch.messages ??= [];
  session.dispatch.nextId ??= 1;
  const expansionStationName = session.stations?.find((station) => station.id === "riverside")?.name || "Riverside";
  session.projects = { riversideExpansion: createRiversideExpansionProject(expansionStationName), ...session.projects };
  session.projects.riversideExpansion = { ...createRiversideExpansionProject(expansionStationName), ...session.projects.riversideExpansion };
  if (session.mode === "career") {
    session.career = {
      cityId: session.cityId,
      day: 1,
      totalXp: 0,
      completedTurns: 0,
      completedProjectIds: [],
      policyState: {},
      campaignState: { chapterIndex: 0, completedContracts: [] },
      tutorialCompleted: false,
      balanceCents: session.balanceCents,
      ...session.career
    };
  }
  session.tutorial = {
    status: session.career?.tutorialCompleted ? "acknowledged" : "intro",
    step: 0,
    rewardGranted: false,
    ...session.tutorial
  };
  const campaignState = session.career?.campaignState ?? { chapterIndex: 0, completedContracts: [] };
  session.campaign = normalizeCampaign(session.campaign, city, campaignState);
  session.turn = { status: "active", startedAt: 6 * 3600, minimumDuration: 300, summary: null, ...session.turn };
  session.commandIds ??= [];
  session.supportTrain ??= {
    ...supportTrainBlueprint,
    route: [...supportRoute],
    capacity: 160,
    line: "SUPORTE",
    dispatchRemaining: 0,
    maintenanceRemaining: 0,
    dispatch: createTrainDispatchState(),
    holdRequested: false,
    visible: false
  };
  getAllTrains(session).forEach((train) => {
    train.faultActive ??= false;
    train.condition ??= 88;
    train.maintenanceRemaining ??= 0;
    train.line ??= train.id === "VM-201" ? "SUPORTE" : train.id === "VM-R01" ? "RESERVA" : "PRINCIPAL";
    train.dispatch = { ...createTrainDispatchState(), ...train.dispatch };
  });
  if (session.dispatch.messages.length === 0) {
    pushDispatchMessage(session, {
      from: "OCC-01",
      to: "REDE",
      priority: "normal",
      direction: "system",
      text: "Canal de despacho sincronizado com a sessão atual."
    });
  }
  const activeLineCount = new Set(getVisibleTrains(session)
    .filter((train) => train.line !== "RESERVA")
    .map((train) => train.line)).size || 1;
  session.metrics = {
    totalQueue: 0,
    criticalStationId: "riverside",
    onTime: 100,
    activeTrains: 4,
    activeLines: activeLineCount,
    ...session.metrics
  };
  session.metrics.activeLines ??= activeLineCount;
  return session;
}

function getCityProfile(cityId) {
  return cityProfiles.find((city) => city.id === cityId) || cityProfiles[0];
}

function createCityStations(city) {
  return stationBlueprint.map((station, index) => ({
    ...station,
    ...city.mapPositions?.[station.id],
    name: city.stationNames[index],
    capacity: Math.round(station.capacity * city.capacityMultiplier),
    demand: Number((station.demand * city.demandMultiplier).toFixed(2)),
    queue: Math.round(station.queue * city.queueMultiplier),
    arrivals: 0,
    departures: 0
  }));
}

function getCampaignChapter(city, chapterIndex = 0) {
  const chapters = city.campaign || [];
  return chapters[chapterIndex % Math.max(chapters.length, 1)] || {
    id: "standard-service",
    title: "Serviço metropolitano",
    stationId: "central",
    demandMultiplier: 1,
    contract: { title: "Serviço regular", description: "Mantenha a operação em movimento.", goalType: "on_time", targetValue: 80, rewardCents: 5_000_00, xpReward: 12 }
  };
}

function createCampaign(city, campaignState = {}) {
  const chapterIndex = campaignState?.chapterIndex ?? 0;
  const chapter = getCampaignChapter(city, chapterIndex);
  return {
    chapterIndex,
    scenarioId: chapter.id,
    title: chapter.title,
    stationId: chapter.stationId,
    demandMultiplier: chapter.demandMultiplier,
    contract: { ...chapter.contract, status: "active", progress: 0 }
  };
}

function normalizeCampaign(campaign, city, campaignState) {
  const fallback = createCampaign(city, campaignState);
  if (!campaign) return fallback;
  const chapter = getCampaignChapter(city, campaign.chapterIndex ?? campaignState?.chapterIndex ?? 0);
  return {
    ...fallback,
    ...campaign,
    title: campaign.title ?? chapter.title,
    stationId: campaign.stationId ?? chapter.stationId,
    demandMultiplier: campaign.demandMultiplier ?? chapter.demandMultiplier,
    contract: { ...fallback.contract, ...campaign.contract }
  };
}

function createRiversideExpansionProject(stationName = "Riverside") {
  return {
    id: "riverside-expansion",
    title: `Expansão de plataformas de ${stationName}`,
    stationId: "riverside",
    status: "available",
    costCents: 12_000_00,
    constructionRemaining: 0,
    capacityGain: 95
  };
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function getStation(session, id) {
  return session.stations.find((station) => station.id === id);
}

export function getAllTrains(session) {
  return [...session.trains, session.supportTrain, session.reserve].filter(Boolean);
}

export function getVisibleTrains(session) {
  return getAllTrains(session).filter((train) => train.visible);
}

export function getActiveIncidents(session) {
  return session.incidents.filter((incident) => incident.status !== "resolved");
}

export function getTrainTarget(train) {
  return train.route[(train.segmentIndex + 1) % train.route.length];
}

export function getTrainOrigin(train) {
  return train.route[train.segmentIndex % train.route.length];
}

export function getStatusText(status) {
  return statusText[status] || status;
}

export function getTrainPosition(session, train) {
  const origin = getStation(session, getTrainOrigin(train));
  const target = getStation(session, getTrainTarget(train));
  const progress = train.status === "EN_ROUTE" ? train.progress : 0;
  return {
    x: origin.x + (target.x - origin.x) * progress,
    y: origin.y + (target.y - origin.y) * progress
  };
}

export function applyCommand(session, command) {
  normalizeSession(session);
  if (command.id && session.commandIds.includes(command.id)) {
    return reject("Essa ordem já foi processada.");
  }
  let result;
  switch (command.type) {
    case "HOLD_TRAIN":
      result = requestHold(session, command.trainId);
      break;
    case "RELEASE_TRAIN":
      result = releaseTrain(session, command.trainId);
      break;
    case "REQUEST_STATUS_UPDATE":
      result = requestStatusUpdate(session, command.trainId);
      break;
    case "REQUEST_ROUTE_AUTHORIZATION":
      result = requestRouteAuthorization(session, command.trainId);
      break;
    case "SET_DISPATCH_PRIORITY":
      result = setDispatchPriority(session, command.trainId);
      break;
    case "DISPATCH_RESERVE":
      result = dispatchReserve(session);
      break;
    case "ACTIVATE_SUPPORT_LINE":
      result = activateSupportLine(session);
      break;
    case "SCHEDULE_PREVENTIVE_MAINTENANCE":
      result = schedulePreventiveMaintenance(session, command.trainId);
      break;
    case "ASSIGN_MAINTENANCE":
      result = assignMaintenance(session, command.incidentId);
      break;
    case "ISOLATE_SIGNAL":
      result = isolateSignal(session, command.incidentId);
      break;
    case "DIRECT_PASSENGERS":
      result = directPassengers(session, command.incidentId);
      break;
    case "DEPLOY_STATION_TEAM":
      result = deployStationTeam(session, command.stationId);
      break;
    case "APPROVE_EXPANSION":
      result = approveExpansion(session, command.projectId);
      break;
    case "ACTIVATE_GREEN_ENERGY":
      result = activateGreenEnergy(session);
      break;
    case "SET_SOCIAL_FARE":
      result = setSocialFare(session);
      break;
    case "ACTIVATE_PEAK_SERVICE":
      result = activatePeakService(session);
      break;
    case "COMPLETE_TURN":
      result = completeTurn(session);
      break;
    case "OBSERVE_NETWORK":
      session.missions.observe = true;
      session.xp += 5;
      pushLog(session, "Rede observada: o mapa passa a destacar a estação com maior fila.", "info");
      result = accept("Mapa analisado. A missão de observação foi concluída.");
      break;
    default:
      result = reject("Comando desconhecido.");
  }
  if (result.accepted && command.id) session.commandIds.push(command.id);
  if (result.accepted) advanceTutorial(session, command);
  recalculate(session);
  return result;
}

function advanceTutorial(session, command) {
  const tutorial = session.tutorial;
  if (!tutorial || tutorial.status !== "active") return;

  if (tutorial.step === 1 && command.type === "OBSERVE_NETWORK") {
    tutorial.step = 2;
    pushLog(session, "Camila Rocha: leitura da rede confirmada. Agora localize o VM-102 para a manutenção preventiva.", "info");
    return;
  }

  if (tutorial.step === 2 && command.type === "SCHEDULE_PREVENTIVE_MAINTENANCE" && command.trainId === "VM-102") {
    tutorial.step = 3;
    tutorial.status = "complete";
    if (!tutorial.rewardGranted) {
      tutorial.rewardGranted = true;
      session.xp += 25;
      if (session.career) session.career.tutorialCompleted = true;
    }
    pushLog(session, "Camila Rocha: procedimento concluído. +25 XP de certificação operacional.", "info");
  }
}

function requestHold(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || !train.visible) return reject("O trem selecionado não está disponível.");
  if (train.status === "HELD") return reject("Esse trem já está retido.");
  if (["DEPOT_READY", "DISPATCHING"].includes(train.status)) return reject("O trem ainda não está em linha para receber retenção.");
  train.holdRequested = true;
  session.missions.hold = true;
  session.xp += 10;
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: train.id,
    trainId: train.id,
    priority: "priority",
    direction: "outgoing",
    text: "Reter no próximo ponto seguro para regularizar intervalo. Confirme ao imobilizar."
  });
  pushLog(session, `${train.id}: retenção solicitada no próximo ponto seguro.`, "warning");
  return accept(`${train.id} receberá retenção ao alcançar a próxima estação.`, { trainId });
}

function releaseTrain(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || train.status !== "HELD") return reject("Só é possível liberar um trem que esteja retido.");
  train.status = "DWELLING";
  train.dwellRemaining = 4;
  train.holdRequested = false;
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: train.id,
    trainId: train.id,
    priority: "normal",
    direction: "outgoing",
    text: "Liberação confirmada. Retome a sequência conforme sinalização."
  });
  pushLog(session, `${train.id}: liberação confirmada. Partida em preparação.`, "info");
  return accept(`${train.id} voltará à sequência da Linha Vale.`, { trainId });
}

function requestStatusUpdate(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || !train.visible) return reject("A composição selecionada não está disponível para despacho.");
  if (train.dispatch.statusCheckRemaining > 0) return reject("A consulta de status já aguarda resposta do condutor.");
  train.dispatch.statusCheckRemaining = 2;
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: train.id,
    trainId: train.id,
    priority: "normal",
    direction: "outgoing",
    text: "Solicite condição operacional e confirmação de próximo ponto."
  });
  return accept(`Consulta de status enviada a ${train.id}.`, { trainId });
}

function requestRouteAuthorization(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || !train.visible) return reject("A composição selecionada não está disponível para despacho.");
  if (train.status !== "DWELLING") return reject("A autorização de via só pode ser solicitada enquanto o trem está em plataforma.");
  if (train.dispatch.routeStatus === "awaiting-confirmation") return reject("A solicitação de via já foi enviada e aguarda o condutor.");
  if (train.dispatch.routeStatus === "authorized" && train.dispatch.authorizationRemaining > 0) return reject("A autorização atual ainda está válida.");
  const segment = getSegmentKey(train, train.segmentIndex);
  if (isSegmentBlocked(session, train, train.segmentIndex)) return reject("O trecho seguinte está bloqueado; nenhuma autorização segura pode ser emitida.");
  train.dispatch.routeStatus = "awaiting-confirmation";
  train.dispatch.routeSegment = segment;
  train.dispatch.acknowledgementRemaining = 4;
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: train.id,
    trainId: train.id,
    priority: "priority",
    direction: "outgoing",
    text: `Autorização solicitada para o trecho ${getStation(session, getTrainOrigin(train)).name}–${getStation(session, getTrainTarget(train)).name}. Confirme prontidão.`
  });
  return accept(`Solicitação de autorização transmitida para ${train.id}.`, { trainId, segment });
}

function setDispatchPriority(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || !train.visible) return reject("A composição selecionada não está disponível para despacho.");
  if (train.dispatch.routeStatus !== "authorized" || train.dispatch.authorizationRemaining <= 0) {
    return reject("Confirme uma autorização de via antes de aplicar prioridade de recuperação.");
  }
  if (train.dispatch.priorityRemaining > 0) return reject("A prioridade de recuperação já está ativa para essa composição.");
  train.dispatch.priority = "recovery";
  train.dispatch.priorityRemaining = 70;
  train.delaySec = Math.max(0, train.delaySec - 8);
  session.missions.dispatchPriority = true;
  session.xp += 8;
  pushDispatchMessage(session, {
    from: "OCC-01",
    to: train.id,
    trainId: train.id,
    priority: "priority",
    direction: "outgoing",
    text: "Prioridade de recuperação autorizada. Preserve margem de segurança e reporte qualquer restrição."
  });
  return accept(`${train.id} recebeu prioridade de recuperação por 70 s de simulação.`, { trainId });
}

function dispatchReserve(session) {
  const reserve = session.reserve;
  const cost = 4_800_00;
  if (reserve.status !== "DEPOT_READY") return reject("O trem reserva já está comprometido com uma ordem.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para ativar o trem reserva.");
  reserve.status = "DISPATCHING";
  reserve.dispatchRemaining = 24;
  reserve.visible = true;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  session.missions.reserve = true;
  session.xp += 20;
  pushLog(session, "VM-R01: trem reserva liberado do pátio. Custo operacional registrado.", "info");
  return accept("Trem reserva em preparação; entrada estimada em 24 s de simulação.", { projectedCost: cost });
}

function activateSupportLine(session) {
  const train = session.supportTrain;
  const cost = 6_800_00;
  if (!train || train.status !== "DEPOT_READY") return reject("A linha complementar já está em operação ou em preparação.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para ativar a linha complementar.");
  train.visible = true;
  train.status = "DISPATCHING";
  train.dispatchRemaining = 20;
  session.network.supportLineStatus = "activating";
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  session.missions.supportLine = true;
  session.xp += 26;
  pushLog(session, `${session.supportLineName}: ativação autorizada. ${train.id} entra em serviço em 20 s.`, "info");
  return accept(`${session.supportLineName} está em preparação com ${train.id}.`, { projectedCost: cost });
}

function schedulePreventiveMaintenance(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  const cost = 2_200_00;
  if (!train || !train.visible) return reject("Esse trem não está disponível para manutenção preventiva.");
  if (train.faultActive) return reject("Resolva a falha ativa antes de programar a manutenção preventiva.");
  if (train.status === "MAINTENANCE") return reject("Esse trem já está na janela de manutenção.");
  if (train.condition >= 92) return reject("A condição do trem está boa; não há manutenção preventiva recomendada.");
  if (session.staff.maintenanceAvailable < 1) return reject("A equipe de manutenção está ocupada em outra ocorrência.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para programar a manutenção preventiva.");
  session.staff.maintenanceAvailable -= 1;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  train.status = "MAINTENANCE";
  train.maintenanceRemaining = 26;
  train.delaySec = Math.max(0, train.delaySec - 8);
  session.missions.preventiveMaintenance = true;
  session.xp += 18;
  pushLog(session, `${train.id}: manutenção preventiva iniciada. Retorno previsto em 26 s de simulação.`, "info");
  return accept(`${train.id} entrou em manutenção preventiva; condição será restaurada.`, { projectedCost: cost });
}

function assignMaintenance(session, incidentId) {
  const incident = getActiveIncidents(session).find((item) => item.id === incidentId);
  const cost = 1_600_00;
  if (!incident) return reject("Não há uma ocorrência ativa para essa ordem.");
  if (incident.status === "responding") return reject("Uma equipe já está respondendo a essa ocorrência.");
  if (session.staff.maintenanceAvailable < 1) return reject("A equipe de manutenção já está ocupada.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para mobilizar manutenção.");
  session.staff.maintenanceAvailable -= 1;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  incident.status = "responding";
  incident.responseRemaining = 16;
  pushLog(session, `Manutenção mobilizada para ${incident.trainId}. Resposta estimada em 16 s de simulação.`, "info");
  return accept(`Equipe enviada para ${incident.trainId}; custo operacional registrado.`, { projectedCost: cost });
}

function isolateSignal(session, incidentId) {
  const incident = getActiveIncidents(session).find((item) => item.id === incidentId && item.type === "Falha de sinal");
  const cost = 2_600_00;
  if (!incident) return reject("Não há uma falha de sinal ativa para isolar.");
  if (incident.status === "responding") return reject("O centro de sinal já está trabalhando nessa ocorrência.");
  if (session.staff.signalAvailable < 1) return reject("A equipe de sinal já está comprometida em outra ocorrência.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para mobilizar o centro de sinal.");
  session.staff.signalAvailable -= 1;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  incident.status = "responding";
  incident.responseRemaining = 22;
  pushLog(session, `Centro de sinal mobilizado para isolar o trecho ${getStation(session, "central").name}–${getStation(session, "riverside").name}.`, "warning");
  return accept("Isolamento autorizado; a liberação do trecho exige 22 s de simulação.", { projectedCost: cost });
}

function directPassengers(session, incidentId) {
  const incident = getActiveIncidents(session).find((item) => item.id === incidentId && item.type === "Falha de sinal");
  const cost = 900_00;
  if (!incident) return reject("O direcionamento só pode ser usado durante uma emergência ativa.");
  if (incident.passengerPlanActive) return reject("O plano de direcionamento já está ativo.");
  if (session.staff.passengerGuides < 1) return reject("Não há agentes de estação disponíveis para orientar passageiros.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para ativar o plano de orientação.");
  const central = getStation(session, "central");
  const riverside = getStation(session, "riverside");
  const redirected = Math.min(central.queue, 24) + Math.min(riverside.queue, 38);
  central.queue -= Math.min(central.queue, 24);
  riverside.queue -= Math.min(riverside.queue, 38);
  session.passengerTransfers += redirected;
  session.staff.passengerGuides -= 1;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  incident.passengerPlanActive = true;
  session.missions.passengers = true;
  session.xp += 15;
  pushLog(session, `${redirected} passageiros foram orientados para conexões alternativas.`, "info");
  return accept(`${redirected} passageiros redirecionados; pressão nas plataformas reduzida.`, { projectedCost: cost, redirected });
}

function deployStationTeam(session, stationId) {
  const cost = 1_200_00;
  const station = getStation(session, stationId || session.metrics.criticalStationId);
  if (!station) return reject("A estação escolhida não está disponível para receber a equipe.");
  if (session.teamSupport.remaining > 0) return reject("Uma equipe de estação já está mobilizada neste turno.");
  if (session.staff.stationTeams < 1) return reject("Não há equipe de estação disponível para mobilização.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para mobilizar a equipe de estação.");
  const assisted = Math.min(station.queue, 46);
  station.queue -= assisted;
  session.staff.stationTeams -= 1;
  session.teamSupport = { stationId: station.id, remaining: 90 };
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  session.missions.stationTeam = true;
  session.xp += 14;
  pushLog(session, `Equipe de estação mobilizada em ${station.name}: ${assisted} passageiros receberam orientação prioritária.`, "info");
  return accept(`Equipe mobilizada em ${station.name}; a demanda local será reduzida por 90 s de simulação.`, { projectedCost: cost, assisted });
}

function approveExpansion(session, projectId) {
  const project = Object.values(session.projects).find((item) => item.id === projectId);
  if (!project) return reject("Projeto de expansão não encontrado.");
  if (project.status === "building") return reject("Essa expansão já está em construção.");
  if (project.status === "complete") return reject("Essa expansão já foi entregue.");
  if (session.balanceCents < project.costCents) return reject("Saldo insuficiente para aprovar a expansão.");
  project.status = "building";
  project.constructionRemaining = 64;
  session.balanceCents -= project.costCents;
  session.operatingCostCents += project.costCents;
  pushLog(session, `Projeto aprovado: ${project.title}. Entrega estimada em 64 s de simulação.`, "info");
  return accept("Expansão aprovada. A obra já está em andamento e será refletida na capacidade da estação.", { projectedCost: project.costCents });
}

function activateGreenEnergy(session) {
  const cost = 8_400_00;
  if (session.policies.greenEnergy) return reject("O programa de energia eficiente já está ativo nesta carreira.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para modernizar a matriz energética.");
  session.policies.greenEnergy = true;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  session.reputation = Math.min(100, session.reputation + 3);
  session.missions.greenEnergy = true;
  session.xp += 14;
  pushLog(session, "Política aprovada: energia eficiente reduz o custo operacional recorrente.", "info");
  return accept("Programa de energia eficiente ativado; custo por segundo reduzido.", { projectedCost: cost });
}

function setSocialFare(session) {
  if (session.policies.farePlan === "social") return reject("A tarifa social já está ativa nesta carreira.");
  session.policies.farePlan = "social";
  session.reputation = Math.min(100, session.reputation + 4);
  session.missions.socialFare = true;
  session.xp += 10;
  pushLog(session, "Política aprovada: tarifa social aumenta o acesso e reduz a receita por embarque.", "info");
  return accept("Tarifa social ativada; reputação sobe e receita unitária é reduzida.");
}

function activatePeakService(session) {
  const cost = 3_600_00;
  if (session.policies.peakBoostRemaining > 0) return reject("O reforço de pico já está em operação neste turno.");
  if (session.balanceCents < cost) return reject("Saldo insuficiente para reforçar o pico de demanda.");
  session.policies.peakBoostRemaining = 150;
  session.policies.peakServiceDeployed = true;
  session.balanceCents -= cost;
  session.operatingCostCents += cost;
  session.missions.peakService = true;
  session.xp += 16;
  pushLog(session, "Reforço de pico ativado: embarque acelerado durante 150 s de simulação.", "info");
  return accept("Reforço de pico ativado por 150 s de simulação.", { projectedCost: cost });
}

function completeTurn(session) {
  if (session.mode !== "career") return reject("O sandbox não registra progressão de carreira.");
  if (session.turn.status === "complete") return reject("Este turno já foi encerrado.");
  const elapsed = session.time - session.turn.startedAt;
  if (elapsed < session.turn.minimumDuration) {
    return reject(`Conduza a operação por mais ${session.turn.minimumDuration - elapsed} s de simulação antes de encerrar o turno.`);
  }
  const activeIncidents = getActiveIncidents(session);
  const criticalOpen = activeIncidents.some((incident) => incident.severity === "critical");
  const contractResult = resolveCampaignContract(session);
  const strategicBonus = (session.network.supportLineStatus === "operating" ? 2 : 0)
    + (session.policies.greenEnergy ? 2 : 0)
    + (session.missions.peakService ? 1 : 0)
    + (contractResult.completed ? 2 : 0);
  const score = Math.max(0, Math.min(100, session.metrics.onTime + (criticalOpen ? -15 : 4) + (activeIncidents.length === 0 ? 6 : 0) + strategicBonus));
  const grade = score >= 94 ? "A" : score >= 84 ? "B" : score >= 74 ? "C" : "D";
  const rewardCents = { A: 16_000_00, B: 10_000_00, C: 5_000_00, D: 0 }[grade];
  const xpReward = { A: 35, B: 24, C: 12, D: 4 }[grade];
  session.balanceCents += rewardCents;
  session.revenueCents += rewardCents;
  session.xp += xpReward;
  session.reputation = Math.max(0, Math.min(100, session.reputation + (grade === "A" ? 5 : grade === "B" ? 2 : grade === "C" ? 0 : -4)));
  session.career.totalXp += session.xp;
  session.career.completedTurns += 1;
  session.career.balanceCents = session.balanceCents;
  session.career.reputation = session.reputation;
  session.career.completedProjectIds = Object.values(session.projects)
    .filter((project) => project.status === "complete")
    .map((project) => project.id);
  session.career.policyState = {
    farePlan: session.policies.farePlan,
    greenEnergy: session.policies.greenEnergy
  };
  const previousCampaignState = session.career.campaignState || { chapterIndex: 0, completedContracts: [] };
  session.career.campaignState = {
    chapterIndex: (previousCampaignState.chapterIndex ?? 0) + (contractResult.completed ? 1 : 0),
    completedContracts: contractResult.completed
      ? [...(previousCampaignState.completedContracts || []), session.campaign.scenarioId]
      : (previousCampaignState.completedContracts || []),
    lastContractId: session.campaign.scenarioId,
    lastContractStatus: contractResult.completed ? "completed" : "pending"
  };
  session.turn.status = "complete";
  session.turn.summary = {
    grade,
    score,
    rewardCents,
    xpReward,
    onTime: session.metrics.onTime,
    incidentsOpen: activeIncidents.length,
    contract: contractResult
  };
  session.timeScale = 0;
  pushLog(session, `Turno encerrado com nota ${grade}. Receita de desempenho registrada.${contractResult.completed ? " Contrato municipal concluído." : " Contrato municipal permanece pendente."}`, "info");
  return accept(`Turno concluído com nota ${grade}. O próximo dia da carreira está disponível.`, { summary: session.turn.summary });
}

function resolveCampaignContract(session) {
  const contract = session.campaign?.contract;
  if (!contract) return { completed: false, title: "Contrato indisponível", rewardCents: 0, xpReward: 0 };
  let completed = false;
  let progress = "";
  if (contract.goalType === "on_time") {
    completed = session.metrics.onTime >= contract.targetValue;
    progress = `${session.metrics.onTime}% / ${contract.targetValue}% de pontualidade`;
  }
  if (contract.goalType === "support_line") {
    completed = session.network.supportLineStatus === "operating";
    progress = completed ? "Linha complementar em operação" : "Linha complementar ainda não entrou em serviço";
  }
  if (contract.goalType === "green_energy") {
    completed = session.policies.greenEnergy;
    progress = completed ? "Programa de energia eficiente aprovado" : "Programa de energia eficiente não aprovado";
  }
  if (contract.goalType === "social_fare") {
    completed = session.policies.farePlan === "social";
    progress = completed ? "Tarifa social em vigor" : "Tarifa social ainda não está em vigor";
  }
  if (contract.goalType === "station_team") {
    completed = session.missions.stationTeam;
    progress = completed ? "Equipe de estação mobilizada" : "Nenhuma equipe de estação foi mobilizada";
  }
  contract.progress = progress;
  contract.status = completed ? "completed" : "pending";
  if (completed) {
    session.balanceCents += contract.rewardCents;
    session.revenueCents += contract.rewardCents;
    session.xp += contract.xpReward;
    session.missions.contract = true;
  }
  return { completed, title: contract.title, description: contract.description, rewardCents: completed ? contract.rewardCents : 0, xpReward: completed ? contract.xpReward : 0, progress };
}

export function tickSession(session, seconds = 1) {
  normalizeSession(session);
  for (let tick = 0; tick < seconds; tick += 1) {
    session.time += 1;
    updateDispatch(session);
    addPassengerDemand(session);
    getVisibleTrains(session).forEach((train) => advanceTrain(session, train));
    session.operatingCostCents += session.policies.greenEnergy ? 160 : 210;
    updateFleetCondition(session);
    updatePolicies(session);
    updateTeamSupport(session);
    updateIncidents(session);
    updateProjects(session);
    recalculate(session);
  }
  return session;
}

function updateDispatch(session) {
  for (const train of getAllTrains(session)) {
    const dispatch = train.dispatch;
    if (!dispatch) continue;

    if (dispatch.statusCheckRemaining > 0) {
      dispatch.statusCheckRemaining -= 1;
      if (dispatch.statusCheckRemaining === 0) {
        const next = getStation(session, getTrainTarget(train));
        const restriction = train.faultActive ? " Falha ativa; operação restrita." : " Sem restrições adicionais.";
        pushDispatchMessage(session, {
          from: train.id,
          to: "OCC-01",
          trainId: train.id,
          priority: train.delaySec > 90 ? "priority" : "normal",
          direction: "incoming",
          text: `Condição confirmada: ${getStatusText(train.status).toLowerCase()}, próximo ponto ${next.name}, atraso +${train.delaySec}s.${restriction}`
        });
      }
    }

    if (dispatch.routeStatus === "awaiting-confirmation") {
      dispatch.acknowledgementRemaining -= 1;
      if (dispatch.acknowledgementRemaining <= 0) {
        const segmentBlocked = isSegmentBlocked(session, train, train.segmentIndex);
        const occupied = segmentOccupied(session, train, train.segmentIndex);
        if (segmentBlocked || occupied) {
          dispatch.routeStatus = "denied";
          dispatch.routeSegment = null;
          pushDispatchMessage(session, {
            from: "Sistema de via",
            to: "OCC-01",
            trainId: train.id,
            priority: "critical",
            direction: "system",
            text: `${train.id}: autorização negada. O trecho solicitado não apresenta condição segura de ocupação.`
          });
        } else {
          dispatch.routeStatus = "authorized";
          dispatch.authorizationRemaining = 70;
          session.missions.routeAuthorization = true;
          session.xp += 6;
          pushDispatchMessage(session, {
            from: train.id,
            to: "OCC-01",
            trainId: train.id,
            priority: "priority",
            direction: "incoming",
            text: "Prontidão confirmada. Autorização recebida; partida será executada conforme sinalização."
          });
        }
      }
    }

    if (dispatch.routeStatus === "authorized" && dispatch.authorizationRemaining > 0) {
      dispatch.authorizationRemaining -= 1;
      if (dispatch.authorizationRemaining === 0) {
        dispatch.routeStatus = "expired";
        dispatch.routeSegment = null;
        pushDispatchMessage(session, {
          from: "OCC-01",
          to: train.id,
          trainId: train.id,
          priority: "normal",
          direction: "system",
          text: "Janela de autorização encerrada. Solicite nova via antes de uma partida prioritária."
        });
      }
    }

    if (dispatch.priorityRemaining > 0) {
      dispatch.priorityRemaining -= 1;
      if (dispatch.priorityRemaining === 0) {
        dispatch.priority = "normal";
        pushDispatchMessage(session, {
          from: "OCC-01",
          to: train.id,
          trainId: train.id,
          priority: "normal",
          direction: "system",
          text: "Prioridade de recuperação encerrada. Retorne ao plano regular de marcha."
        });
      }
    }
  }
}

function addPassengerDemand(session) {
  for (const station of session.stations) {
    const wave = Math.sin((session.time + station.x * 900) / 97) * 0.21;
    const multiplier = station.id === "riverside" ? 1.25 : 1;
    const farePressure = session.policies.farePlan === "social" ? 1.08 : 1;
    const campaignPressure = station.id === session.campaign?.stationId ? session.campaign.demandMultiplier : 1;
    const teamRelief = station.id === session.teamSupport.stationId && session.teamSupport.remaining > 0 ? 0.78 : 1;
    const added = Math.max(0, Math.floor((station.demand + wave) * multiplier * farePressure * campaignPressure * teamRelief));
    station.queue += added;
    station.arrivals += added;
  }
}

function advanceTrain(session, train) {
  if (train.status === "MAINTENANCE") {
    train.maintenanceRemaining -= 1;
    if (train.maintenanceRemaining <= 0) {
      train.maintenanceRemaining = 0;
      train.condition = 98;
      train.status = "DWELLING";
      train.dwellRemaining = 7;
      session.staff.maintenanceAvailable += 1;
      pushLog(session, `${train.id}: manutenção preventiva concluída; condição restaurada para 98%.`, "info");
    }
    return;
  }
  if (train.status === "DISPATCHING") {
    train.dispatchRemaining -= 1;
    if (train.dispatchRemaining <= 0) {
      train.status = "DWELLING";
      train.dwellRemaining = 8;
      train.segmentIndex = 0;
      train.progress = 0;
      if (train.line === "SUPORTE") session.network.supportLineStatus = "operating";
      const line = train.line === "SUPORTE" ? session.supportLineName : session.lineName;
      pushLog(session, `${train.id}: entrou em serviço na ${line}.`, "info");
    }
    return;
  }
  if (train.status === "HELD" || train.status === "DEPOT_READY") return;
  if (train.status === "WAITING_SIGNAL") {
    if (!isSegmentBlocked(session, train, train.segmentIndex) && !segmentOccupied(session, train, train.segmentIndex)) {
      train.status = "EN_ROUTE";
      pushLog(session, `${train.id}: via liberada, retomando movimento.`, "info");
    } else {
      train.delaySec += 1;
    }
    return;
  }
  if (train.status === "DWELLING") {
    if (train.faultActive) {
      train.delaySec += 1;
      return;
    }
    const clearanceForCurrentSegment = train.dispatch.routeStatus === "authorized"
      && train.dispatch.routeSegment === getSegmentKey(train, train.segmentIndex);
    train.dwellRemaining -= clearanceForCurrentSegment ? 2 : 1;
    if (train.dwellRemaining <= 0) {
      if (isSegmentBlocked(session, train, train.segmentIndex) || segmentOccupied(session, train, train.segmentIndex)) {
        train.status = "WAITING_SIGNAL";
        train.delaySec += 1;
      } else {
        train.status = "EN_ROUTE";
        train.progress = 0;
      }
    }
    return;
  }
  if (train.status !== "EN_ROUTE") return;
  const priorityFactor = train.dispatch.priority === "recovery" && train.dispatch.priorityRemaining > 0 ? 1.18 : 1;
  train.progress += priorityFactor / 58;
  if (train.progress < 1) return;
  train.progress = 0;
  if (train.dispatch.routeStatus === "authorized") {
    train.dispatch.routeStatus = "consumed";
    train.dispatch.authorizationRemaining = 0;
    train.dispatch.routeSegment = null;
  }
  train.segmentIndex = (train.segmentIndex + 1) % train.route.length;
  const station = getStation(session, getTrainOrigin(train));
  const alighting = Math.min(train.occupancy, 18 + ((session.time + train.segmentIndex * 13) % 17));
  train.occupancy -= alighting;
  const boardingBase = session.policies.peakBoostRemaining > 0 ? 36 : 24;
  const boarding = Math.min(train.capacity - train.occupancy, station.queue, boardingBase + ((session.time + train.segmentIndex * 7) % 14));
  train.occupancy += boarding;
  station.queue -= boarding;
  station.departures += boarding;
  const fareCents = session.policies.farePlan === "social" ? 220 : 260;
  session.revenueCents += boarding * fareCents;
  session.balanceCents += boarding * fareCents;
  train.status = train.holdRequested ? "HELD" : "DWELLING";
  train.dwellRemaining = train.status === "HELD" ? 0 : 9;
  if (train.status === "HELD") {
    train.holdRequested = false;
    pushLog(session, `${train.id}: retido em ${station.name}; a ordem alterou o intervalo da linha.`, "warning");
    pushDispatchMessage(session, {
      from: train.id,
      to: "OCC-01",
      trainId: train.id,
      priority: "priority",
      direction: "incoming",
      text: `Retenção concluída em ${station.name}. Trem imobilizado e aguardando nova instrução.`
    });
  }
}

function updateFleetCondition(session) {
  if (session.time % 60 !== 0) return;
  for (const train of getVisibleTrains(session)) {
    if (train.status === "MAINTENANCE" || train.status === "DEPOT_READY") continue;
    train.condition = Math.max(40, train.condition - (train.line === "SUPORTE" ? 2 : 1));
    if (train.condition < 65) {
      train.delaySec += 5;
      pushLog(session, `${train.id}: condição de frota baixa (${train.condition}%). Risco de atraso aumentado.`, "warning");
    }
  }
}

function updatePolicies(session) {
  if (session.policies.peakBoostRemaining <= 0) return;
  session.policies.peakBoostRemaining -= 1;
  if (session.policies.peakBoostRemaining === 0) {
    pushLog(session, "Reforço de pico encerrado; o embarque retornou ao ritmo padrão.", "info");
  }
}

function updateTeamSupport(session) {
  if (session.teamSupport.remaining <= 0) return;
  session.teamSupport.remaining -= 1;
  if (session.teamSupport.remaining > 0) return;
  const station = getStation(session, session.teamSupport.stationId);
  session.staff.stationTeams += 1;
  session.teamSupport.stationId = null;
  pushLog(session, `Equipe de estação concluiu o reforço em ${station?.name || "estação prioritária"} e retornou à base.`, "info");
}

function segmentOccupied(session, currentTrain, segmentIndex) {
  const [from, to] = getSegmentKey(currentTrain, segmentIndex).split(":");
  return getVisibleTrains(session).some((train) => {
    if (train.id === currentTrain.id || train.status !== "EN_ROUTE") return false;
    const [otherFrom, otherTo] = getSegmentKey(train, train.segmentIndex).split(":");
    return from === otherFrom && to === otherTo;
  });
}

function getSegmentKey(train, segmentIndex) {
  return [
    train.route[segmentIndex % train.route.length],
    train.route[(segmentIndex + 1) % train.route.length]
  ].sort().join(":");
}

function isSegmentBlocked(session, train, segmentIndex) {
  return session.network.blockedSegments.includes(getSegmentKey(train, segmentIndex));
}

function updateIncidents(session) {
  triggerDoorFault(session);
  triggerSignalFault(session);
  progressIncidentResponses(session);
  updateCrowdingIncident(session);
}

function updateProjects(session) {
  for (const project of Object.values(session.projects)) {
    if (project.status !== "building") continue;
    project.constructionRemaining -= 1;
    if (project.constructionRemaining > 0) continue;
    project.status = "complete";
    project.completedAt = session.time;
    const station = getStation(session, project.stationId);
    if (station) {
      station.capacity += project.capacityGain;
      station.expansionLevel = (station.expansionLevel || 0) + 1;
    }
    session.missions.expansion = true;
    session.xp += 32;
    pushLog(session, `${project.title} concluída: +${project.capacityGain} de capacidade em ${station?.name || "Riverside"}.`, "info");
  }
}

function triggerDoorFault(session) {
  if (session.scenario.doorFaultTriggered || session.time < session.scenario.doorFaultAt) return;
  const train = session.trains.find((item) => item.id === "VM-103");
  if (!train) return;
  session.scenario.doorFaultTriggered = true;
  train.faultActive = true;
  train.delaySec += 24;
  session.incidents.push({
    id: "door-fault",
    type: "Falha de porta",
    severity: "warning",
    trainId: train.id,
    status: "active",
    startedAt: session.time
  });
  pushLog(session, `Ocorrência: ${train.id} reporta falha de porta. Manutenção recomendada.`, "warning");
  pushDispatchMessage(session, {
    from: train.id,
    to: "OCC-01",
    trainId: train.id,
    priority: "priority",
    direction: "incoming",
    text: "Falha de porta reportada. Trem mantido em plataforma até avaliação da manutenção."
  });
}

function triggerSignalFault(session) {
  if (session.scenario.signalFaultTriggered || session.time < session.scenario.signalFaultAt) return;
  session.scenario.signalFaultTriggered = true;
  const blockedSegment = "central:riverside";
  session.network.blockedSegments.push(blockedSegment);
  session.incidents.push({
    id: "signal-fault",
    type: "Falha de sinal",
    severity: "critical",
    blockedSegment,
    status: "active",
    passengerPlanActive: false,
    startedAt: session.time
  });
  pushLog(session, `Emergência: falha de sinal bloqueou o corredor ${getStation(session, "central").name}–${getStation(session, "riverside").name}.`, "danger");
  pushDispatchMessage(session, {
    from: "Sistema de sinalização",
    to: "OCC-01",
    priority: "critical",
    direction: "system",
    text: `Falha crítica: corredor ${getStation(session, "central").name}–${getStation(session, "riverside").name} bloqueado para novos movimentos.`
  });
}

function progressIncidentResponses(session) {
  for (const incident of getActiveIncidents(session)) {
    if (incident.status !== "responding") continue;
    incident.responseRemaining -= 1;
    if (incident.responseRemaining > 0) continue;
    incident.status = "resolved";
    incident.resolvedAt = session.time;
    resolveIncident(session, incident);
    session.incidentHistory.unshift({ ...incident });
  }
}

function resolveIncident(session, incident) {
  if (incident.type === "Falha de porta") {
    const train = getAllTrains(session).find((item) => item.id === incident.trainId);
    if (train) {
      train.faultActive = false;
      train.dwellRemaining = Math.max(2, train.dwellRemaining ?? 0);
    }
    session.staff.maintenanceAvailable += 1;
    session.missions.maintenance = true;
    session.xp += 18;
    pushLog(session, `${incident.trainId}: manutenção concluiu a resposta e liberou o trem.`, "info");
    return;
  }
  if (incident.type === "Falha de sinal") {
    session.network.blockedSegments = session.network.blockedSegments.filter((segment) => segment !== incident.blockedSegment);
    session.staff.signalAvailable += 1;
    if (incident.passengerPlanActive) session.staff.passengerGuides += 1;
    session.missions.signal = true;
    session.xp += 30;
    pushLog(session, `Sinal restabelecido: corredor ${getStation(session, "central").name}–${getStation(session, "riverside").name} liberado para retomada gradual.`, "info");
  }
}

function updateCrowdingIncident(session) {
  const critical = session.stations.reduce((highest, station) => (station.queue > highest.queue ? station : highest));
  const existing = getActiveIncidents(session).find((incident) => incident.id === "crowding");
  if (critical.queue >= critical.capacity && !existing) {
    session.incidents.push({ id: "crowding", type: "Fila elevada", stationId: critical.id, severity: "warning", status: "active", startedAt: session.time });
    pushLog(session, `Alerta: fila elevada em ${critical.name}. Reforço de oferta recomendado.`, "warning");
  }
  if (existing && critical.queue < critical.capacity * 0.78) {
    existing.status = "resolved";
    existing.resolvedAt = session.time;
    session.incidentHistory.unshift({ ...existing });
    session.xp += 8;
    pushLog(session, `Alerta encerrado: ${critical.name} voltou a um nível administrável.`, "info");
  }
}

function recalculate(session) {
  const critical = session.stations.reduce((highest, station) => (station.queue > highest.queue ? station : highest));
  const active = getVisibleTrains(session).filter((train) => train.status !== "DEPOT_READY");
  const averageDelay = active.reduce((sum, train) => sum + train.delaySec, 0) / Math.max(active.length, 1);
  const activeLines = new Set(active.filter((train) => train.line !== "RESERVA").map((train) => train.line)).size || 1;
  session.metrics = {
    totalQueue: session.stations.reduce((sum, station) => sum + station.queue, 0),
    criticalStationId: critical.id,
    criticalQueue: critical.queue,
    onTime: Math.max(72, Math.min(100, Math.round(99 - averageDelay / 5 - Math.max(0, critical.queue - critical.capacity) / 14))),
    activeTrains: active.length,
    activeLines
  };
}

function pushLog(session, text, kind) {
  session.log.unshift({ at: session.time, text, kind });
  session.log = session.log.slice(0, 18);
}

function pushDispatchMessage(session, { from, to, trainId = null, priority = "normal", direction = "system", text }) {
  session.dispatch ??= createDispatchBoard();
  const id = `OCC-${String(session.dispatch.nextId || 1).padStart(3, "0")}`;
  session.dispatch.nextId = (session.dispatch.nextId || 1) + 1;
  session.dispatch.messages.unshift({ id, at: session.time, from, to, trainId, priority, direction, text });
  session.dispatch.messages = session.dispatch.messages.slice(0, 30);
}

function accept(message, extra = {}) { return { accepted: true, message, ...extra }; }
function reject(message) { return { accepted: false, message }; }
