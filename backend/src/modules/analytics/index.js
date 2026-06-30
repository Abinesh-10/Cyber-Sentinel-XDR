import { AlertRepository } from "../../database/repositories/AlertRepository.js";
import { AnalyticsRepository } from "../../database/repositories/AnalyticsRepository.js";
import { AttackRepository } from "../../database/repositories/AttackRepository.js";
import { AuditRepository } from "../../database/repositories/AuditRepository.js";
import { NetworkHealthRepository } from "../../database/repositories/NetworkHealthRepository.js";
import { NodeRepository } from "../../database/repositories/NodeRepository.js";
import { ThreatScoreRepository } from "../../database/repositories/ThreatScoreRepository.js";
import { TrafficRepository } from "../../database/repositories/TrafficRepository.js";
import { AnalyticsEventBus } from "./services/AnalyticsEventBus.js";
import { AnalyticsService } from "./services/AnalyticsService.js";
import { AttackAnalyticsService } from "./services/AttackAnalyticsService.js";
import { DetectionAnalyticsService } from "./services/DetectionAnalyticsService.js";
import { HealthMonitoringService } from "./services/HealthMonitoringService.js";
import { NetworkAnalyticsService } from "./services/NetworkAnalyticsService.js";
import { RiskScoringService } from "./services/RiskScoringService.js";

export function createAnalyticsModule({ db }) {
  const eventBus = new AnalyticsEventBus();

  const analyticsRepository = new AnalyticsRepository(db);
  const auditRepository = new AuditRepository(db);

  // Construct existing repositories to ensure dependent schemas are present.
  const attackRepository = new AttackRepository(db);
  const alertRepository = new AlertRepository(db);
  const threatScoreRepository = new ThreatScoreRepository(db);
  const nodeRepository = new NodeRepository(db);
  const trafficRepository = new TrafficRepository(db);
  const networkHealthRepository = new NetworkHealthRepository(db);

  const attackAnalyticsService = new AttackAnalyticsService({ analyticsRepository });
  const detectionAnalyticsService = new DetectionAnalyticsService({ analyticsRepository });
  const networkAnalyticsService = new NetworkAnalyticsService({ analyticsRepository });
  const riskScoringService = new RiskScoringService({ analyticsRepository });
  const healthMonitoringService = new HealthMonitoringService({ analyticsRepository });

  const analyticsService = new AnalyticsService({
    analyticsRepository,
    attackAnalyticsService,
    detectionAnalyticsService,
    networkAnalyticsService,
    riskScoringService,
    healthMonitoringService,
    auditRepository,
    eventBus,
  });

  return {
    eventBus,
    services: {
      analyticsService,
      attackAnalyticsService,
      detectionAnalyticsService,
      networkAnalyticsService,
      riskScoringService,
      healthMonitoringService,
    },
    repositories: {
      analyticsRepository,
      attackRepository,
      alertRepository,
      threatScoreRepository,
      nodeRepository,
      trafficRepository,
      networkHealthRepository,
      auditRepository,
    },
  };
}
