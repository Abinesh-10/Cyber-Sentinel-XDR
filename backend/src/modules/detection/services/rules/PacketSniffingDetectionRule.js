import {
  metadataOf,
  normalized,
  sourceIpList,
  targetIp,
  targetNodeId,
  trafficTotals,
} from "./RuleHelpers.js";

export class PacketSniffingDetectionRule {
  supports(attackType) {
    return attackType === "PACKET_SNIFFING";
  }

  evaluate({ attack, trafficLogs, classifier }) {
    const totals = trafficTotals(trafficLogs);
    const mirroredLogs = trafficLogs.filter((log) => log.status === "MIRRORED");
    const interceptedLogs = trafficLogs.filter(
      (log) => log.flags === "INTERCEPTED" || metadataOf(log).intercepted === true,
    );
    const monitoringScore = normalized(mirroredLogs.length, 250) * 35;
    const interceptionScore = normalized(interceptedLogs.length, 250) * 35;
    const volumeScore = normalized(totals.bytes, 10_000_000) * 20;
    const protocolBreadthScore =
      normalized(new Set(trafficLogs.map((log) => log.protocol)).size, 8) * 10;
    const baseScore = monitoringScore + interceptionScore + volumeScore + protocolBreadthScore;

    const evidence = {
      detectionType: "PACKET_SNIFFING",
      suspiciousPacketMonitoring: mirroredLogs.length >= 10,
      unauthorizedPacketCapture: interceptedLogs.length >= 10,
      monitoredFlowCount: trafficLogs.length,
      mirroredLogCount: mirroredLogs.length,
      interceptedLogCount: interceptedLogs.length,
      observedProtocols: [...new Set(trafficLogs.map((log) => log.protocol))],
      sourceIps: sourceIpList(trafficLogs),
      targetNodeId: targetNodeId(attack, trafficLogs),
      targetIp: targetIp(attack, trafficLogs),
      packetCount: totals.packets,
      byteCount: totals.bytes,
      ruleSignals: {
        monitoringScore,
        interceptionScore,
        volumeScore,
        protocolBreadthScore,
      },
    };

    return classifier.classify({
      baseScore,
      riskAmplifier: interceptedLogs.length > 100 ? 8 : 0,
      confidence: 0.5 + Math.min(0.45, (mirroredLogs.length + interceptedLogs.length) / 500),
      evidence,
    });
  }
}
