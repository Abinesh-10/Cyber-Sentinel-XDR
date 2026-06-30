export function clampScore(value) {
  return Number(Math.max(0, Math.min(100, Number(value) || 0)).toFixed(2));
}

export function roundMetric(value, digits = 2) {
  const n = Number(value) || 0;
  return Number(n.toFixed(digits));
}

export function percentage(numerator, denominator) {
  if (!denominator) return 0;
  return roundMetric((numerator / denominator) * 100);
}

export function severityWeight(severity) {
  const weights = {
    LOW: 15,
    MEDIUM: 40,
    HIGH: 70,
    CRITICAL: 95,
  };

  return weights[severity] ?? 0;
}

export function statusRiskPenalty(status, health) {
  if (status === "COMPROMISED" || health === "CRIT") return 25;
  if (status === "DEGRADED" || health === "WARN") return 12;
  if (status === "OFFLINE") return 18;
  if (status === "MAINTENANCE") return 5;
  return 0;
}
