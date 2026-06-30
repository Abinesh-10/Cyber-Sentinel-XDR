export class ThreatClassifier {
  classify({ baseScore, riskAmplifier = 0, confidence = 0.5, evidence = {} }) {
    const score = clampScore(baseScore);
    const riskScore = clampScore(score + riskAmplifier);

    return {
      score,
      riskScore,
      severity: severityFromScore(score),
      confidence: clampConfidence(confidence),
      evidence,
    };
  }
}

export function severityFromScore(score) {
  if (score >= 76) return "CRITICAL";
  if (score >= 51) return "HIGH";
  if (score >= 26) return "MEDIUM";
  return "LOW";
}

export function clampScore(value) {
  return Number(Math.max(0, Math.min(100, Number(value) || 0)).toFixed(2));
}

export function clampConfidence(value) {
  return Number(Math.max(0, Math.min(1, Number(value) || 0)).toFixed(3));
}
