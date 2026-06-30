import { badRequest, notFound } from "../../../common/http/errors.js";
import { NetworkEvents } from "../events/NetworkEvents.js";
import { validateCreateNode, validateUpdateNode } from "../validators/networkValidators.js";

export class NodeManager {
  constructor({ nodeRepository, trafficRepository, healthRepository, auditRepository, eventBus }) {
    this.nodeRepository = nodeRepository;
    this.trafficRepository = trafficRepository;
    this.healthRepository = healthRepository;
    this.auditRepository = auditRepository;
    this.eventBus = eventBus;
  }

  listNodes(filters = {}) {
    return this.nodeRepository.list(filters);
  }

  getNode(id) {
    const node = this.nodeRepository.getById(id);
    if (!node) throw notFound("Node not found");

    return {
      ...node,
      latestHealth: this.healthRepository.getLatestForNode(id),
      trafficStats: this.trafficRepository.getStats({ nodeId: id }),
    };
  }

  createNode(input, context = {}) {
    validateCreateNode(input);

    if (this.nodeRepository.getByIp(input.ipAddress)) {
      throw badRequest("A node already exists with this IP address");
    }

    const node = this.nodeRepository.create(input);
    this.healthRepository.insertSnapshot(this.buildNodeHealthSnapshot(node));
    this.recordAudit("NETWORK_NODE_CREATE", node.id, null, node, context);
    this.eventBus.emitNetworkEvent(NetworkEvents.NODE_CREATED, { node });

    return node;
  }

  updateNode(id, input, context = {}) {
    validateUpdateNode(input);

    const before = this.nodeRepository.getById(id);
    if (!before) throw notFound("Node not found");

    const existingIpNode = input.ipAddress ? this.nodeRepository.getByIp(input.ipAddress) : null;
    if (existingIpNode && existingIpNode.id !== id) {
      throw badRequest("A different node already exists with this IP address");
    }

    const node = this.nodeRepository.update(id, input);
    this.healthRepository.insertSnapshot(this.buildNodeHealthSnapshot(node));
    this.recordAudit("NETWORK_NODE_UPDATE", node.id, before, node, context);
    this.eventBus.emitNetworkEvent(NetworkEvents.NODE_UPDATED, { before, node });

    return node;
  }

  deleteNode(id, context = {}) {
    const before = this.nodeRepository.getById(id);
    if (!before) throw notFound("Node not found");

    const deleted = this.nodeRepository.delete(id);
    if (!deleted) throw notFound("Node not found");

    this.recordAudit("NETWORK_NODE_DELETE", id, before, null, context);
    this.eventBus.emitNetworkEvent(NetworkEvents.NODE_DELETED, { nodeId: id, before });

    return { id, deleted: true };
  }

  resetNode(id, context = {}) {
    const before = this.nodeRepository.getById(id);
    if (!before) throw notFound("Node not found");

    const deletedTrafficCount = this.trafficRepository.deleteForNode(id);
    const node = this.nodeRepository.reset(id);
    const health = this.healthRepository.insertSnapshot(this.buildNodeHealthSnapshot(node));

    this.recordAudit("NETWORK_NODE_RESET", id, before, node, {
      ...context,
      metadata: { deletedTrafficCount },
    });
    this.eventBus.emitNetworkEvent(NetworkEvents.NODE_RESET, { node, health, deletedTrafficCount });

    return {
      node,
      deletedTrafficCount,
      health,
    };
  }

  buildNodeHealthSnapshot(node) {
    const score = node.health === "CRIT" ? 25 : node.health === "WARN" ? 70 : 98;

    return {
      nodeId: node.id,
      healthScore: score,
      status: node.health,
      uptimePercent: node.status === "OFFLINE" ? 0 : 99.9,
      throughputBps: node.throughputBps,
      packetLossPct: node.health === "CRIT" ? 12 : node.health === "WARN" ? 2.5 : 0.1,
      latencyMs: node.health === "CRIT" ? 350 : node.health === "WARN" ? 95 : 18,
      activeSessions: node.activeSessions,
      openIncidents: node.health === "CRIT" ? 3 : node.health === "WARN" ? 1 : 0,
      metrics: {
        trafficCount: node.trafficCount,
        riskScore: node.riskScore,
      },
    };
  }

  recordAudit(action, entityId, before, after, context) {
    this.auditRepository.record({
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
      action,
      entityType: "NODE",
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      before,
      after,
      metadata: context.metadata ?? {},
    });
  }
}
