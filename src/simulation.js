const route = ["depot", "norte", "central", "riverside", "porto"];

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

export function createInitialSession(mode = "career") {
  const session = {
    schemaVersion: 1,
    mode,
    time: 6 * 3600,
    timeScale: 1,
    city: "Vale Central",
    balanceCents: mode === "sandbox" ? 999_999_00 : 128_400_00,
    revenueCents: 0,
    operatingCostCents: 0,
    reputation: 76,
    xp: 0,
    stations: stationBlueprint.map((station) => ({ ...station, arrivals: 0, departures: 0 })),
    trains: trainBlueprint.map((train) => ({
      ...train,
      route: [...route],
      capacity: 180,
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
    missions: { observe: false, hold: false, reserve: false },
    incidents: [],
    log: [],
    commandIds: [],
    metrics: { totalQueue: 0, criticalStationId: "riverside", onTime: 100, activeTrains: 4 }
  };
  pushLog(session, "Turno iniciado. Rede em operação às 06:00.", "info");
  recalculate(session);
  return session;
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

export function tickSession(session, seconds = 1) {
  for (let tick = 0; tick < seconds; tick += 1) {
    session.time += 1;
    addPassengerDemand(session);
    getVisibleTrains(session).forEach((train) => advanceTrain(session, train));
    session.operatingCostCents += 210;
    maybeUpdateIncident(session);
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
    if (!segmentOccupied(session, train, train.segmentIndex)) {
      train.status = "EN_ROUTE";
      pushLog(session, `${train.id}: via liberada, retomando movimento.`, "info");
    }
    return;
  }
  if (train.status === "DWELLING") {
    train.dwellRemaining -= 1;
    if (train.dwellRemaining <= 0) {
      if (segmentOccupied(session, train, train.segmentIndex)) {
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
  const [from, to] = [
    currentTrain.route[segmentIndex % currentTrain.route.length],
    currentTrain.route[(segmentIndex + 1) % currentTrain.route.length]
  ].sort();
  return getVisibleTrains(session).some((train) => {
    if (train.id === currentTrain.id || train.status !== "EN_ROUTE") return false;
    const [otherFrom, otherTo] = [getTrainOrigin(train), getTrainTarget(train)].sort();
    return from === otherFrom && to === otherTo;
  });
}

function maybeUpdateIncident(session) {
  const critical = session.stations.reduce((highest, station) => (station.queue > highest.queue ? station : highest));
  const existing = session.incidents.find((incident) => incident.id === "crowding");
  if (critical.queue >= critical.capacity && !existing) {
    session.incidents.push({ id: "crowding", stationId: critical.id, severity: "warning", startedAt: session.time });
    pushLog(session, `Alerta: fila elevada em ${critical.name}. Reforço de oferta recomendado.`, "warning");
  }
  if (existing && critical.queue < critical.capacity * 0.78) {
    session.incidents = session.incidents.filter((incident) => incident.id !== "crowding");
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
