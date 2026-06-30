import { AuditRepository } from "../../database/repositories/AuditRepository.js";
import { NetworkHealthRepository } from "../../database/repositories/NetworkHealthRepository.js";
import { NodeRepository } from "../../database/repositories/NodeRepository.js";
import { TrafficRepository } from "../../database/repositories/TrafficRepository.js";
import { NetworkEventBus } from "./services/NetworkEventBus.js";
import { NetworkSimulationEngine } from "./services/NetworkSimulationEngine.js";
import { NetworkStateManager } from "./services/NetworkStateManager.js";
import { NodeManager } from "./services/NodeManager.js";
import { TrafficGenerator } from "./services/TrafficGenerator.js";

export function createNetworkModule({ db, config }) {
  const eventBus = new NetworkEventBus();
  const nodeRepository = new NodeRepository(db);
  const trafficRepository = new TrafficRepository(db);
  const healthRepository = new NetworkHealthRepository(db);
  const auditRepository = new AuditRepository(db);

  const nodeManager = new NodeManager({
    nodeRepository,
    trafficRepository,
    healthRepository,
    auditRepository,
    eventBus,
  });

  const trafficGenerator = new TrafficGenerator({
    nodeRepository,
    trafficRepository,
    eventBus,
  });

  const stateManager = new NetworkStateManager({
    nodeRepository,
    trafficRepository,
    healthRepository,
    eventBus,
  });

  const engine = new NetworkSimulationEngine({
    trafficGenerator,
    stateManager,
    eventBus,
    tickMs: config.simulation.tickMs,
    trafficPerTick: config.simulation.trafficPerTick,
  });

  return {
    eventBus,
    services: {
      nodeManager,
      trafficGenerator,
      stateManager,
      engine,
    },
  };
}
