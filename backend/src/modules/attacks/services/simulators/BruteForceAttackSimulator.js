import { normalizeIntensity, severityFromIntensity } from "../../validators/attackValidators.js";
import {
  clampInt,
  commonTrafficFields,
  portForService,
  randomEphemeralPort,
  randomExternalIp,
  randomInt,
  sumTraffic,
} from "./SimulationHelpers.js";

export class BruteForceAttackSimulator {
  constructor({ trafficRepository }) {
    this.trafficRepository = trafficRepository;
  }

  run({ attack, input, targetNode }) {
    const intensity = normalizeIntensity(input.intensity, 65);
    const service = input.service ?? "SSH";
    const attempts = clampInt(input.attempts, intensity * 10, 20, 5000);
    const sourceIp = input.sourceIp ?? randomExternalIp();
    const successRate = Math.max(0, Math.min(1, Number(input.successRate ?? 0.015)));
    let successes = 0;
    let failures = 0;

    const logs = Array.from({ length: attempts }, (_, index) => {
      const success = Math.random() < successRate;
      successes += success ? 1 : 0;
      failures += success ? 0 : 1;

      return {
        ...commonTrafficFields(attack.id, {
          attackType: "BRUTE_FORCE",
          service,
          attempt: index + 1,
          outcome: success ? "SUCCESS" : "FAILURE",
        }),
        sourceIp,
        destIp: targetNode.ipAddress,
        sourceNodeId: null,
        destNodeId: targetNode.id,
        protocol: service,
        srcPort: randomEphemeralPort(),
        dstPort: portForService(service),
        bytesIn: randomInt(180, 900),
        bytesOut: success ? randomInt(700, 2400) : randomInt(120, 480),
        packets: randomInt(3, 12),
        direction: "INBOUND",
        flags: success ? "AUTH_SUCCESS" : "AUTH_FAILURE",
      };
    });

    const inserted = this.trafficRepository.bulkInsert(logs);
    const totals = sumTraffic(inserted);

    return {
      severity: successes > 0 ? "CRITICAL" : severityFromIntensity(intensity),
      affectedNodeIds: [targetNode.id],
      logs: inserted,
      metrics: {
        targetNodeId: targetNode.id,
        targetIp: targetNode.ipAddress,
        sourceIp,
        service,
        attempts,
        successes,
        failures,
        successRate,
        generatedTrafficLogs: inserted.length,
        packets: totals.packets,
        bytes: totals.bytes,
      },
    };
  }
}
