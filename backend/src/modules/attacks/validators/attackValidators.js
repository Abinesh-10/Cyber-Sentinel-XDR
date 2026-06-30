import { badRequest } from "../../../common/http/errors.js";
import { isValidIpv4 } from "../../../common/utils/ip.js";

const PORT_SCAN_MODES = new Set(["SEQUENTIAL", "RANDOM"]);
const BRUTE_FORCE_SERVICES = new Set(["SSH", "RDP", "SMB", "HTTP_LOGIN"]);
const MALWARE_FAMILIES = new Set(["WORM", "RANSOMWARE", "TROJAN", "BOTNET"]);

export function validateTargetPayload(input) {
  if (!input || typeof input !== "object") {
    throw badRequest("Request body must be an object");
  }

  if (!input.targetNodeId && !input.destIp) {
    throw badRequest("targetNodeId or destIp is required");
  }

  if (input.destIp && !isValidIpv4(input.destIp)) {
    throw badRequest("destIp must be a valid IPv4 address");
  }
}

export function validateDdosPayload(input) {
  validateTargetPayload(input);
  validateIntensity(input.intensity);
}

export function validatePortScanPayload(input) {
  validateTargetPayload(input);

  if (input.mode && !PORT_SCAN_MODES.has(input.mode)) {
    throw badRequest("mode must be SEQUENTIAL or RANDOM");
  }

  if (input.portStart != null && !isPort(input.portStart)) {
    throw badRequest("portStart must be between 1 and 65535");
  }

  if (input.portEnd != null && !isPort(input.portEnd)) {
    throw badRequest("portEnd must be between 1 and 65535");
  }
}

export function validateBruteForcePayload(input) {
  validateTargetPayload(input);

  if (input.service && !BRUTE_FORCE_SERVICES.has(input.service)) {
    throw badRequest("service must be SSH, RDP, SMB, or HTTP_LOGIN");
  }

  if (input.attempts != null && !isPositiveInt(input.attempts, 5000)) {
    throw badRequest("attempts must be a positive integer no greater than 5000");
  }
}

export function validateSniffingPayload(input) {
  validateTargetPayload(input);

  if (input.sampleSize != null && !isPositiveInt(input.sampleSize, 1000)) {
    throw badRequest("sampleSize must be a positive integer no greater than 1000");
  }
}

export function validateMalwarePayload(input) {
  if (!input || typeof input !== "object") {
    throw badRequest("Request body must be an object");
  }

  if (!input.seedNodeId) {
    throw badRequest("seedNodeId is required");
  }

  if (input.malwareFamily && !MALWARE_FAMILIES.has(input.malwareFamily)) {
    throw badRequest("malwareFamily must be WORM, RANSOMWARE, TROJAN, or BOTNET");
  }

  validateIntensity(input.intensity);
}

export function normalizeIntensity(value, fallback = 50) {
  if (value == null) return fallback;
  return Math.max(1, Math.min(100, Number(value) || fallback));
}

export function severityFromIntensity(intensity) {
  if (intensity >= 85) return "CRITICAL";
  if (intensity >= 60) return "HIGH";
  if (intensity >= 30) return "MEDIUM";
  return "LOW";
}

function validateIntensity(value) {
  if (value == null) return;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 100) {
    throw badRequest("intensity must be between 1 and 100");
  }
}

function isPort(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

function isPositiveInt(value, max) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max;
}
