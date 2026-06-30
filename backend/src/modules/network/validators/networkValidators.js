import { badRequest } from "../../../common/http/errors.js";
import { isValidIpv4 } from "../../../common/utils/ip.js";

const STATUSES = new Set(["ONLINE", "OFFLINE", "DEGRADED", "COMPROMISED", "MAINTENANCE"]);
const HEALTH = new Set(["OK", "WARN", "CRIT"]);

export function validateCreateNode(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    throw badRequest("Request body must be an object");
  }

  if (!input.ipAddress || !isValidIpv4(input.ipAddress)) {
    errors.push("ipAddress must be a valid IPv4 address");
  }

  if (!input.deviceName && !input.name) {
    errors.push("deviceName is required");
  }

  if (!input.deviceType && !input.type) {
    errors.push("deviceType is required");
  }

  if (input.status && !STATUSES.has(input.status)) {
    errors.push("status must be one of ONLINE, OFFLINE, DEGRADED, COMPROMISED, MAINTENANCE");
  }

  if (input.health && !HEALTH.has(input.health)) {
    errors.push("health must be one of OK, WARN, CRIT");
  }

  if (errors.length) {
    throw badRequest("Invalid node payload", errors);
  }
}

export function validateUpdateNode(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    throw badRequest("Request body must be an object");
  }

  if (input.ipAddress && !isValidIpv4(input.ipAddress)) {
    errors.push("ipAddress must be a valid IPv4 address");
  }

  if (input.status && !STATUSES.has(input.status)) {
    errors.push("status must be one of ONLINE, OFFLINE, DEGRADED, COMPROMISED, MAINTENANCE");
  }

  if (input.health && !HEALTH.has(input.health)) {
    errors.push("health must be one of OK, WARN, CRIT");
  }

  if (errors.length) {
    throw badRequest("Invalid node payload", errors);
  }
}

export function parsePositiveInt(value, fallback, max) {
  if (value == null) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}
