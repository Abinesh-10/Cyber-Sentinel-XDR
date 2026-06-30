import { randomEphemeralPort, randomExternalIp, randomInt } from "../../../common/utils/ip.js";
import { NetworkEvents } from "../events/NetworkEvents.js";

const PROTOCOLS = [
  { name: "HTTP", port: 80 },
  { name: "HTTPS", port: 443 },
  { name: "DNS", port: 53 },
  { name: "SSH", port: 22 },
  { name: "SMB", port: 445 },
  { name: "MQTT", port: 1883 },
  { name: "ICMP", port: null },
];

export class TrafficGenerator {
  constructor({ nodeRepository, trafficRepository, eventBus }) {
    this.nodeRepository = nodeRepository;
    this.trafficRepository = trafficRepository;
    this.eventBus = eventBus;
  }

  generateRandomTraffic(count = 25) {
    const nodes = this.nodeRepository
      .list()
      .filter((node) => node.status === "ONLINE" || node.status === "DEGRADED");

    if (nodes.length === 0) {
      return {
        generated: 0,
        logs: [],
        stats: this.trafficRepository.getStats(),
      };
    }

    const logs = Array.from({ length: count }, () => this.buildRandomTrafficLog(nodes));
    const inserted = this.trafficRepository.bulkInsert(logs);
    this.applyRuntimeEffects(inserted);

    const stats = this.trafficRepository.getStats();
    const event = this.eventBus.emitNetworkEvent(NetworkEvents.TRAFFIC_GENERATED, {
      generated: inserted.length,
      stats,
      sample: inserted.slice(0, 5),
    });

    return {
      generated: inserted.length,
      logs: inserted,
      stats,
      event,
    };
  }

  buildRandomTrafficLog(nodes) {
    const direction = this.pickDirection(nodes.length);
    const protocol = PROTOCOLS[randomInt(0, PROTOCOLS.length - 1)];
    const packets = randomInt(1, 140);
    const bytes = packets * randomInt(64, 1500);

    if (direction === "INBOUND") {
      const target = this.pickNode(nodes);
      return {
        sourceIp: randomExternalIp(),
        destIp: target.ipAddress,
        sourceNodeId: null,
        destNodeId: target.id,
        protocol: protocol.name,
        srcPort: randomEphemeralPort(),
        dstPort: protocol.port,
        bytesIn: bytes,
        bytesOut: randomInt(64, 2048),
        packets,
        direction,
        metadata: { generatedBy: "NetworkSimulationEngine" },
      };
    }

    if (direction === "OUTBOUND") {
      const source = this.pickNode(nodes);
      return {
        sourceIp: source.ipAddress,
        destIp: randomExternalIp(),
        sourceNodeId: source.id,
        destNodeId: null,
        protocol: protocol.name,
        srcPort: randomEphemeralPort(),
        dstPort: protocol.port,
        bytesIn: randomInt(64, 2048),
        bytesOut: bytes,
        packets,
        direction,
        metadata: { generatedBy: "NetworkSimulationEngine" },
      };
    }

    const source = this.pickNode(nodes);
    const target = this.pickDifferentNode(nodes, source.id);

    return {
      sourceIp: source.ipAddress,
      destIp: target.ipAddress,
      sourceNodeId: source.id,
      destNodeId: target.id,
      protocol: protocol.name,
      srcPort: randomEphemeralPort(),
      dstPort: protocol.port,
      bytesIn: Math.floor(bytes / 2),
      bytesOut: Math.ceil(bytes / 2),
      packets,
      direction,
      metadata: { generatedBy: "NetworkSimulationEngine" },
    };
  }

  applyRuntimeEffects(logs) {
    const byNode = new Map();

    for (const log of logs) {
      for (const nodeId of [log.sourceNodeId, log.destNodeId].filter(Boolean)) {
        const current = byNode.get(nodeId) ?? { bytes: 0, sessions: 0 };
        current.bytes += log.bytesIn + log.bytesOut;
        current.sessions += 1;
        byNode.set(nodeId, current);
      }
    }

    for (const [nodeId, metrics] of byNode.entries()) {
      this.nodeRepository.updateRuntimeMetrics(nodeId, {
        uptimeIncrementSeconds: 1,
        throughputBps: metrics.bytes * 8,
        activeSessions: metrics.sessions,
      });
    }
  }

  pickDirection(nodeCount) {
    if (nodeCount < 2) {
      return Math.random() > 0.5 ? "INBOUND" : "OUTBOUND";
    }

    const roll = Math.random();
    if (roll < 0.4) return "INBOUND";
    if (roll < 0.8) return "OUTBOUND";
    return "INTERNAL";
  }

  pickNode(nodes) {
    return nodes[randomInt(0, nodes.length - 1)];
  }

  pickDifferentNode(nodes, sourceId) {
    const candidates = nodes.filter((node) => node.id !== sourceId);
    return candidates.length ? this.pickNode(candidates) : this.pickNode(nodes);
  }
}
