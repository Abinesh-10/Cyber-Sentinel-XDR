import {
  consecutiveRatio,
  normalized,
  sourceIpList,
  targetIp,
  targetNodeId,
  trafficTotals,
  uniqueNumbers,
} from "./RuleHelpers.js";

export class PortScanDetectionRule {
  supports(attackType) {
    return attackType === "PORT_SCAN";
  }

  evaluate({ attack, trafficLogs, classifier }) {
    const totals = trafficTotals(trafficLogs);
    const ports = uniqueNumbers(trafficLogs.map((log) => log.dstPort));
    const sequenceRatio = consecutiveRatio(ports);
    const randomizedRatio = ports.length > 20 ? 1 - sequenceRatio : 0;
    const excessivePortScore = normalized(ports.length, 1000) * 45;
    const sequentialScore = sequenceRatio * 30;
    const randomizedScore = randomizedRatio * 20;
    const sourceScore = normalized(sourceIpList(trafficLogs).length, 10) * 5;
    const baseScore = excessivePortScore + Math.max(sequentialScore, randomizedScore) + sourceScore;

    const evidence = {
      detectionType: "PORT_SCAN",
      excessivePortRequests: ports.length >= 25,
      sequentialScan: sequenceRatio >= 0.7,
      randomizedScan: randomizedRatio >= 0.65,
      scannedPortCount: ports.length,
      scannedPorts: ports.slice(0, 200),
      sourceIps: sourceIpList(trafficLogs),
      targetNodeId: targetNodeId(attack, trafficLogs),
      targetIp: targetIp(attack, trafficLogs),
      trafficLogCount: totals.count,
      packetCount: totals.packets,
      ruleSignals: {
        excessivePortScore,
        sequentialScore,
        randomizedScore,
        sequenceRatio,
        randomizedRatio,
      },
    };

    return classifier.classify({
      baseScore,
      riskAmplifier: ports.length > 500 ? 10 : 0,
      confidence:
        0.5 + Math.min(0.45, ports.length / 1000 + Math.max(sequenceRatio, randomizedRatio) * 0.25),
      evidence,
    });
  }
}
