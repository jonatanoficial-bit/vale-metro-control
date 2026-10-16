import test from "node:test";
import assert from "node:assert/strict";
import { applyCommand, createInitialSession, getVisibleTrains, normalizeSession, tickSession } from "../src/simulation.js";

test("o trem reserva desconta o custo uma única vez e entra em despacho", () => {
  const session = createInitialSession();
  const initialBalance = session.balanceCents;
  const first = applyCommand(session, { id: "reserve-1", type: "DISPATCH_RESERVE" });
  const second = applyCommand(session, { id: "reserve-2", type: "DISPATCH_RESERVE" });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.equal(session.balanceCents, initialBalance - 480000);
  assert.equal(session.reserve.status, "DISPATCHING");
});

test("o trem reserva conclui o despacho após o tempo calculado", () => {
  const session = createInitialSession();
  applyCommand(session, { id: "reserve-1", type: "DISPATCH_RESERVE" });
  tickSession(session, 24);
  assert.equal(session.reserve.status, "DWELLING");
  assert.equal(session.reserve.visible, true);
});

test("uma ordem de retenção altera o estado do trem no próximo ponto", () => {
  const session = createInitialSession();
  const result = applyCommand(session, { id: "hold-1", type: "HOLD_TRAIN", trainId: "VM-101" });
  assert.equal(result.accepted, true);
  tickSession(session, 60);
  const train = getVisibleTrains(session).find((item) => item.id === "VM-101");
  assert.equal(train.status, "HELD");
  assert.equal(session.missions.hold, true);
});

test("a simulação é determinística para a mesma sequência de comandos", () => {
  const a = createInitialSession();
  const b = createInitialSession();
  tickSession(a, 40);
  tickSession(b, 40);
  assert.deepEqual(a.metrics, b.metrics);
  assert.deepEqual(a.stations.map((station) => station.queue), b.stations.map((station) => station.queue));
});

test("uma falha leve exige manutenção e só é encerrada após o tempo de resposta", () => {
  const session = createInitialSession();
  tickSession(session, 180);
  const incident = session.incidents.find((item) => item.id === "door-fault");
  assert.equal(incident.status, "active");
  assert.equal(session.trains.find((train) => train.id === "VM-103").faultActive, true);
  const result = applyCommand(session, { id: "maintenance-1", type: "ASSIGN_MAINTENANCE", incidentId: "door-fault" });
  assert.equal(result.accepted, true);
  assert.equal(incident.status, "responding");
  tickSession(session, 16);
  assert.equal(incident.status, "resolved");
  assert.equal(session.missions.maintenance, true);
  assert.equal(session.staff.maintenanceAvailable, 1);
});

test("manutenção não pode ser mobilizada duas vezes para a mesma ocorrência", () => {
  const session = createInitialSession();
  tickSession(session, 180);
  const first = applyCommand(session, { id: "maintenance-1", type: "ASSIGN_MAINTENANCE", incidentId: "door-fault" });
  const second = applyCommand(session, { id: "maintenance-2", type: "ASSIGN_MAINTENANCE", incidentId: "door-fault" });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
});

test("uma falha de sinal bloqueia o corredor até o isolamento ser concluído", () => {
  const session = createInitialSession();
  tickSession(session, 360);
  const incident = session.incidents.find((item) => item.id === "signal-fault");
  assert.equal(incident.status, "active");
  assert.deepEqual(session.network.blockedSegments, ["central:riverside"]);
  const result = applyCommand(session, { id: "signal-1", type: "ISOLATE_SIGNAL", incidentId: "signal-fault" });
  assert.equal(result.accepted, true);
  tickSession(session, 22);
  assert.equal(incident.status, "resolved");
  assert.deepEqual(session.network.blockedSegments, []);
  assert.equal(session.missions.signal, true);
  assert.equal(session.staff.signalAvailable, 1);
});

test("o plano de passageiros reduz filas e não pode ser duplicado", () => {
  const session = createInitialSession();
  tickSession(session, 360);
  const before = session.stations.find((station) => station.id === "central").queue
    + session.stations.find((station) => station.id === "riverside").queue;
  const first = applyCommand(session, { id: "passengers-1", type: "DIRECT_PASSENGERS", incidentId: "signal-fault" });
  const second = applyCommand(session, { id: "passengers-2", type: "DIRECT_PASSENGERS", incidentId: "signal-fault" });
  const after = session.stations.find((station) => station.id === "central").queue
    + session.stations.find((station) => station.id === "riverside").queue;
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.ok(after < before);
  assert.equal(session.missions.passengers, true);
});

test("a expansão de Riverside consome orçamento e aumenta a capacidade ao fim da obra", () => {
  const session = createInitialSession();
  const project = session.projects.riversideExpansion;
  const riverside = session.stations.find((station) => station.id === "riverside");
  const capacityBefore = riverside.capacity;
  const balanceBefore = session.balanceCents;
  const result = applyCommand(session, { id: "expansion-1", type: "APPROVE_EXPANSION", projectId: project.id });
  assert.equal(result.accepted, true);
  assert.equal(session.projects.riversideExpansion.status, "building");
  assert.equal(session.balanceCents, balanceBefore - project.costCents);
  tickSession(session, 64);
  assert.equal(session.projects.riversideExpansion.status, "complete");
  assert.equal(riverside.capacity, capacityBefore + project.capacityGain);
  assert.equal(session.missions.expansion, true);
});

test("não é possível aprovar a mesma expansão duas vezes", () => {
  const session = createInitialSession();
  const project = session.projects.riversideExpansion;
  const first = applyCommand(session, { id: "expansion-1", type: "APPROVE_EXPANSION", projectId: project.id });
  const second = applyCommand(session, { id: "expansion-2", type: "APPROVE_EXPANSION", projectId: project.id });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
});

test("cada cidade inicia uma rede de carreira com parâmetros próprios", () => {
  const vale = createInitialSession("career", "vale-central");
  const porto = createInitialSession("career", "porto-dourado");
  const serra = createInitialSession("career", "serra-clara");
  assert.equal(porto.city, "Porto Dourado");
  assert.equal(porto.lineName, "Linha da Marina");
  assert.equal(porto.stations.find((station) => station.id === "riverside").name, "Distrito do Porto");
  assert.ok(porto.stations.find((station) => station.id === "riverside").demand > vale.stations.find((station) => station.id === "riverside").demand);
  assert.ok(serra.balanceCents < vale.balanceCents);
  assert.equal(porto.career.day, 1);
});

test("um turno de carreira pode ser avaliado e progride o perfil da cidade", () => {
  const session = createInitialSession("career", "serra-clara");
  tickSession(session, 300);
  const result = applyCommand(session, { id: "complete-1", type: "COMPLETE_TURN" });
  assert.equal(result.accepted, true);
  assert.equal(session.turn.status, "complete");
  assert.ok(["A", "B", "C", "D"].includes(session.turn.summary.grade));
  assert.equal(session.career.completedTurns, 1);
  assert.equal(session.career.balanceCents, session.balanceCents);
  assert.equal(session.timeScale, 0);
});

test("uma expansão entregue permanece disponível nos próximos dias da carreira", () => {
  const session = createInitialSession("career", "vale-central");
  const project = session.projects.riversideExpansion;
  applyCommand(session, { id: "expansion-1", type: "APPROVE_EXPANSION", projectId: project.id });
  tickSession(session, 300);
  applyCommand(session, { id: "complete-1", type: "COMPLETE_TURN" });

  const nextDay = createInitialSession("career", "vale-central", {
    ...session.career,
    day: session.career.day + 1
  });
  const expandedStation = nextDay.stations.find((station) => station.id === "riverside");

  assert.equal(nextDay.projects.riversideExpansion.status, "complete");
  assert.equal(expandedStation.capacity, 135 + project.capacityGain);
});

test("a linha complementar entra em operação como uma segunda rota", () => {
  const session = createInitialSession("career", "vale-central");
  const initialBalance = session.balanceCents;
  const result = applyCommand(session, { id: "support-1", type: "ACTIVATE_SUPPORT_LINE" });

  assert.equal(result.accepted, true);
  assert.equal(session.supportTrain.status, "DISPATCHING");
  assert.equal(session.network.supportLineStatus, "activating");
  assert.equal(session.balanceCents, initialBalance - 680000);
  tickSession(session, 20);
  assert.equal(session.supportTrain.status, "DWELLING");
  assert.equal(session.network.supportLineStatus, "operating");
  assert.equal(session.metrics.activeLines, 2);
});

test("a manutenção preventiva recupera a condição e devolve a equipe", () => {
  const session = createInitialSession("career", "vale-central");
  const train = session.trains.find((item) => item.id === "VM-102");
  const result = applyCommand(session, { id: "preventive-1", type: "SCHEDULE_PREVENTIVE_MAINTENANCE", trainId: train.id });

  assert.equal(result.accepted, true);
  assert.equal(train.status, "MAINTENANCE");
  assert.equal(session.staff.maintenanceAvailable, 0);
  tickSession(session, 26);
  assert.equal(train.condition, 98);
  assert.equal(train.status, "DWELLING");
  assert.equal(session.staff.maintenanceAvailable, 1);
  assert.equal(session.missions.preventiveMaintenance, true);
});

test("políticas estratégicas alteram custo, tarifa e reforço temporário", () => {
  const session = createInitialSession("career", "porto-dourado");
  const balanceBefore = session.balanceCents;
  const energy = applyCommand(session, { id: "energy-1", type: "ACTIVATE_GREEN_ENERGY" });
  const fare = applyCommand(session, { id: "fare-1", type: "SET_SOCIAL_FARE" });
  const peak = applyCommand(session, { id: "peak-1", type: "ACTIVATE_PEAK_SERVICE" });

  assert.equal(energy.accepted, true);
  assert.equal(fare.accepted, true);
  assert.equal(peak.accepted, true);
  assert.equal(session.policies.greenEnergy, true);
  assert.equal(session.policies.farePlan, "social");
  assert.equal(session.policies.peakBoostRemaining, 150);
  assert.equal(session.balanceCents, balanceBefore - 840000 - 360000);
  tickSession(session, 150);
  assert.equal(session.policies.peakBoostRemaining, 0);
});

test("saves anteriores recebem o indicador de linhas ativas ao serem retomados", () => {
  const legacySession = createInitialSession("career", "vale-central");
  delete legacySession.metrics.activeLines;
  const resumed = normalizeSession(legacySession);

  assert.equal(resumed.metrics.activeLines, 1);
});

test("o contrato municipal de linha complementar recompensa a carreira ao concluir o turno", () => {
  const session = createInitialSession("career", "vale-central", {
    campaignState: { chapterIndex: 1, completedContracts: [] }
  });
  const initialBalance = session.balanceCents;
  applyCommand(session, { id: "support-contract", type: "ACTIVATE_SUPPORT_LINE" });
  tickSession(session, 300);
  const result = applyCommand(session, { id: "complete-contract", type: "COMPLETE_TURN" });

  assert.equal(result.accepted, true);
  assert.equal(result.summary.contract.completed, true);
  assert.equal(result.summary.contract.title, "Conexão Horizonte");
  assert.equal(session.career.campaignState.chapterIndex, 2);
  assert.ok(session.balanceCents > initialBalance - 680000);
});

test("a equipe de estação reduz a fila e retorna à base após o reforço", () => {
  const session = createInitialSession("career", "serra-clara", {
    campaignState: { chapterIndex: 1, completedContracts: [] }
  });
  const station = session.stations.find((item) => item.id === "central");
  const queueBefore = station.queue;
  const result = applyCommand(session, { id: "station-team", type: "DEPLOY_STATION_TEAM", stationId: station.id });

  assert.equal(result.accepted, true);
  assert.ok(station.queue < queueBefore);
  assert.equal(session.staff.stationTeams, 1);
  assert.equal(session.teamSupport.stationId, station.id);
  assert.equal(session.missions.stationTeam, true);
  tickSession(session, 90);
  assert.equal(session.teamSupport.remaining, 0);
  assert.equal(session.staff.stationTeams, 2);
});

test("saves anteriores recebem o cenário e o contrato atual da campanha", () => {
  const legacySession = createInitialSession("career", "porto-dourado");
  delete legacySession.campaign;
  const resumed = normalizeSession(legacySession);

  assert.equal(resumed.campaign.title, "Janela portuária");
  assert.equal(resumed.campaign.contract.status, "active");
});

test("cada cidade aplica seu traçado operacional ao iniciar e retomar a carreira", () => {
  const vale = createInitialSession("career", "vale-central");
  const porto = createInitialSession("career", "porto-dourado");
  const legacy = createInitialSession("career", "serra-clara");
  legacy.stations.find((station) => station.id === "central").x = 0;
  const resumed = normalizeSession(legacy);

  assert.notEqual(vale.stations.find((station) => station.id === "central").x, porto.stations.find((station) => station.id === "central").x);
  assert.equal(resumed.stations.find((station) => station.id === "central").x, 0.48);
});

test("a orientação de Camila guia leitura da rede e recompensa a manutenção do VM-102", () => {
  const session = createInitialSession("career", "vale-central");
  const initialXp = session.xp;
  session.tutorial.status = "active";
  session.tutorial.step = 1;

  const observed = applyCommand(session, { id: "tutorial-observe", type: "OBSERVE_NETWORK" });
  assert.equal(observed.accepted, true);
  assert.equal(session.tutorial.step, 2);

  const maintained = applyCommand(session, { id: "tutorial-maintenance", type: "SCHEDULE_PREVENTIVE_MAINTENANCE", trainId: "VM-102" });
  assert.equal(maintained.accepted, true);
  assert.equal(session.tutorial.status, "complete");
  assert.equal(session.career.tutorialCompleted, true);
  assert.equal(session.xp, initialXp + 5 + 18 + 25);
});

test("carreira que concluiu a orientação não recebe a introdução novamente", () => {
  const session = createInitialSession("career", "vale-central", { tutorialCompleted: true });
  assert.equal(session.tutorial.status, "acknowledged");
  assert.equal(session.tutorial.rewardGranted, true);
});

test("o canal de despacho registra consulta e retorno do condutor", () => {
  const session = createInitialSession();
  const initialMessages = session.dispatch.messages.length;
  const result = applyCommand(session, { id: "status-vm101", type: "REQUEST_STATUS_UPDATE", trainId: "VM-101" });

  assert.equal(result.accepted, true);
  assert.equal(session.dispatch.messages.length, initialMessages + 1);
  assert.equal(session.dispatch.messages[0].direction, "outgoing");
  tickSession(session, 2);
  assert.equal(session.dispatch.messages[0].from, "VM-101");
  assert.equal(session.dispatch.messages[0].direction, "incoming");
});

test("autorização de via exige confirmação antes da prioridade de recuperação", () => {
  const session = createInitialSession();
  const train = session.trains.find((item) => item.id === "VM-103");
  const premature = applyCommand(session, { id: "priority-early", type: "SET_DISPATCH_PRIORITY", trainId: train.id });
  const requested = applyCommand(session, { id: "route-vm103", type: "REQUEST_ROUTE_AUTHORIZATION", trainId: train.id });

  assert.equal(premature.accepted, false);
  assert.equal(requested.accepted, true);
  assert.equal(train.dispatch.routeStatus, "awaiting-confirmation");
  tickSession(session, 4);
  assert.equal(train.dispatch.routeStatus, "authorized");
  const priority = applyCommand(session, { id: "priority-vm103", type: "SET_DISPATCH_PRIORITY", trainId: train.id });
  assert.equal(priority.accepted, true);
  assert.equal(train.dispatch.priority, "recovery");
  assert.equal(session.missions.routeAuthorization, true);
  assert.equal(session.missions.dispatchPriority, true);
});

test("saves anteriores recebem estado de despacho e mensagens iniciais", () => {
  const legacy = createInitialSession();
  delete legacy.dispatch;
  delete legacy.trains[0].dispatch;
  const resumed = normalizeSession(legacy);

  assert.ok(resumed.dispatch.messages.length > 0);
  assert.equal(resumed.trains[0].dispatch.routeStatus, "not-requested");
});

test("nível de carreira desbloqueia especialização de despacho com efeito operacional", () => {
  const session = createInitialSession("career", "vale-central", { totalXp: 75 });
  const train = session.trains.find((item) => item.id === "VM-103");
  const chosen = applyCommand(session, { id: "choose-dispatch", type: "SELECT_SPECIALIZATION", specializationId: "dispatch" });
  const requested = applyCommand(session, { id: "route-specialist", type: "REQUEST_ROUTE_AUTHORIZATION", trainId: train.id });

  assert.equal(session.career.operator.level, 2);
  assert.equal(chosen.accepted, true);
  assert.equal(session.career.operator.specialization, "dispatch");
  assert.equal(requested.accepted, true);
  assert.equal(train.dispatch.acknowledgementRemaining, 3);
  tickSession(session, 3);
  assert.equal(train.dispatch.routeStatus, "authorized");
  const priority = applyCommand(session, { id: "priority-specialist", type: "SET_DISPATCH_PRIORITY", trainId: train.id });
  assert.equal(priority.accepted, true);
  assert.equal(train.dispatch.priorityRemaining, 95);
});

test("especialização de frota reduz custo, melhora a condição e avança a meta semanal", () => {
  const session = createInitialSession("career", "vale-central", { totalXp: 75 });
  const train = session.trains.find((item) => item.id === "VM-102");
  const initialBalance = session.balanceCents;
  applyCommand(session, { id: "choose-fleet", type: "SELECT_SPECIALIZATION", specializationId: "fleet" });
  const maintenance = applyCommand(session, { id: "fleet-maintenance", type: "SCHEDULE_PREVENTIVE_MAINTENANCE", trainId: train.id });

  assert.equal(maintenance.accepted, true);
  assert.equal(initialBalance - session.balanceCents, 1_650_00);
  assert.equal(session.career.weekly.goals.find((goal) => goal.id === "fleet-ready").progress, 1);
  tickSession(session, 26);
  assert.equal(train.condition, 100);
});

test("saves anteriores recebem nível e metas semanais da carreira", () => {
  const legacy = createInitialSession("career", "vale-central", { totalXp: 210, day: 6 });
  delete legacy.career.operator;
  delete legacy.career.weekly;
  const resumed = normalizeSession(legacy);

  assert.equal(resumed.career.operator.level, 3);
  assert.equal(resumed.career.weekly.week, 2);
  assert.equal(resumed.career.weekly.goals.length, 3);
});
