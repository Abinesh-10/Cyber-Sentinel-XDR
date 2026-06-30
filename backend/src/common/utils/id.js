import { randomUUID } from "node:crypto";

export function createId(prefix = "") {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function createNodeKey() {
  return `NODE-${randomUUID().slice(0, 8).toUpperCase()}`;
}
