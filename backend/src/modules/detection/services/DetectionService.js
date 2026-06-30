import { badRequest, notFound } from "../../../common/http/errors.js";
import { DetectionEvents } from "../events/DetectionEvents.js";

const MODEL_VERSION = "sentinel-detection-rules-v1";

export class DetectionService {
  constructor({
    attackRepository,
    nodeRepository,
    threatScoreRepository,
    auditRepository,
    eventBus,
    ruleEngine,
  }) {
    this.attackRepository = attackRepository;
    this.nodeRepository = nodeRepository;
    this.threatScoreRepository = threatScoreRepository;
    this.auditRepository = auditRepository;
    this.eventBus = eventBus;
    this.ruleEngine = ruleEngine;
  }

  detectAttack(attackId, context = {}) {
    const attack = this.attackRepository.getById(attackId);
    if (!attack) throw notFound("Attack not found");

    this.eventBus.emitDetectionEvent(DetectionEvents.DETECTION_STARTED, {
      attackId,
      attackType: attack.attackType,
    });

    try {
      const trafficLogs = this.attackRepository.getTrafficLogs(
        attackId,
        context.trafficLimit ?? 5000,
      );
      const targetNode = this.resolveTargetNode(attack);
      const classification = this.ruleEngine.evaluate({
        attack,
        trafficLogs,
        targetNode,
      });

      this.eventBus.emitDetectionEvent(DetectionEvents.THREAT_CLASSIFIED, {
        attackId,
        attackType: attack.attackType,
        severity: classification.severity,
        score: classification.score,
        riskScore: classification.riskScore,
      });

      const stored = this.storeDetectionResult({
        attack,
        targetNode,
        classification,
        trafficLogs,
      });

      this.audit("THREAT_DETECTION_COMPLETED", stored.id, null, stored, context);
      this.eventBus.emitDetectionEvent(DetectionEvents.DETECTION_STORED, {
        threatScore: stored,
      });

      return {
        attack,
        targetNode,
        threatScore: stored,
        classification,
        trafficLogCount: trafficLogs.length,
      };
    } catch (error) {
      this.eventBus.emitDetectionEvent(DetectionEvents.DETECTION_FAILED, {
        attackId,
        attackType: attack.attackType,
        error: error.message,
      });
      this.audit("THREAT_DETECTION_FAILED", attackId, null, null, {
        ...context,
        outcome: "FAILURE",
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  detectDdos(attackId, context = {}) {
    return this.detectTypedAttack(attackId, "DDOS", context);
  }

  detectPortScan(attackId, context = {}) {
    return this.detectTypedAttack(attackId, "PORT_SCAN", context);
  }

  detectBruteForce(attackId, context = {}) {
    return this.detectTypedAttack(attackId, "BRUTE_FORCE", context);
  }

  detectPacketSniffing(attackId, context = {}) {
    return this.detectTypedAttack(attackId, "PACKET_SNIFFING", context);
  }

  detectMalwarePropagation(attackId, context = {}) {
    return this.detectTypedAttack(attackId, "MALWARE_PROPAGATION", context);
  }

  runSweep(filters = {}, context = {}) {
    const attacks = this.attackRepository.list({
      attackType: filters.attackType,
      lifecycleStatus: filters.lifecycleStatus ?? "COMPLETED",
      targetNodeId: filters.targetNodeId,
      limit: filters.limit ?? 100,
    });

    const results = attacks.map((attack) => this.detectAttack(attack.id, context));

    this.eventBus.emitDetectionEvent(DetectionEvents.SWEEP_COMPLETED, {
      scannedAttackCount: attacks.length,
      storedThreatScoreCount: results.length,
    });

    return {
      scannedAttackCount: attacks.length,
      results,
    };
  }

  listDetectionResults(filters = {}) {
    return this.threatScoreRepository.list(filters);
  }

  getLatestForAttack(attackId) {
    const score = this.threatScoreRepository.getLatestForAttack(attackId);
    if (!score) throw notFound("Detection result not found");
    return score;
  }

  detectTypedAttack(attackId, expectedType, context) {
    const attack = this.attackRepository.getById(attackId);
    if (!attack) throw notFound("Attack not found");
    if (attack.attackType !== expectedType) {
      throw badRequest(`Attack ${attackId} is ${attack.attackType}, not ${expectedType}`);
    }

    return this.detectAttack(attackId, context);
  }

  storeDetectionResult({ attack, targetNode, classification, trafficLogs }) {
    const evidence = classification.evidence ?? {};
    const sourceIps = evidence.sourceIps ?? [
      ...new Set(trafficLogs.map((log) => log.sourceIp).filter(Boolean)),
    ];
    const primarySourceIp = sourceIps[0] ?? attack.sourceIp ?? null;
    const targetNodeId = evidence.targetNodeId ?? targetNode?.id ?? attack.targetNodeId ?? null;
    const targetIp = evidence.targetIp ?? targetNode?.ipAddress ?? attack.destIp ?? null;

    return this.threatScoreRepository.create({
      nodeId: targetNodeId,
      attackId: attack.id,
      score: classification.score,
      riskScore: classification.riskScore,
      severity: classification.severity,
      confidence: classification.confidence,
      modelVersion: MODEL_VERSION,
      factors: {
        attackType: attack.attackType,
        detectionModel: MODEL_VERSION,
        detectedAt: new Date().toISOString(),
        sourceIp: primarySourceIp,
        sourceIps,
        targetNodeId,
        targetNode: targetNode
          ? {
              id: targetNode.id,
              nodeKey: targetNode.nodeKey,
              name: targetNode.name,
              ipAddress: targetNode.ipAddress,
              type: targetNode.type,
            }
          : null,
        targetIp,
        timestamps: {
          attackStartedAt: attack.startedAt,
          attackEndedAt: attack.endedAt,
        },
        evidence,
      },
    });
  }

  resolveTargetNode(attack) {
    if (attack.targetNodeId) {
      return this.nodeRepository.getById(attack.targetNodeId);
    }

    if (attack.destIp) {
      return this.nodeRepository.getByIp(attack.destIp);
    }

    return null;
  }

  audit(action, entityId, before, after, context) {
    this.auditRepository.record({
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
      action,
      entityType: "THREAT_SCORE",
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      outcome: context.outcome ?? "SUCCESS",
      before,
      after,
      metadata: context.metadata ?? {},
    });
  }
}
