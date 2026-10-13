import test from "node:test";
import assert from "node:assert/strict";
import { applyCommand, createInitialSession, getVisibleTrains, tickSession } from "../src/simulation.js";

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
