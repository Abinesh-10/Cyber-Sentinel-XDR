export const AlertStatus = Object.freeze({
  OPEN: "OPEN",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  IGNORED: "IGNORED",
});

export const AlertSeverity = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

const STATUS_VALUES = new Set(Object.values(AlertStatus));
const SEVERITY_VALUES = new Set(Object.values(AlertSeverity));

export function assertValidStatus(status) {
  if (!STATUS_VALUES.has(status)) {
    throw new Error("Alert status must be OPEN, INVESTIGATING, RESOLVED, or IGNORED");
  }
}

export function assertValidSeverity(severity) {
  if (!SEVERITY_VALUES.has(severity)) {
    throw new Error("Alert severity must be LOW, MEDIUM, HIGH, or CRITICAL");
  }
}

export function isActiveStatus(status) {
  return status === AlertStatus.OPEN || status === AlertStatus.INVESTIGATING;
}
