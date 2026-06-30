import { randomExternalIp, randomEphemeralPort, randomInt } from "../../../../common/utils/ip.js";

export function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function pickRandom(items) {
  return items[randomInt(0, items.length - 1)];
}

export function buildSourcePool(count) {
  return Array.from({ length: count }, () => randomExternalIp());
}

export function sumTraffic(logs) {
  return logs.reduce(
    (acc, log) => {
      acc.bytes += log.bytesIn + log.bytesOut;
      acc.packets += log.packets;
      return acc;
    },
    { bytes: 0, packets: 0 },
  );
}

export function commonTrafficFields(attackId, metadata = {}) {
  return {
    attackId,
    anomalyScore: 95,
    status: "ALLOWED",
    metadata: {
      generatedBy: "AttackSimulationEngine",
      ...metadata,
    },
  };
}

export function portForService(service) {
  const ports = {
    SSH: 22,
    RDP: 3389,
    SMB: 445,
    HTTP_LOGIN: 443,
  };

  return ports[service] ?? 443;
}

export { randomExternalIp, randomEphemeralPort, randomInt };
