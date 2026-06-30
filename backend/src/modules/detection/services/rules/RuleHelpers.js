import { parseJson } from "../../../../common/utils/json.js";

export function trafficTotals(logs) {
  return logs.reduce(
    (acc, log) => {
      acc.bytes += (log.bytesIn ?? 0) + (log.bytesOut ?? 0);
      acc.packets += log.packets ?? 0;
      acc.count += 1;
      if (log.sourceIp) acc.sourceIps.add(log.sourceIp);
      if (log.destNodeId) acc.targetNodeIds.add(log.destNodeId);
      if (log.destIp) acc.targetIps.add(log.destIp);
      return acc;
    },
    {
      count: 0,
      packets: 0,
      bytes: 0,
      sourceIps: new Set(),
      targetNodeIds: new Set(),
      targetIps: new Set(),
    },
  );
}

export function metadataOf(log) {
  return log.metadata ?? parseJson(log.metadata_json, {});
}

export function uniqueNumbers(values) {
  return [...new Set(values.filter((value) => Number.isInteger(value)))];
}

export function consecutiveRatio(numbers) {
  if (numbers.length < 2) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  let consecutive = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] === sorted[i - 1] + 1) consecutive += 1;
  }

  return consecutive / (sorted.length - 1);
}

export function normalized(value, max) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

export function sourceIpList(logs) {
  return [...new Set(logs.map((log) => log.sourceIp).filter(Boolean))];
}

export function targetNodeId(attack, logs) {
  return attack.targetNodeId ?? logs.find((log) => log.destNodeId)?.destNodeId ?? null;
}

export function targetIp(attack, logs) {
  return attack.destIp ?? logs.find((log) => log.destIp)?.destIp ?? null;
}
