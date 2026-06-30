import { normalizeIntensity, severityFromIntensity } from "../../validators/attackValidators.js";
import {
  buildSourcePool,
  clampInt,
  commonTrafficFields,
  pickRandom,
  randomEphemeralPort,
  randomInt,
  sumTraffic,
} from "./SimulationHelpers.js";

const DDOS_VECTORS = [
  { protocol: "HTTP", port: 80, name: "HTTP_FLOOD" },
  { protocol: "HTTPS", port: 443, name: "TLS_REQUEST_FLOOD" },
  { protocol: "UDP", port: 53, name: "UDP_AMPLIFICATION" },
  { protocol: "TCP", port: 443, name: "SYN_FLOOD" },
];

export class DdosAttackSimulator {
  constructor({ trafficRepository }) {
    this.trafficRepository = trafficRepository;
  }

  run({ attack, input, targetNode }) {
    const intensity = normalizeIntensity(input.intensity, 75);
    const sourceCount = clampInt(input.sourceCount, Math.ceil(intensity / 5), 2, 250);
    const trafficLogCount = clampInt(
      input.trafficLogCount,
      sourceCount * Math.ceil(intensity / 4),
      20,
      2000,
    );
    const sourcePool = buildSourcePool(sourceCount);
    const vector = input.vector ?? "MULTI_VECTOR_FLOOD";

    const logs = Array.from({ length: trafficLogCount }, () => {
      const ddosVector = pickRandom(DDOS_VECTORS);
      const packets = randomInt(300, 2500) * Math.ceil(intensity / 20);
      const bytesIn = packets * randomInt(256, 1500);

      return {
        ...commonTrafficFields(attack.id, {
          attackType: "DDOS",
          vector: ddosVector.name,
          intensity,
        }),
        sourceIp: pickRandom(sourcePool),
        destIp: targetNode.ipAddress,
        sourceNodeId: null,
        destNodeId: targetNode.id,
        protocol: ddosVector.protocol,
        srcPort: randomEphemeralPort(),
        dstPort: ddosVector.port,
        bytesIn,
        bytesOut: randomInt(64, 2048),
        packets,
        direction: "INBOUND",
        flags: ddosVector.protocol === "TCP" ? "SYN" : null,
      };
    });

    const inserted = this.trafficRepository.bulkInsert(logs);
    const totals = sumTraffic(inserted);

    return {
      severity: severityFromIntensity(intensity),
      affectedNodeIds: [targetNode.id],
      logs: inserted,
      metrics: {
        vector,
        targetNodeId: targetNode.id,
        targetIp: targetNode.ipAddress,
        intensity,
        sourceIpCount: sourceCount,
        generatedTrafficLogs: inserted.length,
        floodedPackets: totals.packets,
        floodedBytes: totals.bytes,
        trafficFlooding: true,
      },
    };
  }
}
