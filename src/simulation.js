const route = ["depot", "norte", "central", "riverside", "porto"];

export const cityProfiles = [
  {
    id: "vale-central",
    name: "Vale Central",
    lineName: "Linha Vale",
    corridor: "Vale Norte — Porto Azul",
    description: "Rede equilibrada, indicada para construir a primeira carreira.",
    difficulty: "Operação moderada",
    startingBalanceCents: 128_400_00,
    demandMultiplier: 1,
    capacityMultiplier: 1,
    queueMultiplier: 1,
    stationNames: ["Pátio Vale", "Vale Norte", "Central", "Riverside", "Porto Azul"]
  },
  {
    id: "porto-dourado",
    name: "Porto Dourado",
    lineName: "Linha da Marina",
    corridor: "Estaleiro — Terminal Oceano",
    description: "Cidade portuária de alto fluxo: mais receita, pressão maior nos picos.",
    difficulty: "Demanda intensa",
    startingBalanceCents: 154_000_00,
    demandMultiplier: 1.18,
    capacityMultiplier: 0.94,
    queueMultiplier: 1.16,
    stationNames: ["Pátio Marina", "Estaleiro", "Mercado Velho", "Distrito do Porto", "Terminal Oceano"]
  },
  {
    id: "serra-clara",
    name: "Serra Clara",
    lineName: "Linha das Serras",
    corridor: "Parque Alto — Vale do Sol",
    description: "Corredor residencial com orçamento menor e necessidade de regularidade.",
    difficulty: "Orçamento restrito",
    startingBalanceCents: 102_000_00,
    demandMultiplier: 0.86,
    capacityMultiplier: 1.08,
    queueMultiplier: 0.82,
    stationNames: ["Pátio da Serra", "Parque Alto", "Centro Cívico", "Hospital Regional", "Vale do Sol"]
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
  { id: "VM-101", segmentIndex: 0, progress: 0.26, status: "EN_ROUTE", occupancy: 72, delaySec: 0 },
  { id: "VM-102", segmentIndex: 1, progress: 0.43, status: "EN_ROUTE", occupancy: 108, delaySec: 16 },
  { id: "VM-103", segmentIndex: 2, progress: 0, status: "DWELLING", occupancy: 133, delaySec: 0, dwellRemaining: 11 },
  { id: "VM-104", segmentIndex: 3, progress: 0.52, status: "EN_ROUTE", occupancy: 64, delaySec: 8 }
];

const statusText = {
  DEPOT_READY: "No pátio",
  DISPATCHING: "Em despacho",
  EN_ROUTE: "Em rota",
  DWELLING: "Em plataforma",
  HELD: "Retido",
  WAITING_SIGNAL: "Aguardando via"
};

export function createInitialSession(mode = "career", cityId = "vale-central", careerProfile = null) {
  const city = getCityProfile(cityId);
  const balanceCents = mode === "sandbox" ? 999_999_00 : careerProfile?.balanceCents ?? city.startingBalanceCents;
  const stations = createCityStations(city);
  const projects = { riversideExpansion: createRiversideExpansionProject(city.stationNames[3]) };
  const completedProjectIds = careerProfile?.completedProjectIds ?? [];
  if (mode === "career" && completedProjectIds.includes(projects.riversideExpansion.id)) {
    projects.riversideExpansion.status = "complete";
    const station = stations.find((item) => item.id === projects.riversideExpansion.stationId);
    if (station) station.capacity += projects.riversideExpansion.capacityGain;
  }
  const session = {
    schemaVersion: 5,
    mode,
    time: 6 * 3600,
    timeScale: 1,
    city: city.name,
    cityId: city.id,
    lineName: city.lineName,
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
      visible: true
    })),
    reserve: {
      id: "VM-R01",
      route: [...route],
      segmentIndex: 0,
      progress: 0,
      status: "DEPOT_READY",
      occupancy: 0,
      capacity: 180,
      delaySec: 0,
      dispatchRemaining: 0,
      visible: false,
      holdRequested: false
    },
    missions: { observe: false, hold: false, reserve: false, maintenance: false, signal: false, passengers: false, expansion: false },
    incidents: [],
    incidentHistory: [],
    staff: { maintenanceAvailable: 1, signalAvailable: 1, passengerGuides: 2 },
    scenario: {
      doorFaultAt: 6 * 3600 + 180,
      doorFaultTriggered: false,
      signalFaultAt: 6 * 3600 + 360,
      signalFaultTriggered: false
    },
    network: { blockedSegments: [] },
    passengerTransfers: 0,
    projects,
    career: mode === "career" ? {
      cityId: city.id,
      day: careerProfile?.day ?? 1,
      totalXp: careerProfile?.totalXp ?? 0,
      completedTurns: careerProfile?.completedTurns ?? 0,
      completedProjectIds,
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
    metrics: { totalQueue: 0, criticalStationId: "riverside", onTime: 100, activeTrains: 4 }
  };
  pushLog(session, `${mode === "career" ? `Dia ${session.career.day} da carreira em ${city.name}` : "Sandbox"}: rede em operação às 06:00.`, "info");
  recalculate(session);
  return normalizeSession(session);
}

export function normalizeSession(session) {
  const city = getCityProfile(session.cityId || "vale-central");
  session.schemaVersion = 5;
  session.cityId ??= city.id;
  session.city ??= city.name;
  session.lineName ??= city.lineName;
  session.corridor ??= city.corridor;
  session.missions = { observe: false, hold: false, reserve: false, maintenance: false, signal: false, passengers: false, expansion: false, ...session.missions };
  session.incidents ??= [];
  session.incidentHistory ??= [];
  session.staff = { maintenanceAvailable: 1, signalAvailable: 1, passengerGuides: 2, ...session.staff };
  session.scenario = {
    doorFaultAt: 6 * 3600 + 180,
    doorFaultTriggered: false,
    signalFaultAt: 6 * 3600 + 360,
    signalFaultTriggered: false,
    ...session.scenario
  };
  session.network = { blockedSegments: [], ...session.network };
  session.passengerTransfers ??= 0;
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
      balanceCents: session.balanceCents,
      ...session.career
    };
  }
  session.turn = { status: "active", startedAt: 6 * 3600, minimumDuration: 300, summary: null, ...session.turn };
  session.commandIds ??= [];
  getAllTrains(session).forEach((train) => { train.faultActive ??= false; });
  return session;
}

function getCityProfile(cityId) {
  return cityProfiles.find((city) => city.id === cityId) || cityProfiles[0];
}

function createCityStations(city) {
  return stationBlueprint.map((station, index) => ({
    ...station,
    name: city.stationNames[index],
    capacity: Math.round(station.capacity * city.capacityMultiplier),
    demand: Number((station.demand * city.demandMultiplier).toFixed(2)),
    queue: Math.round(station.queue * city.queueMultiplier),
    arrivals: 0,
    departures: 0
  }));
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
  return [...session.trains, session.reserve];
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
    case "DISPATCH_RESERVE":
      result = dispatchReserve(session);
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
    case "APPROVE_EXPANSION":
      result = approveExpansion(session, command.projectId);
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
  recalculate(session);
  return result;
}

function requestHold(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || !train.visible) return reject("O trem selecionado não está disponível.");
  if (train.status === "HELD") return reject("Esse trem já está retido.");
  if (["DEPOT_READY", "DISPATCHING"].includes(train.status)) return reject("O trem ainda não está em linha para receber retenção.");
  train.holdRequested = true;
  session.missions.hold = true;
  session.xp += 10;
  pushLog(session, `${train.id}: retenção solicitada no próximo ponto seguro.`, "warning");
  return accept(`${train.id} receberá retenção ao alcançar a próxima estação.`, { trainId });
}

function releaseTrain(session, trainId) {
  const train = getAllTrains(session).find((item) => item.id === trainId);
  if (!train || train.status !== "HELD") return reject("Só é possível liberar um trem que esteja retido.");
  train.status = "DWELLING";
  train.dwellRemaining = 4;
  train.holdRequested = false;
  pushLog(session, `${train.id}: liberação confirmada. Partida em preparação.`, "info");
  return accept(`${train.id} voltará à sequência da Linha Vale.`, { trainId });
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

function completeTurn(session) {
  if (session.mode !== "career") return reject("O sandbox não registra progressão de carreira.");
  if (session.turn.status === "complete") return reject("Este turno já foi encerrado.");
  const elapsed = session.time - session.turn.startedAt;
  if (elapsed < session.turn.minimumDuration) {
    return reject(`Conduza a operação por mais ${session.turn.minimumDuration - elapsed} s de simulação antes de encerrar o turno.`);
  }
  const activeIncidents = getActiveIncidents(session);
  const criticalOpen = activeIncidents.some((incident) => incident.severity === "critical");
  const score = Math.max(0, Math.min(100, session.metrics.onTime + (criticalOpen ? -15 : 4) + (activeIncidents.length === 0 ? 6 : 0)));
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
  session.turn.status = "complete";
  session.turn.summary = {
    grade,
    score,
    rewardCents,
    xpReward,
    onTime: session.metrics.onTime,
    incidentsOpen: activeIncidents.length
  };
  session.timeScale = 0;
  pushLog(session, `Turno encerrado com nota ${grade}. Receita de desempenho registrada.`, "info");
  return accept(`Turno concluído com nota ${grade}. O próximo dia da carreira está disponível.`, { summary: session.turn.summary });
}

export function tickSession(session, seconds = 1) {
  normalizeSession(session);
  for (let tick = 0; tick < seconds; tick += 1) {
    session.time += 1;
    addPassengerDemand(session);
    getVisibleTrains(session).forEach((train) => advanceTrain(session, train));
    session.operatingCostCents += 210;
    updateIncidents(session);
    updateProjects(session);
    recalculate(session);
  }
  return session;
}

function addPassengerDemand(session) {
  for (const station of session.stations) {
    const wave = Math.sin((session.time + station.x * 900) / 97) * 0.21;
    const multiplier = station.id === "riverside" ? 1.25 : 1;
    const added = Math.max(0, Math.floor((station.demand + wave) * multiplier));
    station.queue += added;
    station.arrivals += added;
  }
}

function advanceTrain(session, train) {
  if (train.status === "DISPATCHING") {
    train.dispatchRemaining -= 1;
    if (train.dispatchRemaining <= 0) {
      train.status = "DWELLING";
      train.dwellRemaining = 8;
      train.segmentIndex = 0;
      train.progress = 0;
      pushLog(session, `${train.id}: entrou na Linha Vale pelo Pátio Vale.`, "info");
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
    train.dwellRemaining -= 1;
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
  train.progress += 1 / 58;
  if (train.progress < 1) return;
  train.progress = 0;
  train.segmentIndex = (train.segmentIndex + 1) % train.route.length;
  const station = getStation(session, getTrainOrigin(train));
  const alighting = Math.min(train.occupancy, 18 + ((session.time + train.segmentIndex * 13) % 17));
  train.occupancy -= alighting;
  const boarding = Math.min(train.capacity - train.occupancy, station.queue, 24 + ((session.time + train.segmentIndex * 7) % 14));
  train.occupancy += boarding;
  station.queue -= boarding;
  station.departures += boarding;
  session.revenueCents += boarding * 260;
  session.balanceCents += boarding * 260;
  train.status = train.holdRequested ? "HELD" : "DWELLING";
  train.dwellRemaining = train.status === "HELD" ? 0 : 9;
  if (train.status === "HELD") {
    train.holdRequested = false;
    pushLog(session, `${train.id}: retido em ${station.name}; a ordem alterou o intervalo da linha.`, "warning");
  }
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
  session.metrics = {
    totalQueue: session.stations.reduce((sum, station) => sum + station.queue, 0),
    criticalStationId: critical.id,
    criticalQueue: critical.queue,
    onTime: Math.max(72, Math.min(100, Math.round(99 - averageDelay / 5 - Math.max(0, critical.queue - critical.capacity) / 14))),
    activeTrains: active.length
  };
}

function pushLog(session, text, kind) {
  session.log.unshift({ at: session.time, text, kind });
  session.log = session.log.slice(0, 18);
}

function accept(message, extra = {}) { return { accepted: true, message, ...extra }; }
function reject(message) { return { accepted: false, message }; }
