export const DashboardEvents = Object.freeze({
  ALERT_CREATED: "alert_created",
  ATTACK_DETECTED: "attack_detected",
  NODE_UPDATED: "node_updated",
  ANALYTICS_UPDATED: "analytics_updated",
  NETWORK_HEALTH_UPDATED: "network_health_updated",
  THREAT_DETECTED: "threat_detected",
  CONNECTION_READY: "connection_ready",
  SERVER_PONG: "server_pong",
});

export function eventTypeForDashboardEvent(eventName) {
  const types = {
    [DashboardEvents.ALERT_CREATED]: "ALERT",
    [DashboardEvents.ATTACK_DETECTED]: "ATTACK",
    [DashboardEvents.NODE_UPDATED]: "NODE",
    [DashboardEvents.ANALYTICS_UPDATED]: "ANALYTICS",
    [DashboardEvents.NETWORK_HEALTH_UPDATED]: "SYSTEM",
    [DashboardEvents.THREAT_DETECTED]: "THREAT",
    [DashboardEvents.CONNECTION_READY]: "SYSTEM",
    [DashboardEvents.SERVER_PONG]: "SYSTEM",
  };

  return types[eventName] ?? "SYSTEM";
}
