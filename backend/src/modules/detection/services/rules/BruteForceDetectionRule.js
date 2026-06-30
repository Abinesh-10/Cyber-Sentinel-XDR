import {
  metadataOf,
  normalized,
  sourceIpList,
  targetIp,
  targetNodeId,
  trafficTotals,
} from "./RuleHelpers.js";

const LOGIN_PROTOCOLS = new Set(["SSH", "RDP", "SMB", "HTTP_LOGIN"]);

export class BruteForceDetectionRule {
  supports(attackType) {
    return attackType === "BRUTE_FORCE";
  }

  evaluate({ attack, trafficLogs, classifier }) {
    const totals = trafficTotals(trafficLogs);
    const loginLogs = trafficLogs.filter((log) => LOGIN_PROTOCOLS.has(log.protocol));
    const failures = loginLogs.filter(
      (log) => log.flags === "AUTH_FAILURE" || metadataOf(log).outcome === "FAILURE",
    );
    const successes = loginLogs.filter(
      (log) => log.flags === "AUTH_SUCCESS" || metadataOf(log).outcome === "SUCCESS",
    );
    const failureScore = normalized(failures.length, 500) * 45;
    const attemptScore = normalized(loginLogs.length, 1000) * 25;
    const successImpactScore = successes.length > 0 ? 25 : 0;
    const sourceScore = normalized(sourceIpList(loginLogs).length, 10) * 5;
    const baseScore = failureScore + attemptScore + successImpactScore + sourceScore;

    const evidence = {
      detectionType: "BRUTE_FORCE",
      repeatedLoginFailures: failures.length >= 20,
      credentialAttackPattern:
        loginLogs.length >= 30 && failures.length / Math.max(1, loginLogs.length) >= 0.8,
      loginAttempts: loginLogs.length,
      failedAttempts: failures.length,
      successfulAttempts: successes.length,
      sourceIps: sourceIpList(loginLogs),
      targetNodeId: targetNodeId(attack, trafficLogs),
      targetIp: targetIp(attack, trafficLogs),
      trafficLogCount: totals.count,
      ruleSignals: {
        failureScore,
        attemptScore,
        successImpactScore,
        sourceScore,
      },
    };

    return classifier.classify({
      baseScore,
      riskAmplifier: successes.length > 0 ? 12 : 0,
      confidence: 0.45 + Math.min(0.5, failures.length / 500 + (successes.length > 0 ? 0.2 : 0)),
      evidence,
    });
  }
}
