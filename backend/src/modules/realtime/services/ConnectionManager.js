import { DashboardEvents } from "../events/DashboardEvents.js";

export class ConnectionManager {
  constructor({ namespace, logger = null }) {
    this.namespace = namespace;
    this.logger = logger;
    this.connections = new Map();
  }

  bind() {
    this.namespace.on("connection", (socket) => {
      const connectedAt = new Date().toISOString();

      this.connections.set(socket.id, {
        id: socket.id,
        connectedAt,
        recovered: socket.recovered,
        rooms: [],
      });
      this.logger?.info("socket_connected", {
        socketId: socket.id,
        recovered: socket.recovered,
        connectedClients: this.connections.size,
      });

      socket.emit(DashboardEvents.CONNECTION_READY, {
        socketId: socket.id,
        connectedAt,
        recovered: socket.recovered,
        connectedClients: this.connections.size,
        namespace: this.namespace.name,
        events: [
          DashboardEvents.ALERT_CREATED,
          DashboardEvents.ATTACK_DETECTED,
          DashboardEvents.NODE_UPDATED,
          DashboardEvents.ANALYTICS_UPDATED,
          DashboardEvents.NETWORK_HEALTH_UPDATED,
          DashboardEvents.THREAT_DETECTED,
        ],
      });

      socket.on("dashboard_subscribe", (room) => {
        if (typeof room !== "string" || room.length > 80) return;
        socket.join(room);
        this.updateRooms(socket);
      });

      socket.on("dashboard_unsubscribe", (room) => {
        if (typeof room !== "string" || room.length > 80) return;
        socket.leave(room);
        this.updateRooms(socket);
      });

      socket.on("client_ping", (payload = {}) => {
        socket.emit(DashboardEvents.SERVER_PONG, {
          receivedAt: new Date().toISOString(),
          payload,
        });
      });

      socket.on("disconnect", (reason) => {
        const existing = this.connections.get(socket.id);
        if (existing) {
          this.connections.set(socket.id, {
            ...existing,
            disconnectedAt: new Date().toISOString(),
            disconnectReason: reason,
          });
        }
        this.connections.delete(socket.id);
        this.logger?.info("socket_disconnected", {
          socketId: socket.id,
          reason,
          connectedClients: this.connections.size,
        });
      });
    });
  }

  count() {
    return this.connections.size;
  }

  list() {
    return [...this.connections.values()];
  }

  updateRooms(socket) {
    const existing = this.connections.get(socket.id);
    if (!existing) return;

    this.connections.set(socket.id, {
      ...existing,
      rooms: [...socket.rooms].filter((room) => room !== socket.id),
    });
  }
}
