export function isValidIpv4(value) {
  if (typeof value !== "string") return false;
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255 && String(n) === String(Number.parseInt(part, 10));
  });
}

export function randomExternalIp() {
  return `198.51.100.${randomInt(1, 254)}`;
}

export function randomEphemeralPort() {
  return randomInt(49152, 65535);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
