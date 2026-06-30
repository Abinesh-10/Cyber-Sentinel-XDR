import { normalized, sourceIpList, targetIp, targetNodeId, trafficTotals } from "./RuleHelpers.js";

export class DdosDetectionRule {
  supports(attackType) {
    return attackType === "DDOS";
  }

  evaluate({ attack, trafficLogs, classifier }) {
    const totals = trafficTotals(trafficLogs);
    const sourceIps = sourceIpList(trafficLogs);
    const trafficSpikeScore = normalized(totals.packets, 50000) * 35;
    const floodingScore = normalized(totals.bytes, 50_000_000) * 35;
    const distributedSourceScore = normalized(sourceIps.length, 50) * 20;
    const intensityScore = normalized(attack.intensity ?? 0, 100) * 10;
    const baseScore = trafficSpikeScore + floodingScore + distributedSourceScore + intensityScore;

    const evidence = {
      detectionType: "DDOS",
      abnormalTrafficSpike: trafficSpikeScore >= 18,
      trafficFlooding: floodingScore >= 18,
      sourceIpCount: sourceIps.length,
      sourceIps,
      targetNodeId: targetNodeId(attack, trafficLogs),
      targetIp: targetIp(attack, trafficLogs),
      affectedNodeIds: [...totals.targetNodeIds],
      trafficLogCount: totals.count,
      packetCount: totals.packets,
      byteCount: totals.bytes,
      ruleSignals: {
        trafficSpikeScore,
        floodingScore,
        distributedSourceScore,
        intensityScore,
      },
    };

    return classifier.classify({
      baseScore,
      riskAmplifier: sourceIps.length > 20 ? 8 : 0,
      confidence: confidenceFromSignals([
        evidence.abnormalTrafficSpike,
        evidence.trafficFlooding,
        sourceIps.length > 5,
      ]),
      evidence,
    });
  }
}

function confidenceFromSignals(signals) {
  return 0.45 + signals.filter(Boolean).length * 0.17;
}
