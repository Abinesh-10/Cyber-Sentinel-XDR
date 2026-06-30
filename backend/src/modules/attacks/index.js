import { AuditRepository } from "../../database/repositories/AuditRepository.js";
import { AttackRepository } from "../../database/repositories/AttackRepository.js";
import { NodeRepository } from "../../database/repositories/NodeRepository.js";
import { TrafficRepository } from "../../database/repositories/TrafficRepository.js";
import { AttackEventBus } from "./services/AttackEventBus.js";
import { AttackService } from "./services/AttackService.js";
import { AttackSimulationEngine } from "./services/AttackSimulationEngine.js";

export function createAttackModule({ db }) {
  const eventBus = new AttackEventBus();
  const attackRepository = new AttackRepository(db);
  const nodeRepository = new NodeRepository(db);
  const trafficRepository = new TrafficRepository(db);
  const auditRepository = new AuditRepository(db);

  const simulationEngine = new AttackSimulationEngine({
    nodeRepository,
    trafficRepository,
  });

  const attackService = new AttackService({
    attackRepository,
    nodeRepository,
    auditRepository,
    eventBus,
    simulationEngine,
  });

  return {
    eventBus,
    services: {
      attackService,
      simulationEngine,
    },
    repositories: {
      attackRepository,
      nodeRepository,
      trafficRepository,
      auditRepository,
    },
  };
}
