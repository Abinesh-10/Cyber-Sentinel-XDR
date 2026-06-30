import { normalizeIntensity, severityFromIntensity } from "../../validators/attackValidators.js";
import {
  clampInt,
  commonTrafficFields,
  randomEphemeralPort,
  randomExternalIp,
  randomInt,
  sumTraffic,
} from "./SimulationHelpers.js";

export class PortScanAttackSimulator {
  constructor({ trafficRepository }) {
    this.trafficRepository = trafficRepository;
  }

  run({ attack, input, targetNode }) {
    const intensity = normalizeIntensity(input.intensity, 55);
    const mode = input.mode ?? "SEQUENTIAL";
    const sourceIp = input.sourceIp ?? randomExternalIp();
    const portStart = clampInt(input.portStart, 1, 1, 65535);
    const portEnd = clampInt(input.portEnd, 1024, portStart, 65535);
    const scanCount = clampInt(input.scanCount, Math.ceil(intensity * 4), 10, 2000);
    const ports = this.buildPortSequence({ portStart, portEnd, scanCount, mode });

    const logs = ports.map((port, index) => ({
      ...commonTrafficFields(attack.id, {
        attackType: "PORT_SCAN",
        mode,
        sequence: index + 1,
      }),
      sourceIp,
      destIp: targetNode.ipAddress,
      sourceNodeId: null,
      destNodeId: targetNode.id,
      protocol: "TCP",
      srcPort: randomEphemeralPort(),
      dstPort: port,
      bytesIn: randomInt(40, 96),
      bytesOut: randomInt(0, 160),
      packets: randomInt(1, 3),
      direction: "INBOUND",
      flags: "SYN",
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
        sourceIp,
        mode,
        portStart,
        portEnd,
        scannedPorts: ports,
        generatedTrafficLogs: inserted.length,
        packets: totals.packets,
        bytes: totals.bytes,
      },
    };
  }

  buildPortSequence({ portStart, portEnd, scanCount, mode }) {
    const rangeSize = portEnd - portStart + 1;
    const count = Math.min(scanCount, rangeSize);

    if (mode === "RANDOM") {
      const ports = new Set();
      while (ports.size < count) {
        ports.add(randomInt(portStart, portEnd));
      }
      return [...ports];
    }

    return Array.from({ length: count }, (_, index) => portStart + index);
  }
}
