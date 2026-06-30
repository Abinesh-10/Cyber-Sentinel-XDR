import { normalizeIntensity, severityFromIntensity } from "../../validators/attackValidators.js";
import {
  clampInt,
  commonTrafficFields,
  pickRandom,
  randomEphemeralPort,
  randomExternalIp,
  randomInt,
  sumTraffic,
} from "./SimulationHelpers.js";

export class PacketSniffingAttackSimulator {
  constructor({ nodeRepository, trafficRepository }) {
    this.nodeRepository = nodeRepository;
    this.trafficRepository = trafficRepository;
  }

  run({ attack, input, targetNode }) {
    const intensity = normalizeIntensity(input.intensity, 45);
    const sampleSize = clampInt(input.sampleSize, Math.ceil(intensity * 2), 10, 1000);
    const recentTraffic = this.trafficRepository.listRecent(sampleSize * 2);
    const relevantTraffic = recentTraffic.filter(
      (log) => log.sourceNodeId === targetNode.id || log.destNodeId === targetNode.id,
    );
    const sourceLogs = relevantTraffic.length
      ? relevantTraffic.slice(0, sampleSize)
      : this.syntheticObservedTraffic(targetNode, sampleSize);

    const logs = sourceLogs.map((log, index) => ({
      ...commonTrafficFields(attack.id, {
        attackType: "PACKET_SNIFFING",
        intercepted: true,
        monitoredLogId: log.id ?? null,
        sequence: index + 1,
      }),
      sourceIp: log.sourceIp,
      destIp: log.destIp,
      sourceNodeId: log.sourceNodeId,
      destNodeId: log.destNodeId,
      protocol: log.protocol,
      srcPort: log.srcPort,
      dstPort: log.dstPort,
      bytesIn: log.bytesIn,
      bytesOut: log.bytesOut,
      packets: log.packets,
      direction: log.direction,
      status: "MIRRORED",
      flags: "INTERCEPTED",
    }));

    const inserted = this.trafficRepository.bulkInsert(logs);
    const totals = sumTraffic(inserted);

    return {
      severity: severityFromIntensity(intensity),
      affectedNodeIds: [targetNode.id],
      logs: inserted,
      metrics: {
        targetNodeId: targetNode.id,
        targetIp: targetNode.ipAddress,
        packetInterception: true,
        trafficMonitoring: true,
        observedTrafficSource: relevantTraffic.length ? "RECENT_TRAFFIC" : "SYNTHETIC_TRAFFIC",
        monitoredFlows: sourceLogs.length,
        interceptedPackets: totals.packets,
        interceptedBytes: totals.bytes,
        generatedTrafficLogs: inserted.length,
      },
    };
  }

  syntheticObservedTraffic(targetNode, count) {
    const nodes = this.nodeRepository.list().filter((node) => node.id !== targetNode.id);
    const protocols = ["HTTPS", "DNS", "SSH", "SMB", "MQTT"];

    return Array.from({ length: count }, () => {
      const peer = nodes.length ? pickRandom(nodes) : null;
      const inbound = Math.random() > 0.5;

      return {
        sourceIp: inbound ? randomExternalIp() : targetNode.ipAddress,
        destIp: inbound ? targetNode.ipAddress : (peer?.ipAddress ?? randomExternalIp()),
        sourceNodeId: inbound ? null : targetNode.id,
        destNodeId: inbound ? targetNode.id : (peer?.id ?? null),
        protocol: pickRandom(protocols),
        srcPort: randomEphemeralPort(),
        dstPort: randomInt(22, 8443),
        bytesIn: randomInt(300, 9000),
        bytesOut: randomInt(300, 9000),
        packets: randomInt(3, 80),
        direction: inbound ? "INBOUND" : peer ? "INTERNAL" : "OUTBOUND",
      };
    });
  }
}
