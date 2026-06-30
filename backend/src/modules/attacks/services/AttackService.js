import { badRequest, notFound } from "../../../common/http/errors.js";
import { AttackEvents } from "../events/AttackEvents.js";
import {
  normalizeIntensity,
  severityFromIntensity,
  validateBruteForcePayload,
  validateDdosPayload,
  validateMalwarePayload,
  validatePortScanPayload,
  validateSniffingPayload,
} from "../validators/attackValidators.js";

export class AttackService {
  constructor({ attackRepository, nodeRepository, auditRepository, eventBus, simulationEngine }) {
    this.attackRepository = attackRepository;
    this.nodeRepository = nodeRepository;
    this.auditRepository = auditRepository;
    this.eventBus = eventBus;
    this.simulationEngine = simulationEngine;
  }

  listAttacks(filters = {}) {
    return this.attackRepository.list(filters);
  }

  getAttack(id) {
    const attack = this.attackRepository.getById(id);
    if (!attack) throw notFound("Attack not found");

    return {
      ...attack,
      trafficLogs: this.attackRepository.getTrafficLogs(id),
    };
  }

  simulateDdos(input, context = {}) {
    validateDdosPayload(input);
    return this.runAttack("DDOS", input, context);
  }

  simulatePortScan(input, context = {}) {
    validatePortScanPayload(input);
    return this.runAttack("PORT_SCAN", input, context);
  }

  simulateBruteForce(input, context = {}) {
    validateBruteForcePayload(input);
    return this.runAttack("BRUTE_FORCE", input, context);
  }

  simulatePacketSniffing(input, context = {}) {
    validateSniffingPayload(input);
    return this.runAttack("PACKET_SNIFFING", input, context);
  }

  simulateMalwarePropagation(input, context = {}) {
    validateMalwarePayload(input);
    return this.runAttack("MALWARE_PROPAGATION", input, context);
  }

  runAttack(attackType, input, context) {
    const targetNode = this.resolveTargetNode(attackType, input);
    const intensity = normalizeIntensity(input.intensity, 50);
    const startedAt = new Date().toISOString();
    const initialSeverity = severityFromIntensity(intensity);

    const attack = this.attackRepository.create({
      attackType,
      name: input.name ?? this.defaultAttackName(attackType),
      lifecycleStatus: "RUNNING",
      sourceIp: input.sourceIp ?? null,
      destIp: targetNode.ipAddress,
      sourceNodeId: input.sourceNodeId ?? null,
      targetNodeId: targetNode.id,
      severity: initialSeverity,
      vector: input.vector ?? input.mode ?? input.service ?? input.malwareFamily ?? null,
      intensity,
      startedAt,
      metadata: {
        request: this.safeMetadata(input),
        workflow: "AttackSimulationEngine",
      },
      metrics: {},
      createdBy: context.userId,
    });

    this.eventBus.emitAttackEvent(AttackEvents.ATTACK_STARTED, { attack });

    try {
      const result = this.simulationEngine.execute(attackType, {
        attack,
        input,
        targetNode,
      });

      this.eventBus.emitAttackEvent(AttackEvents.ATTACK_TRAFFIC_GENERATED, {
        attackId: attack.id,
        generatedTrafficLogs: result.logs.length,
        affectedNodeIds: result.affectedNodeIds,
      });

      if (result.affectedNodeIds?.length) {
        this.eventBus.emitAttackEvent(AttackEvents.ATTACK_NODE_IMPACTED, {
          attackId: attack.id,
          affectedNodeIds: result.affectedNodeIds,
        });
      }

      const completed = this.attackRepository.updateLifecycle(attack.id, {
        lifecycleStatus: "COMPLETED",
        severity: result.severity,
        endedAt: new Date().toISOString(),
        metadata: {
          ...attack.metadata,
          affectedNodeIds: result.affectedNodeIds,
        },
        metrics: result.metrics,
      });

      this.audit("ATTACK_SIMULATION_COMPLETED", completed.id, null, completed, context);
      this.eventBus.emitAttackEvent(AttackEvents.ATTACK_COMPLETED, {
        attack: completed,
        metrics: result.metrics,
      });

      return {
        attack: completed,
        generatedTrafficLogs: result.logs.length,
        affectedNodeIds: result.affectedNodeIds,
        metrics: result.metrics,
        trafficSample: result.logs.slice(0, 10),
      };
    } catch (error) {
      const failed = this.attackRepository.updateLifecycle(attack.id, {
        lifecycleStatus: "FAILED",
        severity: initialSeverity,
        endedAt: new Date().toISOString(),
        metadata: {
          ...attack.metadata,
          failure: error.message,
        },
        metrics: {},
      });

      this.audit("ATTACK_SIMULATION_FAILED", failed.id, null, failed, {
        ...context,
        outcome: "FAILURE",
        metadata: { error: error.message },
      });
      this.eventBus.emitAttackEvent(AttackEvents.ATTACK_FAILED, {
        attack: failed,
        error: error.message,
      });

      throw error;
    }
  }

  resolveTargetNode(attackType, input) {
    const nodeId = attackType === "MALWARE_PROPAGATION" ? input.seedNodeId : input.targetNodeId;
    const node = nodeId
      ? this.nodeRepository.getById(nodeId)
      : input.destIp
        ? this.nodeRepository.getByIp(input.destIp)
        : null;

    if (!node) {
      throw badRequest("Target node was not found in the virtual network");
    }

    if (node.status === "OFFLINE") {
      throw badRequest("Target node is offline and cannot be used for attack simulation");
    }

    return node;
  }

  defaultAttackName(attackType) {
    const names = {
      DDOS: "DDoS Flood Simulation",
      PORT_SCAN: "Port Scan Simulation",
      BRUTE_FORCE: "Brute Force Simulation",
      PACKET_SNIFFING: "Packet Sniffing Simulation",
      MALWARE_PROPAGATION: "Malware Propagation Simulation",
    };

    return names[attackType] ?? "Attack Simulation";
  }

  safeMetadata(input) {
    const metadata = { ...input };
    delete metadata.passwords;
    delete metadata.credentials;
    return metadata;
  }

  audit(action, entityId, before, after, context) {
    this.auditRepository.record({
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
      action,
      entityType: "ATTACK",
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
