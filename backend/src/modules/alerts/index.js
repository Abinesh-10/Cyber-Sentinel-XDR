import { AlertRepository } from "../../database/repositories/AlertRepository.js";
import { AttackRepository } from "../../database/repositories/AttackRepository.js";
import { AuditRepository } from "../../database/repositories/AuditRepository.js";
import { NodeRepository } from "../../database/repositories/NodeRepository.js";
import { ThreatScoreRepository } from "../../database/repositories/ThreatScoreRepository.js";
import { AlertEventBus } from "./services/AlertEventBus.js";
import { AlertService } from "./services/AlertService.js";

export function createAlertModule({ db }) {
  const eventBus = new AlertEventBus();
  const alertRepository = new AlertRepository(db);
  const threatScoreRepository = new ThreatScoreRepository(db);
  const attackRepository = new AttackRepository(db);
  const nodeRepository = new NodeRepository(db);
  const auditRepository = new AuditRepository(db);

  const alertService = new AlertService({
    alertRepository,
    threatScoreRepository,
    attackRepository,
    nodeRepository,
    auditRepository,
    eventBus,
  });

  return {
    eventBus,
    services: {
      alertService,
    },
    repositories: {
      alertRepository,
      threatScoreRepository,
      attackRepository,
      nodeRepository,
      auditRepository,
    },
  };
}
