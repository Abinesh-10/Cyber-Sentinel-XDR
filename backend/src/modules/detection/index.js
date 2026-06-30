import { AttackRepository } from "../../database/repositories/AttackRepository.js";
import { AuditRepository } from "../../database/repositories/AuditRepository.js";
import { NodeRepository } from "../../database/repositories/NodeRepository.js";
import { ThreatScoreRepository } from "../../database/repositories/ThreatScoreRepository.js";
import { DetectionEventBus } from "./services/DetectionEventBus.js";
import { DetectionRuleEngine } from "./services/DetectionRuleEngine.js";
import { DetectionService } from "./services/DetectionService.js";

export function createDetectionModule({ db }) {
  const eventBus = new DetectionEventBus();
  const attackRepository = new AttackRepository(db);
  const nodeRepository = new NodeRepository(db);
  const threatScoreRepository = new ThreatScoreRepository(db);
  const auditRepository = new AuditRepository(db);

  const ruleEngine = new DetectionRuleEngine({
    nodeRepository,
  });

  const detectionService = new DetectionService({
    attackRepository,
    nodeRepository,
    threatScoreRepository,
    auditRepository,
    eventBus,
    ruleEngine,
  });

  return {
    eventBus,
    services: {
      detectionService,
      ruleEngine,
    },
    repositories: {
      attackRepository,
      nodeRepository,
      threatScoreRepository,
      auditRepository,
    },
  };
}
